import * as exec from "./mod.ts";
import * as sql from "../../sql/mod.ts";
import * as dzx from "https://deno.land/x/dzx@0.3.1/mod.ts";

export const DEFAULT_OSQI_PATH =
  Deno.env.get("RF_SQL_SHELL_OSQUERYI_LOCATION") ?? "/usr/local/bin/osqueryi";

export function osQuerySqlCmdProxyInit(
  osQueryClientPath = DEFAULT_OSQI_PATH,
) {
  return new exec.SqlCmdExecutive({
    prepareExecuteSqlCmd: (SQL) => {
      // https://osquery.io/
      return {
        // TODO: discover where osqueryi is installed or make it configurable
        cmd: [osQueryClientPath, "--json", SQL],
        stdout: "piped",
        stderr: "piped",
      };
    },
    events: () => {
      return new sql.SqlEventEmitter();
    },
  });
}

export const osQuerySqlCmdProxy = osQuerySqlCmdProxyInit(DEFAULT_OSQI_PATH);

export async function osQuerySqlInventory(
  databaseID: string,
  osQueryClientPath = DEFAULT_OSQI_PATH,
): Promise<sql.DbmsEngineSchemalessDatabase> {
  const tableColDefnRows: {
    table_name: string; // created in the mergedColumnDefns loop
    name: string; // found in `PRAGMA table_info(${tableName});`
    type: string; // found in `PRAGMA table_info(${tableName});`
    notnull: string; // found in `PRAGMA table_info(${tableName});`
    pk: string; // found in `PRAGMA table_info(${tableName});`
    dflt_value: string; // found in `PRAGMA table_info(${tableName});`
  }[] = [];

  const osqTableNamesProcess = await dzx.$`${osQueryClientPath} .tables`;
  const osqTableNames = osqTableNamesProcess.stdout.split("\n").map((line) =>
    line.replace("  => ", "")
  ).filter((t) => t.trim().length > 0);
  const describe = osqTableNames.map((tableName) =>
    `PRAGMA table_info(${tableName});`
  ).join("");
  const mergedColumnDefns = JSON.parse(
    (await dzx.$`${osQueryClientPath} --json ${describe}`).stdout,
  );
  let tableIndex = -1;
  let tableName = undefined;
  for (const columnDefn of mergedColumnDefns) {
    // every time the columnDefn.cid == 0, it means it's a new table
    if (columnDefn.cid == "0") {
      tableIndex++;
      tableName = osqTableNames[tableIndex];
    }
    tableColDefnRows.push({ table_name: tableName, ...columnDefn });
  }

  const filteredTables = (filter?: (t: sql.DbmsTable) => boolean) => {
    const tables: sql.DbmsTable[] = [];
    for (const tableID of osqTableNames) {
      const filteredColumns = (
        filter?: (t: sql.DbmsTableColumn) => boolean,
      ) => {
        const columns: sql.DbmsTableColumn[] = [];
        for (
          const cRow of tableColDefnRows.filter((tc) =>
            tc.table_name == tableID
          )
        ) {
          const columnID = cRow.name;
          const dataType = cRow.type;
          const column: sql.DbmsTableColumn = {
            identity: columnID,
            nature: dataType ? { identity: dataType } : undefined,
          };
          if (!filter || filter(column)) {
            columns.push(column);
          }
        }
        return columns;
      };
      const table: sql.DbmsTable = {
        identity: tableID,
        filteredColumns,
        columns: filteredColumns(),
      };
      if (!filter || filter(table)) {
        tables.push(table);
      }
    }
    return tables;
  };
  const db: sql.DbmsEngineSchemalessDatabase = {
    isSchemaDatabase: false,
    identity: databaseID,
    filteredTables,
    tables: filteredTables(),
  };
  return db;
}
