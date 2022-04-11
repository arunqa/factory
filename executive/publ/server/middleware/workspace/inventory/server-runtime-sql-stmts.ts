import * as govn from "./governance.ts";

export const defaultDatabaseID = `prime` as const;
export const configDatabaseID = `config` as const;
export const observabilityDatabaseID = `observability` as const;
export const pubctlDatabaseID = `pubctl` as const;

export type TypicalSqlStmtDatabaseID =
  | typeof defaultDatabaseID
  | typeof configDatabaseID
  | typeof observabilityDatabaseID
  | typeof pubctlDatabaseID;

export const defaultSqlStmtID = "health-check-failed";

// inventory is used as-is by the server-side but used as a reference by client;
// for security purposes, the user agent ("UA" or "client") is allowed to see
// the sqlStmts but if the sqlstmt is passed into the server, the server ignores
// the sqlStmt and uses what is in the catalog. By letting clients see the
export function typicalSqlStmtsInventory(
  identity = "typicalSqlStmts",
): govn.ServerRuntimeSqlStmtInventory<
  TypicalSqlStmtDatabaseID
> {
  const sqlStmtsIndex = new Map<
    string,
    govn.ServerRuntimeSqlStmt<TypicalSqlStmtDatabaseID>
  >();

  const DB = (
    identity: TypicalSqlStmtDatabaseID,
  ): govn.SqlDatabase<TypicalSqlStmtDatabaseID> => {
    return {
      identity,
    };
  };

  const _jsonExplorer: govn.SqlStmtResultPresentationStrategy = {
    nature: "JSON-explorer",
  };
  const _tableMatrix: govn.SqlStmtResultPresentationStrategy = {
    nature: "table-matrix",
  };
  const _tableRecords: govn.SqlStmtResultTableRecordsPresentation = {
    nature: "table-records",
  };
  const _tableObjectProps: govn.SqlStmtResultTableObjectPropsPresentation = {
    nature: "table-object-properties",
  };

  const qualifiedNamePlaceholder = "[TBD]";
  const defaultSqlStmt: govn.ServerRuntimeSqlStmt<TypicalSqlStmtDatabaseID> = {
    database: DB(observabilityDatabaseID),
    name: "health-check-failed",
    label:
      "Show entries in <code>health.json</code> with <bold>fail</bold> status",
    SQL: `
        USE DATABASE ${observabilityDatabaseID};\n
        SELECT *
        FROM health_check hc
        WHERE hc.status = 'fail';`,
    help:
      `These are the health checks performed by pubctl.ts and stored in health.json`,
    qualifiedName: qualifiedNamePlaceholder,
  };

  const result: govn.ServerRuntimeSqlStmtInventory<TypicalSqlStmtDatabaseID> = {
    identity,
    origin: {
      moduleImportMetaURL: import.meta.url,
    },
    sqlStmt: (identity: string) => {
      return sqlStmtsIndex.get(identity);
    },
    defaultSqlStmt,
    libraries: [{
      name: "housekeeping",
      label: "Housekeeping",
      sqlStmts: [
        {
          database: DB(defaultDatabaseID),
          name: "alaSQL-DDL",
          label: "Show all the server runtime proxy tables defined",
          SQL: `
            USE DATABASE ${defaultDatabaseID};\n
            SELECT *
            FROM dbms_reflection_prepare_db_tx_log txLog
            WHERE txLog.error is NULL`,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(defaultDatabaseID),
          name: "alaSQL-DDL-errors",
          label: "Show all the server runtime proxy tables definition errors",
          SQL: `
            USE DATABASE ${defaultDatabaseID};\n
            SELECT *
              FROM dbms_reflection_prepare_db_tx_log txLog
             WHERE txLog.error is not NULL`,
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "config",
      label: "Config",
      sqlStmts: [
        {
          database: DB(configDatabaseID),
          name: "server-runtime-environment",
          label: "Show environment variables seen by the server runtime",
          SQL: `
            USE DATABASE ${configDatabaseID};\n
              SELECT *
                FROM environment env
            ORDER BY env.var_name`,
          qualifiedName: qualifiedNamePlaceholder,
          help:
            `These are all the environment variables known to the publication server (<code>pubctl.ts</code>) <mark>including sensitive values without masking</mark>.
            <em>Be careful about copy/pasting this content</em>.
            If you need a "sanitized" version of environment variables, there is a safer version in <code>health.json</code> as a health check.`,
        },
        {
          database: DB(configDatabaseID),
          name: "content-database-connections",
          label: "Show database connections used to generate content",
          SQL: `
            USE DATABASE ${configDatabaseID};\n
            SELECT *
            FROM globalSqlDbConns conns`,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(configDatabaseID),
          name: "operationalCtx",
          label: "Show pubctl.ts server operational context (live reload)",
          SQL: `
                USE DATABASE ${configDatabaseID};\n
                SELECT operationalCtx
                FROM prime;`,
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "observability",
      label: "Observability",
      sqlStmts: [
        defaultSqlStmt,
        {
          database: DB(observabilityDatabaseID),
          name: "health-check-full",
          label: "Show all entries in <code>health.json</code>",
          SQL: `
            USE DATABASE ${observabilityDatabaseID};\n
            SELECT *
            FROM health_check hc;`,
          help:
            `These are the health checks performed by pubctl.ts and stored in health.json`,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(observabilityDatabaseID),
          name: "fs-asset-metrics",
          label:
            "Show all file system asset metrics (<mark>TODO</mark>: figure out why 'public' is not showing all counts, issue with symlinks not being followed?)",
          SQL: `
            USE DATABASE ${observabilityDatabaseID};\n
            SELECT *
                FROM fs_asset_metric fsam
            WHERE fsam.[Files Path] in ('content', 'public');`,
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "pubctl-server",
      label: "PubCtl Server",
      sqlStmts: [
        {
          database: DB(pubctlDatabaseID),
          name: "most-recent-access-log",
          label:
            "Show 100 most recent entries in the pubctl.ts server access log",
          SQL: `
            USE DATABASE ${pubctlDatabaseID};\n
                SELECT log.created_at, log.asset_nature, status, log.location_href, log.filesys_target_path, log.filesys_target_symlink
                FROM publ_server_static_access_log log
            ORDER BY log.created_at DESC
                LIMIT 100`,
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }],
  };

  const indexLibraries = (
    libraries: Iterable<
      govn.ServerRuntimeSqlStmtLibrary<TypicalSqlStmtDatabaseID>
    >,
  ) => {
    const indexSqlStmt = (
      sqlstmt: govn.ServerRuntimeSqlStmt<TypicalSqlStmtDatabaseID>,
      library: govn.ServerRuntimeSqlStmtLibrary<TypicalSqlStmtDatabaseID>,
    ) => {
      if (sqlstmt.qualifiedName == qualifiedNamePlaceholder) {
        // special cast required since sqlstmt.qualifiedName is read-only
        (sqlstmt as { qualifiedName: string }).qualifiedName =
          `${identity}_${library.name}_${sqlstmt.name}`;
      }
      sqlStmtsIndex.set(sqlstmt.qualifiedName, sqlstmt);
    };

    for (const library of libraries) {
      if (library.qualifiedName == qualifiedNamePlaceholder) {
        // special cast required since library.qualifiedName is read-only
        (library as { qualifiedName: string }).qualifiedName = library.name;
      }
      for (const sqlstmt of library.sqlStmts) {
        indexSqlStmt(sqlstmt, library);
      }
    }
  };

  indexLibraries(result.libraries);
  return result;
}

export const defaultSqlStmtSupplier: govn.SqlStmtInventorySupplier<
  TypicalSqlStmtDatabaseID
> = () => typicalSqlStmtsInventory();

export default defaultSqlStmtSupplier;
