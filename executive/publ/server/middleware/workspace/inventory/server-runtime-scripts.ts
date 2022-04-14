import * as govn from "./governance.ts";
import * as whs from "../../../../../../lib/text/whitespace.ts";

// inventory is used as-is by the server-side but used as a reference by client;
// for security purposes, the user agent ("UA" or "client") is allowed to see
// the scripts but if the script is passed into the server, the server ignores
// the script and uses what is in the catalog. By letting clients see the
export function typicalScriptsInventory(
  identity = "typicalScripts",
): govn.ServerRuntimeScriptInventory {
  const scriptsIndex = new Map<string, govn.ServerRuntimeScript>();

  const jsonExplorer: govn.ScriptResultPresentationStrategy = {
    nature: "JSON-explorer",
  };
  const _tableMatrix: govn.ScriptResultPresentationStrategy = {
    nature: "table-matrix",
  };
  const _tableRecords: govn.ScriptResultTableRecordsPresentation = {
    nature: "table-records",
  };
  const tableObjectProps: govn.ScriptResultTableObjectPropsPresentation = {
    nature: "table-object-properties",
  };

  const qualifiedNamePlaceholder = "[TBD]";
  const defaultScript: govn.ServerRuntimeScript = {
    name: "project.js.json",
    label: "Show project summary",
    jsModule: whs.unindentWhitespace(`
    export default ({ publication }) => {
        const projectRootPath = publication.config.operationalCtx.projectRootPath;
        return {
            projectHome: projectRootPath("/", true),
            envrc: projectRootPath("/.envrc", true),
        };
    };`),
    qualifiedName: qualifiedNamePlaceholder,
    presentation: tableObjectProps,
  };

  const result: govn.ServerRuntimeScriptInventory = {
    identity,
    origin: {
      moduleImportMetaURL: import.meta.url,
    },
    endpoints: {
      eval: "/unsafe-server-runtime-proxy/eval",
      module: "/unsafe-server-runtime-proxy/module",
    },
    script: (identity: string) => {
      return scriptsIndex.get(identity);
    },
    defaultScript,
    libraries: [{
      name: "runtime",
      label: "Server Runtime",
      scripts: [
        {
          name: "memory.js.json",
          label: "Show server runtime (Deno) memory statistics",
          jsModule: `export default () => Deno.memoryUsage();`,
          qualifiedName: qualifiedNamePlaceholder,
          presentation: tableObjectProps,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "config",
      label: "Config",
      scripts: [
        defaultScript,
        {
          name: "publication-db.js.json",
          label: "Show name of SQLite database storing pubctl state",
          jsModule: whs.unindentWhitespace(`
          export default ({ publicationDB }) => ({
              sqliteFileName: publicationDB ? publicationDB.dbStoreFsPath : "publicationDB not provided"
          });`),
          qualifiedName: qualifiedNamePlaceholder,
          presentation: tableObjectProps,
        },
        {
          name: "global-sql-db-conns.js.json",
          label: "Show database connections used to generate content",
          jsModule: whs.unindentWhitespace(`
            // we convert to JSON ourselves since we have to do some special processing for
            // possible bigints
            export default ({ globalSqlDbConns }) => JSON.stringify(
                globalSqlDbConns,
                (key, value) => {
                    if (typeof value === "bigint") return value.toString();
                    if (value instanceof Map) {
                        return Object.fromEntries(value);
                    }
                    return value;
                },
            );`),
          qualifiedName: qualifiedNamePlaceholder,
          presentation: jsonExplorer,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "design-system",
      label: "Design System",
      scripts: [
        {
          name: "design-system.js.json",
          label: "Show summary of design system",
          jsModule:
            `export default ({ publication }) => publication.ds.designSystem`,
          qualifiedName: qualifiedNamePlaceholder,
          presentation: tableObjectProps,
        },
        {
          name: "layouts.js.json",
          label: "Show all design system layouts",
          jsModule: whs.unindentWhitespace(`
            // we're going to give a AGGrid definition for full control
            function layouts(publication) {
                const layouts = Array.from(publication.ds.designSystem.layoutStrategies.layouts.values());
                const rowData = layouts.map(l => ({
                    identity: l.identity,
                    editorRedirectSrc: l.location.moduleImportMetaURL.replace('file://', ''),
                    editorRedirectLabel: l.location.moduleImportMetaURL.replace(/^.*\\/factory\\//, '')
                }));
                return {
                    presentation: {
                      nature: "table-aggrid-defn"
                    },
                    columnDefs: [
                      { field: "identity" },
                      { field: "editorRedirect", cellRenderer: "workspaceEditorRedirectCellRenderer" },
                    ],
                    rowData
                };
            }
            export default ({ publication }) => layouts(publication);`),
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "routes",
      label: "Routes",
      scripts: [
        {
          name: "navigation-tree-items.js.json",
          label: "Show all navigation tree items",
          jsModule:
            `export default ({ publication }) => publication.routes.navigationTree.items`,
          qualifiedName: qualifiedNamePlaceholder,
          presentation: tableObjectProps,
        },
        {
          name: "resources-tree-items.js.json",
          label: "Show all resources in a tree",
          jsModule:
            `export default ({ publication }) => publication.routes.resourcesTree.items`,
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }, {
      name: "version-control",
      label: "Version Control (Git)",
      scripts: [
        {
          name: "git-log-active-route.js.json",
          label: "Show revision history of the active route",
          jsModule:
            // args is a URLSearchParams instance on the server side, sent from the client
            `export default async ({ publication, args }) => await publication.config.git.log({ file: args.get("routeFileSysPath") })`,
          qualifiedName: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }],
  };

  const indexLibraries = (
    libraries: Iterable<govn.ServerRuntimeScriptLibrary>,
  ) => {
    const indexScript = (
      script: govn.ServerRuntimeScript,
      library: govn.ServerRuntimeScriptLibrary,
    ) => {
      if (script.qualifiedName == qualifiedNamePlaceholder) {
        // special cast required since script.qualifiedName is read-only
        (script as { qualifiedName: string }).qualifiedName =
          `${identity}_${library.name}_${script.name}`;
      }
      scriptsIndex.set(script.qualifiedName, script);
    };

    for (const library of libraries) {
      if (library.qualifiedName == qualifiedNamePlaceholder) {
        // special cast required since library.qualifiedName is read-only
        (library as { qualifiedName: string }).qualifiedName = library.name;
      }
      for (const script of library.scripts) {
        indexScript(script, library);
      }
    }
  };

  indexLibraries(result.libraries);

  return result;
}

export const defaultScriptSupplier: govn.ScriptInventorySupplier = () =>
  typicalScriptsInventory();

export default defaultScriptSupplier;
