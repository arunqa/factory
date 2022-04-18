import { colors } from "../../../../core/deps.ts";
import { oak } from "../deps.ts";
import * as safety from "../../../../lib/safety/mod.ts";
import * as pDB from "../../publication-db.ts";
import * as p from "../../publication.ts";
import * as m from "../../../../lib/metrics/mod.ts";
import * as sql from "../../../../lib/sql/mod.ts";
import * as srg from "../../../../lib/sql/remote/governance.ts";
import * as srgd from "../../../../lib/sql/remote/guard.ts";
import * as srgp from "../../../../lib/sql/remote/proxy.ts";
import * as sqlShG from "../../../../lib/sql/shell/governance.ts";
import * as alaSQL from "../../../../lib/alasql/mod.ts";
import "../../../../lib/db/sql.ts"; // for window.globalSqlDbConns

export interface ResultNatureSupplier {
  readonly resultNature: "records" | "model" | "no-decoration";
}

const isResultNatureSupplier = safety.typeGuard<ResultNatureSupplier>(
  "resultNature",
);

export interface SqlSelectRequest extends srg.ForeignSqlStmtSupplier {
  readonly contentType?: "JSON" | "CSV";
}

export function isUseDatabaseResult(result: unknown): boolean {
  return typeof result === "object" && result && ("databaseid" in result)
    ? true
    : false;
}

export interface SqlPayload
  extends srg.ForeignSqlStmtSupplier, ResultNatureSupplier {
  readonly isError: Error | false;
  // deno-lint-ignore no-explicit-any
  readonly parsed: any; // TODO: type this, it's result of AlaSQL's parse()
  readonly isCustomSqlExecRequest: () => Promise<
    false | {
      readonly SQL: string;
      readonly data:
        | sql.QueryExecutionRowsSupplier
        | sql.QueryExecutionRecordsSupplier;
    }
  >;
  readonly respondWithJSON: (body: unknown, decycle?: boolean) => void;
  readonly respondWithText: (text: string) => void;
}

/**
 * Registers an endpoint (usually /SQL) which accepts arbitrary SQL and
 * executes it against the publication server's SQLite database which is used to
 * store access logs, errors, and other diagnostic information for the server.
 */
export class ServerRuntimeSqlProxyMiddlewareSupplier {
  readonly pubCtlAlaSqlProxyDbName = "pubctl";
  readonly customDatabaseIDs = [
    this.pubCtlAlaSqlProxyDbName,
    ...srgp.commonIdentifiableSqlProxies.keys(),
  ];
  readonly asp: alaSQL.AlaSqlProxy;

  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly database: pDB.PublicationDatabase | undefined,
    readonly htmlEndpointURL: string,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    this.asp = new alaSQL.AlaSqlProxy({
      events: (asp) => {
        const ee = new sql.SqlEventEmitter();
        ee.on("constructStorage", async () => {
          await this.prepareObservabilityDB();
          await this.prepareConfigDB();
          await this.prepareResourcesDB();
          if (this.database) {
            // this is a special "proxy" database that we handle special
            asp.alaSqlEngine(
              `CREATE DATABASE IF NOT EXISTS ${this.pubCtlAlaSqlProxyDbName}`,
            );
          }
          srgp.commonIdentifiableSqlProxies.forEach((sp) => {
            asp.alaSqlEngine(`CREATE DATABASE IF NOT EXISTS ${sp.identity}`);
          });
          asp.createJsFlexibleTableFromUntypedObjectArray(
            "dbms_reflection_prepare_db_tx_log",
            asp.defnTxLog,
          );
        });
        return ee;
      },
      customDbInventory: async (databaseID) => {
        switch (databaseID) {
          case this.pubCtlAlaSqlProxyDbName:
            return this.database
              ? this.asp.sqliteDbInventory(this.database, databaseID)
              : undefined;
          default: {
            const foundProxy = srgp.commonIdentifiableSqlProxies.get(
              databaseID as sqlShG.CommonDatabaseID,
            );
            return foundProxy
              ? await foundProxy.inventorySupplier()
              : undefined;
          }
        }
      },
    });

