import * as rm from "../../../../../../lib/module/remote/governance.ts";
import * as govn from "./governance.ts";
import * as whs from "../../../../../../lib/text/whitespace.ts";

export function jsModule(
  code: string,
  ...args: rm.ForeignCodeExpectedArgument[]
): rm.ForeignCodeSupplier {
  return {
    foreignCodeLanguage: "js",
    foreignCode: whs.unindentWhitespace(code),
    foreignCodeArgsExpected: args.length > 0
      ? args.reduce((args, arg) => {
        args[arg.identity] = arg;
        return args;
      }, {} as Record<string, rm.ForeignCodeExpectedArgument>)
      : undefined,
  };
}

export function routeUnitModuleArgs(): rm.ForeignCodeExpectedArgument[] {
  return [{ identity: "routeUnitFileSysPath", dataType: "string" }];
}

// inventory is used as-is by the server-side but used as a reference by client;
// for security purposes, the user agent ("UA" or "client") is allowed to see
// the scripts but if the script is passed into the server, the server ignores
// the script and uses what is in the catalog. By letting clients see the
export function typicalScriptsInventory(
  identity = "typicalScripts",
): govn.ServerRuntimeScriptInventory {
  const scriptsIndex = new Map<string, rm.ServerRuntimeScript>();

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
    foreignModule: jsModule(`
    export default ({ publication }) => {
        const projectRootPath = publication.config.operationalCtx.projectRootPath;
        return {
            projectHome: projectRootPath("/", true),
            envrc: projectRootPath("/.envrc", true),
        };
    };`),
    foreignCodeIdentity: qualifiedNamePlaceholder,
    presentation: tableObjectProps,
  };

  const result: govn.ServerRuntimeScriptInventory = {
    identity,
    script: (identity: string) => {
      return scriptsIndex.get(identity);
    },
    scriptIdentities: () => scriptsIndex.keys(),
    defaultScript,
    libraries: [{
      name: "runtime",
      label: "Server Runtime",
      scripts: [
        {
          name: "memory.js.json",
          label: "Show server runtime (Deno) memory statistics",
          foreignModule: jsModule(`export default () => Deno.memoryUsage();`),
          foreignCodeIdentity: qualifiedNamePlaceholder,
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
          foreignModule: jsModule(`
          export default ({ publicationDB }) => ({
              sqliteFileName: publicationDB ? publicationDB.dbStoreFsPath : "publicationDB not provided"
          });`),
          foreignCodeIdentity: qualifiedNamePlaceholder,
          presentation: tableObjectProps,
        },
        {
          name: "global-sql-db-conns.js.json",
          label: "Show database connections used to generate content",
          foreignModule: jsModule(`
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
          foreignCodeIdentity: qualifiedNamePlaceholder,
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
          foreignModule: jsModule(
            `export default ({ publication }) => publication.ds.designSystem`,
          ),
          foreignCodeIdentity: qualifiedNamePlaceholder,
          presentation: tableObjectProps,
        },
        {
          name: "layouts.js.json",
          label: "Show all design system layouts",
          foreignModule: jsModule(`
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
          foreignCodeIdentity: qualifiedNamePlaceholder,
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
          foreignModule: jsModule(`
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
          retrocyleJsonOnUserAgent: true,
          presentation: tableObjectProps,
          foreignCodeIdentity: qualifiedNamePlaceholder,
        },
        {
          name: "navigation-tree-items.js.json",
          label: "Show all navigation tree items",
          foreignModule: jsModule(
            `export default ({ publication }) => publication.routes.navigationTree.items`,
          ),
          retrocyleJsonOnUserAgent: true,
          presentation: tableObjectProps,
          foreignCodeIdentity: qualifiedNamePlaceholder,
        },
        {
          name: "resource-by-route.js.json",
          label: "Get resource by args.fileSysPath or args.location",
          foreignModule: jsModule(
            `
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
            }`,
            ...routeUnitModuleArgs(),
          ),
          retrocyleJsonOnUserAgent: true,
          foreignCodeIdentity: qualifiedNamePlaceholder,
        },
        {
          name: "resources-tree-items.js.json",
          label: "Show all resources in a tree",
          foreignModule: jsModule(
            `export default ({ publication }) => publication.routes.resourcesTree.items`,
          ),
          retrocyleJsonOnUserAgent: true,
          foreignCodeIdentity: qualifiedNamePlaceholder,
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
          foreignModule: jsModule(
            `export default async ({ publication, args }) => await publication.config.git.log({ file: args.get("routeUnitFileSysPath") })`,
            ...routeUnitModuleArgs(),
          ),
          foreignCodeIdentity: qualifiedNamePlaceholder,
        },
      ],
      qualifiedName: qualifiedNamePlaceholder,
    }],
  };

  const indexLibraries = (
    libraries: Iterable<rm.ServerRuntimeScriptLibrary>,
  ) => {
    const indexScript = (
      script: rm.ServerRuntimeScript,
      library: rm.ServerRuntimeScriptLibrary,
    ) => {
      if (script.foreignCodeIdentity == qualifiedNamePlaceholder) {
        // special cast required since script.foreignCodeIdentity is read-only
        (script as { foreignCodeIdentity: string }).foreignCodeIdentity =
          `${identity}_${library.name}_${script.name}`;
      }
      scriptsIndex.set(script.foreignCodeIdentity, script);
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

export default typicalScriptsInventory();
