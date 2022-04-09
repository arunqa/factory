export type ScriptResultPresentationNature =
  | "JSON-explorer"
  | "table-matrix"
  | "table-records"
  | "table-object-properties"
  | "table-aggrid-defn";

export interface ScriptResultPresentationStrategy {
  readonly nature: ScriptResultPresentationNature;
}

export interface ScriptResultTableRecordsPresentation
  extends ScriptResultPresentationStrategy {
  readonly nature: "table-records";
}

export interface ScriptResultTableObjectPropsPresentation
  extends ScriptResultPresentationStrategy {
  readonly nature: "table-object-properties";
}

export interface ServerRuntimeScript {
  readonly qualifiedName: string;
  readonly name: string;
  readonly label: string;
  readonly jsModule: string; // TODO: add tsModule for Typescript
  readonly help?: string;
  readonly presentation?: ScriptResultPresentationStrategy;
}

export interface ServerRuntimeScriptLibrary {
  readonly qualifiedName: string;
  readonly name: string;
  readonly label: string;
  readonly scripts: Iterable<ServerRuntimeScript>;
}

export interface ServerRuntimeScriptInventory {
  // should match governance/module.ts LocationSupplier interface
  readonly origin: {
    readonly moduleImportMetaURL: string;
  };
  readonly endpoints: {
    readonly eval: string;
    readonly module: string;
  };
  readonly libraries: Iterable<ServerRuntimeScriptLibrary>;
  readonly script: (identity: string) => ServerRuntimeScript | undefined;
  readonly defaultScript?: ServerRuntimeScript;
}

// deno-lint-ignore no-empty-interface
export interface ServerRuntimeScriptAccessCtx {
}

export interface ScriptInventorySupplier {
  (ctx: ServerRuntimeScriptAccessCtx): ServerRuntimeScriptInventory;
}

export type SqlStmtResultPresentationNature =
  | "JSON-explorer"
  | "table-matrix"
  | "table-records"
  | "table-object-properties"
  | "table-aggrid-defn";

export interface SqlStmtResultPresentationStrategy {
  readonly nature: SqlStmtResultPresentationNature;
}

export interface SqlDatabase<DatabaseID extends string> {
  readonly identity: DatabaseID;
}

export interface SqlStmtResultTableRecordsPresentation
  extends SqlStmtResultPresentationStrategy {
  readonly nature: "table-records";
}

export interface SqlStmtResultTableObjectPropsPresentation
  extends SqlStmtResultPresentationStrategy {
  readonly nature: "table-object-properties";
}

export interface ServerRuntimeSqlStmt<DatabaseID extends string> {
  readonly database: SqlDatabase<DatabaseID>;
  readonly qualifiedName: string;
  readonly name: string;
  readonly label: string;
  readonly SQL: string;
  readonly help?: string;
  readonly presentation?: SqlStmtResultPresentationStrategy;
}

export interface ServerRuntimeSqlStmtLibrary<DatabaseID extends string> {
  readonly qualifiedName: string;
  readonly name: string;
  readonly label: string;
  readonly sqlStmts: Iterable<ServerRuntimeSqlStmt<DatabaseID>>;
}

export interface ServerRuntimeSqlStmtInventory<DatabaseID extends string> {
  // should match governance/module.ts LocationSupplier interface
  readonly origin: {
    readonly moduleImportMetaURL: string;
  };
  readonly libraries: Iterable<ServerRuntimeSqlStmtLibrary<DatabaseID>>;
  readonly sqlStmt: (
    identity: string,
  ) => ServerRuntimeSqlStmt<DatabaseID> | undefined;
  readonly defaultSqlStmt?: ServerRuntimeSqlStmt<DatabaseID>;
}

// deno-lint-ignore no-empty-interface
export interface ServerRuntimeSqlStmtAccessCtx {
}

export interface SqlStmtInventorySupplier<DatabaseID extends string> {
  (
    ctx: ServerRuntimeSqlStmtAccessCtx,
  ): ServerRuntimeSqlStmtInventory<DatabaseID>;
}
