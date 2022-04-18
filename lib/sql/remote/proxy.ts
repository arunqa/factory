import * as govn from "./governance.ts";
import * as dbs from "./dbselector.ts";
import * as sql from "../governance.ts";
import * as git from "../shell/git.ts";
import * as fs from "../shell/fs.ts";
import * as osQ from "../shell/osquery.ts";
import * as shG from "../shell/governance.ts";

export interface SqlProxyArgs {
  readonly executeSQL: string;
  readonly executeSqlBindParams?: URLSearchParams;
  readonly databaseIdSelector?: dbs.UseDatabaseIdDetector;
}

export interface SqlProxyExecAttempted {
  readonly detectedUseDB?: govn.DetectedUseDBinSQL;
  readonly attempted: boolean;
  readonly whyNot?: "no-database-id-match";
  readonly reason: string;
}

export interface SqlProxyResult<Data> {
  readonly execAttempted: SqlProxyExecAttempted;
  readonly executedSQL?: string;
  readonly data?: Data;
}

export interface SqlProxySupplier<
  Data,
  Result extends SqlProxyResult<Data> = SqlProxyResult<Data>,
> {
  (args: SqlProxyArgs): Promise<Result>;
}

export function attemptExec(
  SQL: string,
  isDbID: ((dbID: string) => boolean) | undefined,
  databaseIdSelector: dbs.UseDatabaseIdDetector,
): SqlProxyExecAttempted {
  if (databaseIdSelector) {
    if (isDbID) {
      const detectedUseDB = databaseIdSelector.detectedUseDB(SQL);
      if (detectedUseDB) {
        if (isDbID(detectedUseDB.databaseID)) {
          return {
            detectedUseDB,
            attempted: true,
            reason: `detected databaseID '${detectedUseDB.databaseID}' matched`,
          };
        } else {
          return {
            detectedUseDB,
            attempted: false,
            whyNot: "no-database-id-match",
            reason:
              `detected databaseID '${detectedUseDB.databaseID}' did not match`,
          };
        }
      }
    }
  }

  return {
    attempted: true,
    reason: `database is not selectable, forcing use ${
      Deno.inspect({ isDbID, databaseIdSelector, SQL })
    }`,
  };
}

export function gitSQL(
  isGitDbID?: (dbID: string) => boolean,
  defaultDatabaseIdSelector = dbs.typicalUseDatabaseIdDetector,
): SqlProxySupplier<sql.QueryExecutionRecordsSupplier<sql.SqlRecord>> {
  return async (args) => {
    const execAttempted = attemptExec(
      args.executeSQL,
      isGitDbID,
      defaultDatabaseIdSelector,
    );
    if (execAttempted.attempted) {
      const executedSQL = execAttempted.detectedUseDB
        ? execAttempted.detectedUseDB.SQL
        : args.executeSQL;
      return {
        execAttempted,
        executedSQL,
        data: await git.gitSqlCmdProxy.recordsDQL(executedSQL),
      };
    }
    return {
      execAttempted,
    };
  };
}

export function fsSQL(
  isFsDbID?: (dbID: string) => boolean,
  defaultDatabaseIdSelector = dbs.typicalUseDatabaseIdDetector,
): SqlProxySupplier<sql.QueryExecutionRecordsSupplier<sql.SqlRecord>> {
  return async (args) => {
    const execAttempted = attemptExec(
      args.executeSQL,
      isFsDbID,
      defaultDatabaseIdSelector,
    );
    if (execAttempted.attempted) {
      const executedSQL = execAttempted.detectedUseDB
        ? execAttempted.detectedUseDB.SQL
        : args.executeSQL;
      return {
        execAttempted,
        executedSQL,
        data: await fs.fileSysSqlCmdProxy.recordsDQL(executedSQL),
      };
    }
    return {
      execAttempted,
    };
  };
}

export function osQuerySQL(
  isOsQueryDbID?: (dbID: string) => boolean,
  defaultDatabaseIdSelector = dbs.typicalUseDatabaseIdDetector,
): SqlProxySupplier<sql.QueryExecutionRecordsSupplier<sql.SqlRecord>> {
  return async (args) => {
    const execAttempted = attemptExec(
      args.executeSQL,
      isOsQueryDbID,
      defaultDatabaseIdSelector,
    );
    if (execAttempted.attempted) {
      const executedSQL = execAttempted.detectedUseDB
        ? execAttempted.detectedUseDB.SQL
        : args.executeSQL;
      return {
        execAttempted,
        executedSQL,
        data: await osQ.osQuerySqlCmdProxy.recordsDQL(executedSQL),
      };
    }
    return {
      execAttempted,
    };
  };
}

export function multiSqlProxy(
  ...proxies: SqlProxySupplier<
    sql.QueryExecutionRecordsSupplier<sql.SqlRecord>
  >[]
): SqlProxySupplier<sql.QueryExecutionRecordsSupplier<sql.SqlRecord>> {
  return async (args) => {
    const tried = [];
    for (const proxy of proxies) {
      const proxyResult = await proxy(args);
      if (proxyResult.execAttempted && proxyResult.data) {
        return proxyResult;
      }
      tried.push({ proxy, proxyResult });
    }

    return {
      execAttempted: {
        attempted: false,
        whyNot: "no-database-id-match",
        reason:
          `multiSqlProxyResult did not find any databases to execute against (tried ${
            Deno.inspect(tried)
          })`,
      },
    };
  };
}

export const commonIdentifiableSqlProxies = new Map<shG.CommonDatabaseID, {
  identity: shG.CommonDatabaseID;
  proxy: SqlProxySupplier<sql.QueryExecutionRecordsSupplier<sql.SqlRecord>>;
  inventorySupplier: () => Promise<sql.DbmsEngineDatabase>;
}>();
commonIdentifiableSqlProxies.set(shG.gitSqlDatabaseID, {
  identity: shG.gitSqlDatabaseID,
  proxy: gitSQL((dbID) => dbID == shG.gitSqlDatabaseID),
  // deno-lint-ignore require-await
  inventorySupplier: async () => git.gitSqlInventory(shG.gitSqlDatabaseID),
});
commonIdentifiableSqlProxies.set(shG.fileSysSqlDatabaseID, {
  identity: shG.fileSysSqlDatabaseID,
  proxy: fsSQL((dbID) => dbID == shG.fileSysSqlDatabaseID),
  // deno-lint-ignore require-await
  inventorySupplier: async () =>
    fs.fileSysSqlInventory(shG.fileSysSqlDatabaseID),
});
commonIdentifiableSqlProxies.set(shG.osQueryDatabaseID, {
  identity: shG.osQueryDatabaseID,
  proxy: osQuerySQL((dbID) => dbID == shG.osQueryDatabaseID),
  // deno-lint-ignore require-await
  inventorySupplier: async () => osQ.osQuerySqlInventory(shG.osQueryDatabaseID),
});

// this is a single convenience SqlProxy which will figure out the proper Proxy
// via the `USE DATABASE dbID;` database selector as the first line of SQL;
export const commonSqlAutoProxy = multiSqlProxy(
  ...Array.from(
    commonIdentifiableSqlProxies.values(),
  ).map((v) => v.proxy),
);
