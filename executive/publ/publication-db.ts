import { events } from "../../core/deps.ts";
import { sqlite } from "./deps.ts";
import * as s from "./static.ts";

// nomenclature and conventions should follow PgDCP whenever possible

export interface DatabaseInit<
  Transactions extends DatabaseTransactions,
  DBEE extends DatabaseEventEmitter,
> {
  readonly fileName: () => string;
  readonly events: (db: Database<Transactions, DBEE>) => DBEE;
  readonly transactions: (db: Database<Transactions, DBEE>) => Transactions;
  readonly autoCloseOnUnload: boolean;
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
    result: QueryExecutionRowsSupplier | QueryExecutionRecordsSupplier,
  ): void;

  persistedStaticServed(
    sat: s.StaticServedTarget,
    qers: QueryExecutionRowsSupplier | QueryExecutionRecordsSupplier,
  ): void;
}> {
}

export interface DatabaseTransactions {
  persistStaticServed(sat: s.StaticServedTarget): void;
}

export class Database<
  Transactions extends DatabaseTransactions = DatabaseTransactions,
  DBEE extends DatabaseEventEmitter = DatabaseEventEmitter,
> implements ConnectionContext {
  readonly isConnectionContext = true;
  readonly dbStoreFsPath: string;
  readonly dbStore: sqlite.DB;
  readonly dbee: DBEE;
  readonly dbTX: Transactions;

  constructor(init: DatabaseInit<Transactions, DBEE>) {
    this.dbStoreFsPath = init.fileName();
    this.dbStore = new sqlite.DB(this.dbStoreFsPath, { mode: "create" });
    this.dbee = init.events(this);
    this.dbTX = init.transactions(this);

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

    this.dbee.on("constructIdempotent", () => {
      this.rowsDDL(
        `CREATE TABLE IF NOT EXISTS publ_server_static_access_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status int NOT NULL,
        asset_nature text NOT NULL,
        location_href text NOT NULL,
        filesys_target_path text NOT NULL,
        filesys_target_symlink text)`,
      );
    });

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

  persistStaticServed(
    sat: s.StaticServedTarget,
  ): QueryExecutionRowsSupplier | QueryExecutionRecordsSupplier {
    const result = this.rowsDML(
      `INSERT INTO publ_server_static_access_log
                   (status, asset_nature, location_href, filesys_target_path, filesys_target_symlink)
            VALUES (?, ?, ?, ?, ?)`,
      [
        sat.status,
        sat.extn,
        sat.locationHref,
        sat.fsTarget,
        sat.fsTargetSymLink,
      ],
    );
    this.dbee.emit("persistedStaticServed", sat, result);
    return result;
  }
}
