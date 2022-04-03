import { alaSQL, oak } from "../deps.ts";
import * as safety from "../../../../lib/safety/mod.ts";
import * as pDB from "../../publication-db.ts";
import * as p from "../../publication.ts";
import * as m from "../../../../lib/metrics/mod.ts";
import * as sqlite from "../../../../lib/db/sqlite-db.ts";

// deno-lint-ignore no-explicit-any
export type AlaSqlDatabase = any;

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
  #alaSqlVirtualDB: AlaSqlDatabase;
  #alaSqlDbPrepared = false;
  #alaSqlPrepLog: Record<string, unknown>[] = [];

  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly database: pDB.PublicationDatabase,
    readonly htmlEndpointURL: string,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

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
      this.htmlEndpointURL,
      async (ctx) => {
        const body = ctx.request.body();
        const payload = await body.value;
        if (isSqlSupplier(payload)) {
          try {
            if (!this.#alaSqlDbPrepared) {
              // since preparing the databases might take time, only do this
              // if the endpoint is used the first time
              await this.prepareVirtualDB();
            }

            ctx.response.body = JSON.stringify(
              this.#alaSqlVirtualDB.exec(payload.SQL),
            );
          } catch (error) {
            ctx.response.body = JSON.stringify({
              error: error.toString(),
              payload,
              databases: new alaSQL.default("SHOW DATABASES"),
              prepLog: this.#alaSqlPrepLog,
            });
          }
        }
      },
    );
  }

  async prepareVirtualDB() {
    if (this.#alaSqlDbPrepared) return;

    this.#alaSqlVirtualDB = new alaSQL.default.Database("prime");
    await this.prepareObservabilityDB();
    await this.prepareConfigDB();
    await this.prepareResourcesDB();
    this.importSqliteDB(this.database, () => {
      alaSQL.default("DROP DATABASE IF EXISTS pubctl");
      return new alaSQL.default.Database("pubctl");
    });
    // store the logs as a table, you can use this to find errors:
    // => select * from prepare_db_tx_log where error is not null
    this.createJsFlexibleTable("prepare_db_tx_log", this.#alaSqlPrepLog);
    this.#alaSqlDbPrepared = true;
  }

  jsDDL(
    tableName: string,
    columnDefns: Iterable<string>,
  ): string {
    return `CREATE TABLE ${tableName} (\n ${
      // use [colName] so that reserved SQL keywords can be used as column name
      Array.from(columnDefns).map((colName) => `[${colName}]`).join(",\n ")
    })`;
  }

  // deno-lint-ignore ban-types
  jsObjectDDL<TableRow extends object = object>(
    tableName: string,
    inspectable: TableRow,
    options?: {
      valueSqlTypeMap?: (value: unknown) => string | undefined;
      prepareTxLogEntry?: (
        suggested: Record<string, unknown>,
        inspected: TableRow | Record<string, unknown>,
      ) => Record<string, unknown>;
    },
  ): { DDL?: string; txLogEntry: Record<string, unknown> } {
    const { valueSqlTypeMap, prepareTxLogEntry } = options ?? {};

    const columnDefns = [];
    for (const entry of Object.entries(inspectable)) {
      const [name, value] = entry;
      columnDefns.push(
        valueSqlTypeMap ? `${name} ${valueSqlTypeMap(value)}` : name,
      );
    }
    const DDL = this.jsDDL(tableName, columnDefns);
    // inspected may be large so we don't add it to the log by default
    const txLogEntry: Record<string, unknown> = { DDL, tableName, columnDefns };
    return {
      DDL,
      txLogEntry: prepareTxLogEntry
        ? prepareTxLogEntry(txLogEntry, inspectable)
        : txLogEntry,
    };
  }

  // deno-lint-ignore ban-types
  createJsObjectSingleRowTable<TableRow extends object = object>(
    tableName: string,
    tableRow: TableRow,
    database = this.#alaSqlVirtualDB,
    options?: {
      valueSqlTypeMap?: (value: unknown) => string | undefined;
      prepareTxLogEntry?: (
        suggested: Record<string, unknown>,
        inspected: TableRow | Record<string, unknown>,
      ) => Record<string, unknown>;
    },
  ) {
    const defn = this.jsObjectDDL(tableName, tableRow, options);
    if (defn.DDL) {
      try {
        database.exec(defn.DDL);
        database.tables[tableName].data = [tableRow];
        this.#alaSqlPrepLog.push(defn.txLogEntry);
      } catch (error) {
        this.#alaSqlPrepLog.push({
          origin: "createJsObjectSingleRowTable",
          error: error.toString(),
          ...defn.txLogEntry,
        });
      }
      return defn;
    }
  }

  // deno-lint-ignore ban-types
  createJsObjectsTable<TableRow extends object = object>(
    tableName: string,
    tableRows?: Array<TableRow>,
    database = this.#alaSqlVirtualDB,
    options?: {
      structureSupplier?: (rows?: Array<TableRow>) => TableRow | undefined;
      valueSqlTypeMap?: (value: unknown) => string | undefined;
      prepareTxLogEntry?: (
        suggested: Record<string, unknown>,
      ) => Record<string, unknown>;
    },
  ) {
    // every row is the same structure, so inspect just the first to detect structure
    // deno-lint-ignore ban-types
    const inspectFirstRow = (rows?: object[]) => {
      return rows ? (rows.length > 0 ? rows[0] : undefined) : undefined;
    };

    const { structureSupplier = inspectFirstRow, prepareTxLogEntry } =
      options ?? {};
    const inspectable = structureSupplier(tableRows);
    const tableRowsCount = tableRows ? tableRows.length : undefined;
    const origin = "createJsObjectsTable";
    if (inspectable) {
      const defn = this.jsObjectDDL(tableName, inspectable, {
        prepareTxLogEntry: (suggested) => {
          const result = { ...suggested, tableRowsCount };
          return prepareTxLogEntry ? prepareTxLogEntry(result) : result;
        },
        valueSqlTypeMap: options?.valueSqlTypeMap,
      });
      if (defn.DDL) {
        try {
          database.exec(defn.DDL);
          if (tableRows) database.tables[tableName].data = tableRows;
          this.#alaSqlPrepLog.push(defn.txLogEntry);
        } catch (error) {
          this.#alaSqlPrepLog.push({
            origin,
            error: error.toString(),
            ...defn.txLogEntry,
          });
        }
        return defn;
      }
    } else {
      const txLogEntry = {
        origin,
        error: `no inspectable object supplied, ${tableName} not created`,
        tableName,
        tableRowsCount,
      };
      this.#alaSqlPrepLog.push(
        prepareTxLogEntry ? prepareTxLogEntry(txLogEntry) : txLogEntry,
      );
    }
  }

  createJsFlexibleTable(
    tableName: string,
    // deno-lint-ignore ban-types
    tableRows?: Array<object>,
    database = this.#alaSqlVirtualDB,
  ) {
    const tableRowsCount = tableRows ? tableRows.length : undefined;
    const origin = "createJsFlexibleTable";
    if (tableRows) {
      // each row might have different columns so find the set of all columns
      // across all rows and create a "flexible table"
      const columnDefns = new Map<string, { foundInRows: number }>();
      for (const row of tableRows) {
        for (const entry of Object.entries(row)) {
          const [name] = entry;
          const found = columnDefns.get(name);
          if (found) found.foundInRows++;
          else columnDefns.set(name, { foundInRows: 1 });
        }
      }
      const DDL = this.jsDDL(tableName, columnDefns.keys());
      const txLogEntry = {
        DDL,
        tableName,
        tableRowsCount,
        columnDefns: Object.fromEntries(columnDefns),
      };
      try {
        database.exec(DDL);
        if (tableRows) database.tables[tableName].data = tableRows;
        this.#alaSqlPrepLog.push(txLogEntry);
      } catch (error) {
        this.#alaSqlPrepLog.push({
          origin,
          error: error.toString(),
          ...txLogEntry,
        });
      }
    } else {
      this.#alaSqlPrepLog.push({
        origin,
        error: `no tableRows supplied, ${tableName} not created`,
        tableName,
        tableRowsCount,
      });
    }
  }

  importSqliteDB(
    sqliteDb: sqlite.Database,
    alaSqlDbSupplier: (sqliteDb: sqlite.Database) => AlaSqlDatabase,
  ) {
    const alaSqlDB = alaSqlDbSupplier(sqliteDb);
    const tables = sqliteDb.dbStore.query<[tableName: string]>(
      "SELECT name from sqlite_master where type = 'table' and name != 'sqlite_sequence'",
    );
    for (const table of tables) {
      const [tableName] = table;
      const rows = sqliteDb.recordsDQL(`SELECT * FROM ${tableName}`);
      if (rows) {
        this.createJsObjectsTable(tableName, rows.records, alaSqlDB, {
          prepareTxLogEntry: (suggested) => ({
            ...suggested,
            origin: "importSqliteDB",
            originSqlLiteDbStoreFsPath: sqliteDb.dbStoreFsPath,
          }),
        });
      }
    }
  }

  // deno-lint-ignore require-await
  async prepareConfigDB() {
    const configDB = new alaSQL.default.Database("config");
    this.createJsObjectSingleRowTable(
      "prime",
      this.publication.config,
      configDB,
    );
    this.createJsObjectsTable(
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
    const pomDB = new alaSQL.default.Database("pom");
    this.createJsObjectSingleRowTable(
      "prime",
      this.publication,
      pomDB,
    );
    this.createJsFlexibleTable(
      "resource",
      // deno-lint-ignore ban-types
      this.publication.state.resourcesIndex.resourcesIndex as object[],
      pomDB,
    );
    this.createJsObjectsTable(
      "resource_persisted",
      Array.from(this.publication.state.persistedIndex.persistedDestFiles).map(
        (entry) => ({ destFileName: entry[0], ...entry[1] }),
      ),
      pomDB,
    );
  }

  async prepareObservabilityDB() {
    const observabilityDB = new alaSQL.default.Database("observability");
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
      this.createJsObjectsTable("health_check", records, observabilityDB);
    }

    const pomUniversalMetrics = m.tabularMetrics(
      this.publication.config.metrics.instances,
    );
    this.createJsObjectsTable(
      "universal_metric",
      pomUniversalMetrics.metrics,
      observabilityDB,
    );
    this.createJsObjectsTable(
      "universal_metric_instance",
      pomUniversalMetrics.metricInstances,
      observabilityDB,
    );
    this.createJsObjectsTable(
      "universal_metric_label",
      pomUniversalMetrics.metricLabels,
      observabilityDB,
    );
    this.createJsObjectsTable(
      "universal_metric_instance_label",
      pomUniversalMetrics.metricInstanceLabels,
      observabilityDB,
    );
  }
}