    if (this.database) {
      router.post(`${this.htmlEndpointURL}/publ/DQL`, async (ctx) => {
        try {
          const body = ctx.request.body();
          const payload = await body.value;
          if (srgd.isForeignSqlSelectStmtSupplier(payload)) {
            const resultNature = isResultNatureSupplier(payload)
              ? payload.resultNature
              : "rows";
            const result = resultNature == "rows"
              ? await this.database!.rowsDQL(payload.SQL)
              : await this.database!.recordsDQL(payload.SQL);
            ctx.response.body = JSON.stringify(result);
          }
        } catch (error) {
          ctx.response.body = JSON.stringify({ error: Deno.inspect(error) });
        }
      });
    } else {
      router.post(`${this.htmlEndpointURL}/publ/DQL`, (ctx) => {
        ctx.response.body = JSON.stringify({
          error: "pubctl SQLite database not supplied",
        });
      });
    }

    router.post(
      `${this.htmlEndpointURL}/asp`,
      async (ctx) => {
        const body = ctx.request.body();
        let json: unknown;
        let form: URLSearchParams;
        switch (body.type) {
          case "json":
            json = await body.value;
            if (srgd.isForeignSqlStmtSupplier(json)) {
              await this.handleSqlPayload(this.payload(json, ctx));
            }
            break;

          case "form":
            form = await body.value;
            form.get("SQL");
            await this.handleSqlPayload(this.payload(form, ctx));
            break;

          default:
            ctx.response.body = JSON.stringify(body);
        }
      },
    );
  }

  protected payload(
    ss: srg.ForeignSqlStmtSupplier | URLSearchParams,
    ctx: oak.Context,
  ): SqlPayload {
    let SQL: string;
    let resultNature:
      | "model"
      | "records"
      | "no-decoration" = "model";
    if (srgd.isForeignSqlStmtSupplier(ss)) {
      SQL = ss.SQL;
      if (isResultNatureSupplier(ss)) {
        resultNature = ss.resultNature;
      }
    } else {
      SQL = ss.get("SQL") ?? "select 'no SQL supplied'";
      const rn = ss.get("resultNature");
      if (rn && (rn == "model" || rn == "records" || rn == "no-decoration")) {
        resultNature = rn;
      }
    }

    // deno-lint-ignore no-explicit-any
    let parsed: any = undefined;
    let foundCustomDB: string | undefined = undefined;
    const useDatabaseRegEx = /^\s*USE\s*DATABASE\s*(\w+).*$/gmi;
    const useDatabaseMatch = useDatabaseRegEx.exec(SQL);
    if (useDatabaseMatch) {
      const useDB = useDatabaseMatch[1];
      foundCustomDB = this.customDatabaseIDs.find((db) => db == useDB);
      if (foundCustomDB) {
        SQL = SQL.replace(/^\s*USE\s*DATABASE.*$/mi, "").trim();
      }
    }
    if (!foundCustomDB) {
      try {
        parsed = this.asp.alaSqlEngine.parse(SQL);
      } catch (error) {
        // /^\s*USE\s*DATABASE\s*.*?;[\r\n]*?/i
        parsed = this.prepareErrorResponse(error, {
          isParseError: true,
          SQL,
          resultNature,
        });
      }
    }
    return {
      isError: parsed ? parsed.error : false,
      SQL,
      resultNature,
      respondWithJSON: (body) => {
        ctx.response.body = JSON.stringify(body);
      },
      respondWithText: (text) => {
        ctx.response.body = text;
      },
      parsed,
      isCustomSqlExecRequest: foundCustomDB
        ? (async () => {
          switch (foundCustomDB) {
            case this.pubCtlAlaSqlProxyDbName:
              return {
                SQL,
                // deno-lint-ignore no-explicit-any
                data: await this.database!.recordsDQL<any>(SQL),
              };

            default: {
              const foundProxy = srgp.commonIdentifiableSqlProxies.get(
                foundCustomDB! as sqlShG.CommonDatabaseID,
              );
              if (foundProxy) {
                const result = await foundProxy.proxy({ executeSQL: SQL });
                if (result.executedSQL && result.data) {
                  return {
                    SQL: result.executedSQL,
                    data: result.data,
                  };
                } else {
                  throw new Error(
                    `custom database '${foundCustomDB}' could not execute SQL`,
                    { cause: new Error(Deno.inspect(result)) },
                  );
                }
              }
              throw new Error(
                `custom database '${foundCustomDB}' has no handler`,
              );
            }
          }
        })
        : // deno-lint-ignore require-await
          (async () => false),
    };
  }

  protected async handleSqlPayload(payload: SqlPayload) {
    const { isError, SQL, parsed, resultNature, respondWithJSON } = payload;
    try {
      if (!this.asp.initialized) {
        // since preparing the databases might take time, only do this
        // if the endpoint is used the first time
        Deno.stdout.write(
          new TextEncoder().encode(colors.dim("Preparing SQL proxies...")),
        );
        const startInit = new Date();
        await this.asp.init();
        console.log(
          colors.dim(`done (${new Date().getTime() - startInit.getTime()}ms)`),
        );
      }

      if (isError) {
        respondWithJSON(isError);
        return;
      }

      const customSqlExec = await payload.isCustomSqlExecRequest();
      if (customSqlExec) {
        const data = sql.isQueryExecutionRecordsSupplier(customSqlExec.data)
          ? customSqlExec.data.records
          : customSqlExec.data.rows;
        respondWithJSON(
          resultNature == "model"
            ? sql.detectQueryResultModel(data, {
              enhance: {
                payload,
                isPublicationDbRequest: true,
                customSqlExec,
              },
            })
            : data,
        );
        return;
      }

      // this will throw an exception on errors, which will get trapped
      let result = this.asp.alaSqlEngine.exec(SQL);

      if (resultNature == "no-decoration") {
        respondWithJSON(JSON.stringify(result));
      } else {
        if (parsed?.statements.length > 1 && Array.isArray(result)) {
          const resultModels: sql.QueryResultModel[] = [];
          for (const r of result) {
            const model = sql.detectQueryResultModel(r, {
              enhance: { parsed },
            });
            if (model) resultModels.push(model);
          }
          if (
            resultModels.length == 2 &&
            isUseDatabaseResult(parsed.statements[0])
          ) {
            // special use case where result is just a "use database X;" statement
            // followed by a normal single query so let's rewrite the result and
            // fall through to the normal single statement result response
            result = resultModels[1].data;
          } else {
            const multiQueryResult: sql.QueryResultsModel = {
              nature: "multi-statements-result-models",
              resultModels,
              statementsAST: parsed,
            };
            respondWithJSON(multiQueryResult);
            return; // be sure to exit and not "fall through to single-result"
          }
        }
        respondWithJSON(
          resultNature == "model"
            ? sql.detectQueryResultModel(result, { enhance: { payload } })
            : result,
        );
      }
    } catch (error) {
      respondWithJSON(
        this.prepareErrorResponse(error, { payload }),
      );
    }
  }

  // deno-lint-ignore no-explicit-any
  prepareErrorResponse(error: any, context: Record<string, unknown>) {
    error = error.toString();
    const result = {
      nature: "error-exception",
      error,
      ...context,
      databases: this.asp.alaSqlEngine.exec("SHOW DATABASES"),
      defnTxLog: this.asp.defnTxLog,
    };
    // TODO, for common errors like "Table does not exist" add more context
    // like list of tables, etc.
    return result;
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
    this.asp.createJsFlexibleTableFromUntypedObjectArray(
      "globalSqlDbConns",
      window.globalSqlDbConns
        ? Array.from(window.globalSqlDbConns.entries()).map((e) => {
          const [connection_name, conn] = e;
          return { connection_name, conn_pool: conn.dbConnPool };
        })
        : [{
          isLiveReloadRequest:
            this.publication.config.operationalCtx.isLiveReloadRequest,
          help: "PostgreSQL Globals being ignored during reload request",
        }],
      configDB,
    );
  }

  // deno-lint-ignore require-await
  async prepareResourcesDB() {
    const pomDB = new this.asp.alaSqlEngine.Database("resource");
    this.asp.createJsObjectSingleRowTable(
      "prime",
      this.publication,
      pomDB,
    );
    this.asp.createJsFlexibleTableFromUntypedObjectArray(
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

    if (this.publication.state.assetsMetrics) {
      this.asp.createJsFlexibleTableFromUntypedArray(
        "fs_asset_metric",
        this.publication.state.assetsMetrics.pathExtnsColumns,
        this.publication.state.assetsMetrics.pathExtnsColumnHeaders,
        observabilityDB,
      );
    }
  }
}
