import { events } from "./deps.ts";
import { sqlite } from "./sqlite-deps.ts";
import * as ssts from "../../lib/db/sqlite-schema-ts.ts";

// nomenclature and conventions should follow PgDCP whenever possible

export interface DatabaseInit<DBEE extends DatabaseEventEmitter> {
  readonly storageFileName: () => string;
  readonly events: (db: Database<DBEE>) => DBEE;
  readonly autoCloseOnUnload?: boolean;
}

export interface QueryExecutionRowsSupplier<
  R extends sqlite.Row = sqlite.Row,
> {
  readonly rows: Array<R>;
  readonly SQL: string;
  readonly params?: sqlite.QueryParameterSet;
}

export interface QueryExecutionRecordsSupplier<
  O extends sqlite.RowObject = sqlite.RowObject,
> {
  readonly records: Array<O>;
  readonly SQL: string;
  readonly params?: sqlite.QueryParameterSet;
}

export interface QueryExecutionRecordSupplier<
  O extends sqlite.RowObject = sqlite.RowObject,
> extends QueryExecutionRecordsSupplier<O> {
  readonly record: O;
}

export interface QueryRowsExecutor {
  <R extends sqlite.Row = sqlite.Row>(
    SQL: string,
    params?: sqlite.QueryParameterSet,
  ): QueryExecutionRowsSupplier<R>;
}

export interface QueryRecordsExecutor {
  <O extends sqlite.RowObject = sqlite.RowObject>(
    SQL: string,
    params?: sqlite.QueryParameterSet,
  ): QueryExecutionRecordsSupplier<O>;
}

export interface ConnectionContext {
  readonly dbee: DatabaseEventEmitter;
  readonly rowsDQL: QueryRowsExecutor;
  readonly recordsDQL: QueryRecordsExecutor;
  readonly rowsDML: QueryRowsExecutor;
  readonly rowsDDL: QueryRowsExecutor;
}

export interface SqliteConnectionContext extends ConnectionContext {
  readonly dbStore: sqlite.DB;
  readonly dbStoreFsPath: string;
}

export class DatabaseEventEmitter extends events.EventEmitter<{
  openingDatabase(cc: ConnectionContext): void;
  openedDatabase(cc: ConnectionContext): void;
  closingDatabase(cc: ConnectionContext): void;
  closedDatabase(cc: ConnectionContext): void;

  constructStorage(cc: ConnectionContext): void;
  constructIdempotent(cc: ConnectionContext): void;
  populateSeedData(cc: ConnectionContext): void;

  executedDDL(result: QueryExecutionRowsSupplier): void;
  executedDML(result: QueryExecutionRowsSupplier): void;
  executedDQL(
    result:
      | QueryExecutionRowsSupplier
      | QueryExecutionRecordSupplier
      | QueryExecutionRecordsSupplier,
  ): void;
}> {
}

