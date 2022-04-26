// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function minWhitespaceIndent(text) {
    const match = text.match(/^[ \t]*(?=\S)/gm);
    return match ? match.reduce((r, a)=>Math.min(r, a.length)
    , Infinity) : 0;
}
function unindentWhitespace(text, removeInitialNewLine = true) {
    const indent = minWhitespaceIndent(text);
    const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");
    const result = text.replace(regex, "");
    return removeInitialNewLine ? result.replace(/^\n/, "") : result;
}
const fileSysSqlDatabaseID = "fssql";
const gitSqlDatabaseID = "gitsql";
const osQueryDatabaseID = "osquery";
const defaultDatabaseID = `prime`;
const configDatabaseID = `config`;
const observabilityDatabaseID = `observability`;
const pubctlDatabaseID = `pubctl`;
const defaultSqlStmtID = "health-check-failed";
function typicalSqlStmtsInventory(identity1 = "typicalSqlStmts") {
    const sqlStmtsIndex = new Map();
    const DB = (identity)=>{
        return {
            identity
        };
    };
    const tableObjectProps = {
        nature: "table-object-properties"
    };
    const qualifiedNamePlaceholder = "[TBD]";
    const defaultSqlStmt = {
        database: DB(observabilityDatabaseID),
        name: "health-check-failed",
        label: "Show entries in <code>health.json</code> with <bold>fail</bold> status",
        SQL: unindentWhitespace(`
        USE DATABASE ${observabilityDatabaseID};\n
        SELECT *
        FROM service_health_component_status shcs
        WHERE shcs.status = 'fail';`),
        help: `These are the health checks performed by pubctl.ts and stored in health.json`,
        qualifiedName: qualifiedNamePlaceholder
    };
    const result = {
        identity: identity1,
        sqlStmt: (identity)=>{
            return sqlStmtsIndex.get(identity);
        },
        sqlStmtIdentities: ()=>sqlStmtsIndex.keys()
        ,
        defaultSqlStmt,
        libraries: [
            {
                name: "housekeeping",
                label: "Housekeeping",
                sqlStmts: [
                    {
                        database: DB(defaultDatabaseID),
                        name: "alaSQL-databases",
                        label: "Show all the server runtime proxy databases defined",
                        SQL: unindentWhitespace(`SHOW DATABASES`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(defaultDatabaseID),
                        name: "alaSQL-tables",
                        label: "Show all tables in all proxyable databases",
                        SQL: unindentWhitespace(`
            SELECT db_name, table_name
              FROM prime.dbms_reflection_inventory
            GROUP BY db_name, table_name`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(defaultDatabaseID),
                        name: "alaSQL-columns",
                        label: "Show all columns across all tables in all proxyable databases",
                        SQL: unindentWhitespace(`
            SELECT *
              FROM prime.dbms_reflection_inventory`),
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "config",
                label: "Config",
                sqlStmts: [
                    {
                        database: DB(configDatabaseID),
                        name: "server-runtime-environment",
                        label: "Show environment variables seen by the server runtime",
                        SQL: unindentWhitespace(`
            USE DATABASE ${configDatabaseID};\n
              SELECT *
                FROM environment env
            ORDER BY env.var_name`),
                        qualifiedName: qualifiedNamePlaceholder,
                        help: unindentWhitespace(`These are all the environment variables known to the publication server (<code>pubctl.ts</code>) <mark>including sensitive values without masking</mark>.
            <em>Be careful about copy/pasting this content</em>.
            If you need a "sanitized" version of environment variables, there is a safer version in <code>health.json</code> as a health check.`)
                    },
                    {
                        database: DB(configDatabaseID),
                        name: "content-database-connections",
                        label: "Show database connections used to generate content",
                        SQL: unindentWhitespace(`
            USE DATABASE ${configDatabaseID};\n
            SELECT *
            FROM globalSqlDbConns conns`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(configDatabaseID),
                        name: "operationalCtx",
                        label: "Show pubctl.ts server operational context (live reload)",
                        SQL: unindentWhitespace(`
            USE DATABASE ${configDatabaseID};\n
            SELECT operationalCtx
            FROM prime;`),
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "observability",
                label: "Observability",
                sqlStmts: [
                    defaultSqlStmt,
                    {
                        database: DB(observabilityDatabaseID),
                        name: "health-check-full",
                        label: "Show all entries in <code>health.json</code>",
                        SQL: unindentWhitespace(`
            USE DATABASE ${observabilityDatabaseID};\n
            SELECT *
            FROM service_health_component_status shcs;`),
                        help: `These are the health checks performed by pubctl.ts and stored in health.json`,
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(observabilityDatabaseID),
                        name: "fs-asset-metrics",
                        label: "Show all file system paths outside of content and public (<mark>TODO</mark>: improve symlink follows)",
                        SQL: unindentWhitespace(`
            USE DATABASE ${observabilityDatabaseID};\n
            SELECT w.namespace, wp.dir
              FROM fs_walk w, fs_walk_path wp
             WHERE w.id = wp.walker_id
               AND not(wp.dir->startsWith('content')) and not(wp.dir->startsWith('public'));`),
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "pubctl-server",
                label: "PubCtl Server",
                sqlStmts: [
                    {
                        database: DB(pubctlDatabaseID),
                        name: "most-recent-access-log",
                        label: "Show 100 most recent entries in the pubctl.ts server access log",
                        SQL: unindentWhitespace(`
            USE DATABASE ${pubctlDatabaseID}; -- pubctl.sqlite.db \n
                SELECT log.created_at, log.asset_nature, status, log.location_href, log.filesys_target_path, log.filesys_target_symlink
                FROM publ_server_static_access_log log
            ORDER BY log.created_at DESC
                LIMIT 100`),
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "revision-control-git",
                label: "Revision Control (Git)",
                sqlStmts: [
                    {
                        database: DB(gitSqlDatabaseID),
                        name: "top-50-most-frequently-changed-annual",
                        label: "Show top 50 files changed most frequently in the past year (warning: slow, might take 30+ seconds to compute)",
                        SQL: unindentWhitespace(`
            USE DATABASE ${gitSqlDatabaseID}; -- https://github.com/mergestat/mergestat\n
            SELECT file_path, COUNT(*)
              FROM commits, stats('', commits.hash)
             WHERE commits.author_when > DATE('now', '-12 month')
               AND commits.parents < 2 -- ignore merge commits
             GROUP BY file_path
             ORDER BY COUNT(*) DESC
             LIMIT 50`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(gitSqlDatabaseID),
                        name: "total-commit-counts-by-author",
                        label: "Show total commits counts grouped by author",
                        SQL: unindentWhitespace(`
            USE DATABASE ${gitSqlDatabaseID}; -- https://github.com/mergestat/mergestat\n
            SELECT count(*), author_email, author_name
              FROM commits
             WHERE parents < 2 -- ignore merge commits
             GROUP BY author_name, author_email ORDER BY count(*) DESC`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(gitSqlDatabaseID),
                        name: "total-commit-counts-by-author-email-domain",
                        label: "Show total commits counts grouped by email domain of author",
                        SQL: unindentWhitespace(`
            USE DATABASE ${gitSqlDatabaseID}; -- https://github.com/mergestat/mergestat\n
            SELECT count(*), substr(author_email, instr(author_email, '@')+1) AS email_domain -- https://sqlite.org/lang_corefunc.html
              FROM commits
             WHERE parents < 2 -- ignore merge commits
             GROUP BY email_domain
             ORDER BY count(*) DESC`),
                        qualifiedName: qualifiedNamePlaceholder
                    }
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "file-system",
                label: "File System",
                sqlStmts: [
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "image-dimensions",
                        label: "Show images and their dimensions",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT CONCAT(width, 'x', height), path, size
              FROM content
             WHERE is_image and extension != 'svg'`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "large-images",
                        label: "Show large images (by dimension)",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT CONCAT(width, 'x', height), path, fsize, mime
              FROM content -- assumes current working directory is project home (usually true)
             WHERE width >= 500 and height >= 500`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "project-path-statistics",
                        label: "Show useful file system statistics (WARNING: can be slow, be careful)",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT MIN(size), MAX{size}, AVG(size), SUM{size}, COUNT(*)
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "project-path-image-statistics",
                        label: "Show useful image statistics",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT MIN(size), MAX{size}, AVG(size), SUM{size}, COUNT(*)
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/content
             WHERE is_image and extension != 'svg'`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "count-files-in-path",
                        label: "Show total files in project path",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT count(*)
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "markdown-files-and-sizes",
                        label: "Show markdown files in content path",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT size, path
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/content
             WHERE name = '*.md'
             LIMIT 50`),
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "osquery",
                label: "osQuery (operating system)",
                sqlStmts: [
                    {
                        database: DB(osQueryDatabaseID),
                        name: "system-info",
                        label: "Show system information",
                        SQL: unindentWhitespace(`
            USE DATABASE ${osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT computer_name, hostname, cpu_brand, cpu_physical_cores, cpu_logical_cores, printf("%.2f", (physical_memory / 1024.0 / 1024.0 / 1024.0)) as memory_gb
            FROM system_info`),
                        presentation: tableObjectProps,
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(osQueryDatabaseID),
                        name: "config-files-info",
                        label: "Show output of all configuration files available via Augeas",
                        SQL: unindentWhitespace(`
            USE DATABASE ${osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT *
             FROM augeas
            LIMIT 50`),
                        presentation: tableObjectProps,
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(osQueryDatabaseID),
                        name: "hosts-info",
                        label: "Show output of /etc/hosts using Augeas wrapper",
                        SQL: unindentWhitespace(`
            USE DATABASE ${osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT *
             FROM augeas
            WHERE augeas.path = '/etc/hosts'`),
                        presentation: tableObjectProps,
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            }
        ]
    };
    const indexLibraries = (libraries)=>{
        const indexSqlStmt = (sqlstmt, library)=>{
            if (sqlstmt.qualifiedName == qualifiedNamePlaceholder) {
                sqlstmt.qualifiedName = `${identity1}_${library.name}_${sqlstmt.name}`;
            }
            sqlStmtsIndex.set(sqlstmt.qualifiedName, sqlstmt);
        };
        for (const library1 of libraries){
            if (library1.qualifiedName == qualifiedNamePlaceholder) {
                library1.qualifiedName = library1.name;
            }
            for (const sqlstmt of library1.sqlStmts){
                indexSqlStmt(sqlstmt, library1);
            }
        }
    };
    indexLibraries(result.libraries);
    return result;
}
export { defaultDatabaseID as defaultDatabaseID };
export { configDatabaseID as configDatabaseID };
export { observabilityDatabaseID as observabilityDatabaseID };
export { pubctlDatabaseID as pubctlDatabaseID };
export { defaultSqlStmtID as defaultSqlStmtID };
export { typicalSqlStmtsInventory as typicalSqlStmtsInventory };
