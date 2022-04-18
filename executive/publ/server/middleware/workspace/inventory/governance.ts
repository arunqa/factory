// only import types because this is a user agent module
import * as rm from "../../../../../../lib/module/remote/governance.ts";
import * as rs from "../../../../../../lib/sql/remote/governance.ts";

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

export interface ServerRuntimeScript extends rm.ServerRuntimeScript {
  readonly help?: string;
  readonly presentation?: ScriptResultPresentationStrategy;
}

export interface ServerRuntimeScriptInventory
  extends rm.ServerRuntimeScriptInventory<ServerRuntimeScript> {
  readonly identity: string;
  readonly defaultScript?: ServerRuntimeScript;
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

export interface SqlStmtResultTableRecordsPresentation
  extends SqlStmtResultPresentationStrategy {
  readonly nature: "table-records";
}

export interface SqlStmtResultTableObjectPropsPresentation
  extends SqlStmtResultPresentationStrategy {
  readonly nature: "table-object-properties";
}

export interface ServerRuntimeSqlStmt<DatabaseID extends string>
  extends rs.ServerRuntimeSqlStmt<DatabaseID> {
  readonly help?: string;
  readonly presentation?: SqlStmtResultPresentationStrategy;
}

export interface ServerRuntimeSqlStmtInventory<DatabaseID extends string>
  extends rs.ServerRuntimeSqlStmtInventory<DatabaseID> {
  readonly identity: string;
  readonly defaultSqlStmt?: ServerRuntimeSqlStmt<DatabaseID>;
}
