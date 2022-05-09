import * as rs from "../../../../../../lib/sql/remote/governance.ts";
import * as govn from "./governance.ts";
import * as whs from "../../../../../../lib/text/whitespace.ts";
import * as sqlShG from "../../../../../../lib/sql/shell/governance.ts";

export const defaultDatabaseID = `prime` as const;
export const observabilityDatabaseID = `observability` as const;
export const publicationDatabaseID = `publication` as const;
export const pubctlDatabaseID = `pubctl` as const;

export type TypicalSqlStmtDatabaseID =
  | typeof defaultDatabaseID
  | typeof observabilityDatabaseID
  | typeof publicationDatabaseID
  | typeof pubctlDatabaseID
  | sqlShG.CommonDatabaseID;

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
  ): rs.SqlDatabase<TypicalSqlStmtDatabaseID> => {
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
  const tableObjectProps: govn.SqlStmtResultTableObjectPropsPresentation = {
    nature: "table-object-properties",
  };

  const qualifiedNamePlaceholder = "[TBD]";
  const defaultSqlStmt: govn.ServerRuntimeSqlStmt<TypicalSqlStmtDatabaseID> = {
    database: DB(observabilityDatabaseID),
    name: "health-check-failed",
    label:
      "Show entries in <code>health.json</code> with <bold>fail</bold> status",
    SQL: whs.unindentWhitespace(`
        USE DATABASE ${observabilityDatabaseID};\n
        SELECT *
        FROM service_health_component_status shcs
        WHERE shcs.status = 'fail';`),
    help:
      `These are the health checks performed by pubctl.ts and stored in health.json`,
    qualifiedName: qualifiedNamePlaceholder,
  };

  const result: govn.ServerRuntimeSqlStmtInventory<TypicalSqlStmtDatabaseID> = {
    identity,
    sqlStmt: (identity: string) => {
      return sqlStmtsIndex.get(identity);
    },
    sqlStmtIdentities: () => sqlStmtsIndex.keys(),
    defaultSqlStmt,
    libraries: [{
      name: "publication",
      label: "Publication",
      sqlStmts: [{
        database: DB(publicationDatabaseID),
        name: "resources-indexed",
        label: "Show all indexed resources",
        SQL: whs.unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT resource.media_type, resource_index.namespace, resource_index.[index], resource_route_terminal.qualified_path, resource_route_terminal.label
            FROM resource_index
           INNER JOIN resource ON resource.id = resource_index.resource_id
           INNER JOIN resource_route_terminal ON resource_route_terminal.resource_id = resource_index.resource_id
           LIMIT 25`),
        qualifiedName: qualifiedNamePlaceholder,
      }, {
        database: DB(publicationDatabaseID),
        name: "resources-frontmatter-top-level-keys",
        label: "Show the top level untyped frontmatter keys",
        SQL: whs.unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT distinct key->split('.')->[0] as key
            FROM resource_frontmatter
           ORDER BY key`),
        qualifiedName: qualifiedNamePlaceholder,
      }, {
        database: DB(publicationDatabaseID),
        name: "resources-model-top-level-keys",
        label: "Show the top level typed model keys",
        SQL: whs.unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT distinct key->split('.')->[0] as key
            FROM resource_model
           ORDER BY key`),
        qualifiedName: qualifiedNamePlaceholder,
      }, {
        database: DB(publicationDatabaseID),
        name: "persisted-without-originators",
        label: "Show persisted files not tied to instantiated resource",
        SQL: whs.unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT *
           FROM persisted
          WHERE resource_id < 0
          LIMIT 25`),
        qualifiedName: qualifiedNamePlaceholder,
      }, {
        database: DB(publicationDatabaseID),
        name: "resources-without-instantiation-provenance",
        label: "Show resources without instantiation provenance",
        SQL: whs.unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT *
            FROM resource
           WHERE resource.instantiator_id = 0
           LIMIT 50`),
        qualifiedName: qualifiedNamePlaceholder,
      }],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "housekeeping",
      label: "Housekeeping",
      sqlStmts: [{
        database: DB(defaultDatabaseID),
        name: "alaSQL-databases",
        label: "Show all the server runtime proxy databases defined",
        SQL: whs.unindentWhitespace(`SHOW DATABASES`),
        qualifiedName: qualifiedNamePlaceholder,
      }, {
        database: DB(defaultDatabaseID),
        name: "alaSQL-tables",
        label: "Show all tables in all proxyable databases",
        SQL: whs.unindentWhitespace(`
            SELECT db_name, table_name
              FROM prime.dbms_reflection_inventory
            GROUP BY db_name, table_name`),
        qualifiedName: qualifiedNamePlaceholder,
      }, {
        database: DB(defaultDatabaseID),
        name: "alaSQL-columns",
        label: "Show all columns across all tables in all proxyable databases",
        SQL: whs.unindentWhitespace(`
            SELECT *
              FROM prime.dbms_reflection_inventory`),
        qualifiedName: qualifiedNamePlaceholder,
      }],
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
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${observabilityDatabaseID};\n
            SELECT *
            FROM service_health_component_status shcs;`),
          help:
            `These are the health checks performed by pubctl.ts and stored in health.json`,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(observabilityDatabaseID),
          name: "fs-asset-metrics",
          label:
            "Show all file system paths outside of content and public (<mark>TODO</mark>: improve symlink follows)",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${observabilityDatabaseID};\n
            SELECT w.namespace, wp.dir
              FROM fs_walk w, fs_walk_path wp
             WHERE w.id = wp.walker_id
               AND not(wp.dir->startsWith('content')) and not(wp.dir->startsWith('public'));`),
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
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${pubctlDatabaseID}; -- pubctl.sqlite.db \n
                SELECT log.created_at, log.asset_nature, status, log.location_href, log.filesys_target_path, log.filesys_target_symlink
                FROM publ_server_static_access_log log
            ORDER BY log.created_at DESC
                LIMIT 100`),
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "revision-control-git",
      label: "Revision Control (Git)",
      sqlStmts: [{
        database: DB(sqlShG.gitSqlDatabaseID),
        name: "top-50-most-frequently-changed-annual",
        label:
          "Show top 50 files changed most frequently in the past year (warning: slow, might take 30+ seconds to compute)",
        SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.gitSqlDatabaseID}; -- https://github.com/mergestat/mergestat\n
            SELECT file_path, COUNT(*)
              FROM commits, stats('', commits.hash)
             WHERE commits.author_when > DATE('now', '-12 month')
               AND commits.parents < 2 -- ignore merge commits
             GROUP BY file_path
             ORDER BY COUNT(*) DESC
             LIMIT 50`),
        qualifiedName: qualifiedNamePlaceholder,
      }, {
        database: DB(sqlShG.gitSqlDatabaseID),
        name: "total-commit-counts-by-author",
        label: "Show total commits counts grouped by author",
        SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.gitSqlDatabaseID}; -- https://github.com/mergestat/mergestat\n
            SELECT count(*), author_email, author_name
              FROM commits
             WHERE parents < 2 -- ignore merge commits
             GROUP BY author_name, author_email ORDER BY count(*) DESC`),
        qualifiedName: qualifiedNamePlaceholder,
      }, {
        database: DB(sqlShG.gitSqlDatabaseID),
        name: "total-commit-counts-by-author-email-domain",
        label: "Show total commits counts grouped by email domain of author",
        SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.gitSqlDatabaseID}; -- https://github.com/mergestat/mergestat\n
            SELECT count(*), substr(author_email, instr(author_email, '@')+1) AS email_domain -- https://sqlite.org/lang_corefunc.html
              FROM commits
             WHERE parents < 2 -- ignore merge commits
             GROUP BY email_domain
             ORDER BY count(*) DESC`),
        qualifiedName: qualifiedNamePlaceholder,
      }],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "file-system",
      label: "File System",
      sqlStmts: [
        {
          database: DB(sqlShG.fileSysSqlDatabaseID),
          name: "image-dimensions",
          label: "Show images and their dimensions",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT CONCAT(width, 'x', height), path, size
              FROM content
             WHERE is_image and extension != 'svg'`),
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.fileSysSqlDatabaseID),
          name: "large-images",
          label: "Show large images (by dimension)",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT CONCAT(width, 'x', height), path, fsize, mime
              FROM content -- assumes current working directory is project home (usually true)
             WHERE width >= 500 and height >= 500`),
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.fileSysSqlDatabaseID),
          name: "project-path-statistics",
          label:
            "Show useful file system statistics (WARNING: can be slow, be careful)",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT MIN(size), MAX{size}, AVG(size), SUM{size}, COUNT(*)
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com`),
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.fileSysSqlDatabaseID),
          name: "project-path-image-statistics",
          label: "Show useful image statistics",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT MIN(size), MAX{size}, AVG(size), SUM{size}, COUNT(*)
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/content
             WHERE is_image and extension != 'svg'`),
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.fileSysSqlDatabaseID),
          name: "count-files-in-path",
          label: "Show total files in project path",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT count(*)
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com`),
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.fileSysSqlDatabaseID),
          name: "markdown-files-and-sizes",
          label: "Show markdown files in content path",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT size, path
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/content
             WHERE name = '*.md'
             LIMIT 50`),
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "osquery",
      label: "osQuery (operating system)",
      sqlStmts: [
        {
          database: DB(sqlShG.osQueryDatabaseID),
          name: "system-info",
          label: "Show system information",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT computer_name, hostname, cpu_brand, cpu_physical_cores, cpu_logical_cores, printf("%.2f", (physical_memory / 1024.0 / 1024.0 / 1024.0)) as memory_gb
            FROM system_info`),
          presentation: tableObjectProps,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.osQueryDatabaseID),
          name: "config-files-info",
          label: "Show output of all configuration files available via Augeas",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT *
             FROM augeas
            LIMIT 50`),
          presentation: tableObjectProps,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.osQueryDatabaseID),
          name: "hosts-info",
          label: "Show output of /etc/hosts using Augeas wrapper",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT *
             FROM augeas
            WHERE augeas.path = '/etc/hosts'`),
          presentation: tableObjectProps,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.osQueryDatabaseID),
          name: "FII-SCF-006-CRY-03-Transmission Confidentiality",
          label: "FII-SCF-006-CRY-03",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT valid_to FROM curl_certificate WHERE hostname = 'www.medigy.com'`),
          presentation: tableObjectProps,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.osQueryDatabaseID),
          name: "FII-SCF-003-BCD-11-Data Backups",
          label: "FII-SCF-003-BCD-11",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.osQueryDatabaseID}; -- https://osquery.io/\n
            select * from crontab`),
          presentation: tableObjectProps,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.osQueryDatabaseID),
          name: "FII-SCF-007-DCH-13.2-Portable Storage Devices",
          label: "FII-SCF-007-DCH-13.2",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT * FROM hardware_events`),
          presentation: tableObjectProps,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          database: DB(sqlShG.osQueryDatabaseID),
          name: "FII-SCF-005-MON-01.7-file-integrity-monitoring (FIM)",
          label: "FII-SCF-005-MON-01.7",
          SQL: whs.unindentWhitespace(`
            USE DATABASE ${sqlShG.osQueryDatabaseID}; -- https://osquery.io/\n
            select target_path, category, action, atime, mtime from file_events`),
          presentation: tableObjectProps,
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }],
  };

  const indexLibraries = (
    libraries: Iterable<
      rs.ServerRuntimeSqlStmtLibrary<TypicalSqlStmtDatabaseID>
    >,
  ) => {
    const indexSqlStmt = (
      sqlstmt: govn.ServerRuntimeSqlStmt<TypicalSqlStmtDatabaseID>,
      library: rs.ServerRuntimeSqlStmtLibrary<TypicalSqlStmtDatabaseID>,
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
