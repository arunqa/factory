import * as govn from "./governance.ts";
import * as whs from "../../../../../../lib/text/whitespace.ts";

export function jsModule(code: string): govn.ServerRuntimeScriptCode {
  return {
    language: "js",
    code: whs.unindentWhitespace(code),
  };
}

export function flexibleModuleArgs(
  ...args: govn.ServerRuntimeScriptArgument[]
): govn.ServerRuntimeScriptArguments {
  const srScriptArgs: Record<string, govn.ServerRuntimeScriptArgument> = {};
  for (const arg of args) {
    srScriptArgs[arg.identity] = arg;
  }
  return srScriptArgs;
}

export function routeUnitModuleArgs(): govn.ServerRuntimeScriptArgument[] {
  return [{ identity: "routeUnitFileSysPath", dataType: "string" }];
}

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
    module: jsModule(`
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
          module: jsModule(`export default () => Deno.memoryUsage();`),
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
          module: jsModule(`
          export default ({ publicationDB }) => ({
              sqliteFileName: publicationDB ? publicationDB.dbStoreFsPath : "publicationDB not provided"
          });`),
          qualifiedName: qualifiedNamePlaceholder,
          presentation: tableObjectProps,
        },
        {
          name: "global-sql-db-conns.js.json",
          label: "Show database connections used to generate content",
          module: jsModule(`
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
          module: jsModule(
            `export default ({ publication }) => publication.ds.designSystem`,
          ),
          qualifiedName: qualifiedNamePlaceholder,
          presentation: tableObjectProps,
        },
        {
          name: "layouts.js.json",
          label: "Show all design system layouts",
          module: jsModule(`
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
      name: "site",
      label: "Site",
      scripts: [
        {
          name: "rf-site-build.js.json",
          label: "Show site's active build and server properties",
          module: jsModule(`
          export default ({ publicationDB }) => {
            // always return objects, not strings
            if(!publicationDB) return { warning: "no publicationDB available" };
            const {
              dbStoreFsPath: publicationDbFsPath,
              activeHost: buildHost,
              activeBuildEvent: buildEvent,
              activeServerService: serverService
            } = publicationDB;
            return { publicationDbFsPath, buildHost, buildEvent, serverService };
          }`),
          transformResult: "retrocycle-JSON",
          presentation: tableObjectProps,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          name: "navigation-tree-items.js.json",
          label: "Show all navigation tree items",
          module: jsModule(
            `export default ({ publication }) => publication.routes.navigationTree.items`,
          ),
          transformResult: "retrocycle-JSON",
          presentation: tableObjectProps,
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          name: "resource-by-route.js.json",
          label: "Get resource by args.fileSysPath or args.location",
          module: jsModule(`
            export default ({ publication, args }) => {
              let resource = undefined;
              let resources = undefined;
              const routeUnitFileSysPath = args.get("routeUnitFileSysPath");
              if(routeUnitFileSysPath) {
                const filtered = Array.from(publication.state.resourcesIndex.filterSync((r) => r.route?.terminal?.fileSysPath == routeUnitFileSysPath ? true : false));
                if(filtered && filtered.length > 0) {
                  if(filtered.length == 1)
                    resource = filtered[0];
                  else
                    resources = filtered;
                }
              }
              return { routeUnitFileSysPath, resource, resources };
            }`),
          moduleArgs: flexibleModuleArgs(...routeUnitModuleArgs()),
          transformResult: "retrocycle-JSON",
          qualifiedName: qualifiedNamePlaceholder,
        },
        {
          name: "resources-tree-items.js.json",
          label: "Show all resources in a tree",
          module: jsModule(
            `export default ({ publication }) => publication.routes.resourcesTree.items`,
          ),
          transformResult: "retrocycle-JSON",
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
          module: jsModule(
            `export default async ({ publication, args }) => await publication.config.git.log({ file: args.get("routeUnitFileSysPath") })`,
          ),
          moduleArgs: flexibleModuleArgs(...routeUnitModuleArgs()),
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
