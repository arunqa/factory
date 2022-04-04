import { oak } from "../deps.ts";
import * as safety from "../../../../lib/safety/mod.ts";
import * as pDB from "../../publication-db.ts";
import * as p from "../../publication.ts";
import * as m from "../../../../lib/metrics/mod.ts";
import * as sqlG from "../../../../lib/sql/governance.ts";
import * as alaSQL from "../../../../lib/alasql/mod.ts";

export const firstWordRegEx = /^\s*([a-zA-Z0-9]+)/;

export const firstWord = (text: string) => {
  const firstWordMatch = text.match(firstWordRegEx);
  if (firstWordMatch && firstWordMatch.length > 1) {
    return firstWordMatch[1].toUpperCase();
  }
  return false;
};

export const isSelectStatement = (candidateSQL: string) => {
  const command = firstWord(candidateSQL);
  return (command && command == "SELECT");
};

export interface SqlSupplier {
  readonly SQL: string;
}

const isSqlSupplier = safety.typeGuard<SqlSupplier>("SQL");

export interface RowNatureSupplier {
  readonly rowNature: "rows" | "records";
}

const isRowNatureSupplier = safety.typeGuard<RowNatureSupplier>("rowNature");

export interface SqlSelectRequest extends SqlSupplier {
  readonly contentType?: "JSON" | "CSV";
}

export function isDatabaseProxySqlSelectService(
  o: unknown,
): o is SqlSelectRequest {
  if (isSqlSupplier(o)) {
    if (isSelectStatement(o.SQL)) return true;
  }
  return false;
}

/**
 * Registers an endpoint (usually /SQL) which accepts arbitrary SQL and
 * executes it against the publication server's SQLite database which is used to
 * store access logs, errors, and other diagnostic information for the server.
 */
export class SqlProxyMiddlewareSupplier {
  readonly asp: alaSQL.AlaSqlProxy;

  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly database: pDB.PublicationDatabase,
    readonly htmlEndpointURL: string,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    this.asp = new alaSQL.AlaSqlProxy({
      events: (asp) => {
        const ee = new sqlG.SqlEventEmitter();
        ee.on("constructStorage", async () => {
          await this.prepareObservabilityDB();
          await this.prepareConfigDB();
          await this.prepareResourcesDB();
          asp.importSqliteDB(this.database, () => {
            asp.alaSqlEngine("DROP DATABASE IF EXISTS pubctl");
            return new asp.alaSqlEngine.Database("pubctl");
          });
          asp.createJsFlexibleTable(
            "dbms_reflection_prepare_db_tx_log",
            asp.defnTxLog,
          );
          // add a denormalized table in case users want to see it that way
          asp.createJsFlexibleTable(
            "dbms_reflection_inventory",
            asp.inventoryTable(),
          );
          // add the object model in case user's want to see it that way
          asp.createJsFlexibleTable(
            "dbmsInventory",
            asp.engines(),
          );
        });
        return ee;
      },
    });

    router.post(`${this.htmlEndpointURL}/publ/DQL`, async (ctx) => {
      const body = ctx.request.body();
      const payload = await body.value;
      if (isDatabaseProxySqlSelectService(payload)) {
        const rowNature = isRowNatureSupplier(payload)
          ? payload.rowNature
          : "rows";
        const result = rowNature == "rows"
          ? this.database.rowsDQL(payload.SQL)
          : this.database.recordsDQL(payload.SQL);
        ctx.response.body = JSON.stringify(result);
      }
    });

    router.post(
      `${this.htmlEndpointURL}/asp`,
      async (ctx) => {
        const body = ctx.request.body();
        let json: unknown;
        let form: URLSearchParams;
        switch (body.type) {
          case "json":
            json = await body.value;
            if (isSqlSupplier(json)) {
              await this.handleSqlPayload(ctx, json);
            }
            break;

          case "form":
            form = await body.value;
            form.get("SQL");
            await this.handleSqlPayload(ctx, form);
            break;

          default:
            ctx.response.body = JSON.stringify(body);
        }
      },
    );
  }

  async handleSqlPayload(ctx: oak.Context, ss: SqlSupplier | URLSearchParams) {
    try {
      if (!this.asp.initialized) {
        // since preparing the databases might take time, only do this
        // if the endpoint is used the first time
        await this.asp.init();
      }

      if (isSqlSupplier(ss)) {
        ctx.response.body = JSON.stringify(
          this.asp.alaSqlEngine.exec(ss.SQL),
        );
      } else {
        const SQL = ss.get("SQL");
        ctx.response.body = JSON.stringify(
          this.asp.alaSqlEngine.exec(SQL),
        );
      }
    } catch (error) {
      ctx.response.body = JSON.stringify({
        error: error.toString(),
        ss,
        databases: this.asp.alaSqlEngine.exec("SHOW DATABASES"),
        defnTxLog: this.asp.defnTxLog,
      });
    }
  }

  // deno-lint-ignore require-await
  async prepareConfigDB() {
    const configDB = new this.asp.alaSqlEngine.Database("config");
    this.asp.createJsObjectSingleRowTable(
      "prime",
      this.publication.config,
      configDB,
    );
    this.asp.createJsObjectsTable(
      "environment",
      Array.from(Object.entries(Deno.env.toObject())).map((envEntry) => ({
        var_name: envEntry[0],
        var_value: envEntry[1],
      })),
      configDB,
    );
  }

  // deno-lint-ignore require-await
  async prepareResourcesDB() {
    const pomDB = new this.asp.alaSqlEngine.Database("pom");
    this.asp.createJsObjectSingleRowTable(
      "prime",
      this.publication,
      pomDB,
    );
    this.asp.createJsFlexibleTable(
      "resource",
      // deno-lint-ignore ban-types
      this.publication.state.resourcesIndex.resourcesIndex as object[],
      pomDB,
    );
    this.asp.createJsObjectsTable(
      "resource_persisted",
      Array.from(this.publication.state.persistedIndex.persistedDestFiles).map(
        (entry) => ({ destFileName: entry[0], ...entry[1] }),
      ),
      pomDB,
    );
  }

  async prepareObservabilityDB() {
    const observabilityDB = new this.asp.alaSqlEngine.Database(
      "observability",
    );
    const healthChecks = await this.publication.config.observability
      ?.serviceHealthComponentsChecks();
    if (healthChecks) {
      const records: Record<string, unknown>[] = [];
      for (const hc of Object.entries(healthChecks)) {
        const [category, checks] = hc;
        for (const check of checks) {
          records.push({ category, ...check });
        }
      }
      this.asp.createJsObjectsTable(
        "health_check",
        records,
        observabilityDB,
      );
    }

    const pomUniversalMetrics = m.tabularMetrics(
      this.publication.config.metrics.instances,
    );
    this.asp.createJsObjectsTable(
      "universal_metric",
      pomUniversalMetrics.metrics,
      observabilityDB,
    );
    this.asp.createJsObjectsTable(
      "universal_metric_instance",
      pomUniversalMetrics.metricInstances,
      observabilityDB,
    );
    this.asp.createJsObjectsTable(
      "universal_metric_label",
      pomUniversalMetrics.metricLabels,
      observabilityDB,
    );
    this.asp.createJsObjectsTable(
      "universal_metric_instance_label",
      pomUniversalMetrics.metricInstanceLabels,
      observabilityDB,
    );
  }
}