export class Database<DBEE extends DatabaseEventEmitter = DatabaseEventEmitter>
  implements ConnectionContext {
  readonly isConnectionContext = true;
  readonly dbStoreFsPath: string;
  readonly dbStore: sqlite.DB;
  readonly dbee: DBEE;
  readonly dbRefs: {
    activeHost?: { hostID: number };
  } = {};

  constructor(init: DatabaseInit<DBEE>) {
    this.dbStoreFsPath = init.storageFileName();
    this.dbStore = new sqlite.DB(this.dbStoreFsPath, { mode: "create" });
    this.dbee = init.events(this);

    if (init.autoCloseOnUnload) {
      globalThis.addEventListener("unload", () => this.close());
    }
  }

  close() {
    this.dbee.emitSync("closingDatabase", this);
    this.dbStore.close(true);
    this.dbee.emitSync("closedDatabase", this);
  }

  init() {
    this.dbee.emitSync("openingDatabase", this);

    this.dbee.on("openedDatabase", () => {
      this.dbee.emitSync("constructStorage", this);
      this.dbee.emitSync("constructIdempotent", this);
      this.dbee.emitSync("populateSeedData", this);
    });

    this.dbee.emitSync("openedDatabase", this);
  }

  rowsDDL<Row extends sqlite.Row>(
    SQL: string,
    params?: sqlite.QueryParameterSet | undefined,
  ): QueryExecutionRowsSupplier<Row> {
    const rows = this.dbStore.query<Row>(SQL, params);
    const result: QueryExecutionRowsSupplier<Row> = { rows, SQL, params };
    this.dbee.emit("executedDDL", result);
    return result;
  }

  rowsDML<Row extends sqlite.Row>(
    SQL: string,
    params?: sqlite.QueryParameterSet | undefined,
  ): QueryExecutionRowsSupplier<Row> {
    const rows = this.dbStore.query<Row>(SQL, params);
    const result: QueryExecutionRowsSupplier<Row> = { rows, SQL, params };
    this.dbee.emit("executedDML", result);
    return result;
  }

  insertedRecord<
    Insert extends Record<string, sqlite.QueryParameter>,
    Return extends sqlite.RowObject,
  >(
    insert: Insert,
    tableName: string,
    options?: {
      readonly insertSQL?: (
        suggestedSQL: (
          names: string[],
          insert: Insert,
        ) => string,
        insert: Insert,
        names: string[],
      ) => string;
      readonly afterInsertSQL?: (
        suggestedSQL: (
          names: string[],
          insert: Insert,
        ) => [string, sqlite.QueryParameterSet?],
        insert: Insert,
        names: string[],
      ) => [string, sqlite.QueryParameterSet?];
      readonly transformInserted?: (record: Record<string, unknown>) => Return;
      readonly onNotInserted?: (
        insert: Insert,
        names: string[],
        SQL: string,
        insertErr?: Error,
      ) => Return | undefined;
    },
  ): Return | undefined {
    const names: string[] = Object.keys(insert);
    const insertDML: (
      names: string[],
      values: Insert,
    ) => string = (names) => {
      // `insert into (col1, col2, ...) values (:col1, :col2, ...)`
      return `INSERT INTO ${tableName} (${names.join(", ")}) VALUES (${
        names.map((colName) => `:${colName}`)
      })`;
    };
    const insertSQL = (options?.insertSQL)
      ? options.insertSQL(insertDML, insert, names)
      : insertDML(names, insert);

    try {
      // first perform the insert
      this.rowsDML(insertSQL, insert);
    } catch (err) {
      if (options?.onNotInserted) {
        return options.onNotInserted(insert, names, insertSQL, err);
      }
      return undefined;
    }

    // now read the inserted record so we can get the ID and other values

    const afterInsertDQL: (
      names: string[],
      values: sqlite.QueryParameterSet,
    ) => [string, sqlite.QueryParameterSet?] = () => {
      return [`SELECT * from ${tableName} where rowid = last_insert_rowid()`];
    };
    const afterInsertArgs = (options?.afterInsertSQL)
      ? options.afterInsertSQL(afterInsertDQL, insert, names)
      : afterInsertDQL(names, insert);

    const [afterInsertSQL, afterInsertQPS] = afterInsertArgs;
    return this.firstRecordDQL<Return>(afterInsertSQL, afterInsertQPS, {
      enhance: options?.transformInserted,
      onNotFound: () => {
        if (options?.onNotInserted) {
          return options.onNotInserted(insert, names, afterInsertSQL);
        }
        return undefined;
      },
    });
  }

  rowsDQL<Row extends sqlite.Row>(
    SQL: string,
    params?: sqlite.QueryParameterSet | undefined,
  ): QueryExecutionRowsSupplier<Row> {
    const rows = this.dbStore.query<Row>(SQL, params);
    const result: QueryExecutionRowsSupplier<Row> = { rows, SQL, params };
    this.dbee.emit("executedDQL", result);
    return result;
  }

  recordsDQL<Object extends sqlite.RowObject>(
    SQL: string,
    params?: sqlite.QueryParameterSet | undefined,
  ): QueryExecutionRecordsSupplier<Object> {
    const records = this.dbStore.queryEntries<Object>(SQL, params);
    const result: QueryExecutionRecordsSupplier<Object> = {
      records,
      SQL,
      params,
    };
    this.dbee.emit("executedDQL", result);
    return result;
  }

  firstRecordDQL<Object extends sqlite.RowObject>(
    SQL: string,
    params?: sqlite.QueryParameterSet | undefined,
    options?: {
      readonly enhance?: (record: Record<string, unknown>) => Object;
      readonly onNotFound?: () => Object | undefined;
    },
  ): Object | undefined {
    const selected = this.recordsDQL<Object>(SQL, params);
    if (selected.records.length > 0) {
      const record = selected.records[0];
      if (options?.enhance) return options.enhance(record);
      return record;
    }
    return options?.onNotFound ? options.onNotFound() : undefined;
  }

  schemaTypescript() {
    return ssts.sqliteSchemaTypescript(this.dbStore);
  }
}
