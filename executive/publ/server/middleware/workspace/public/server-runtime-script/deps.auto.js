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
const jsonDecycleResponse = {
    foreignCodeResponseStrategy: "JSON",
    foreignCodeResponseStrategyOptions: {
        isJsonResponseOptions: true,
        decycle: true
    }
};
function denoInspectResponse(denoIO = {
    depth: 9,
    showHidden: true,
    sorted: true,
    showProxy: true
}) {
    return {
        foreignCodeResponseStrategy: "Deno.inspect",
        foreignCodeResponseStrategyOptions: {
            isDenoInspectResponseOptions: true,
            denoIO
        }
    };
}
function jsModule(code, rs, ...args1) {
    return {
        foreignCodeLanguage: "js",
        foreignCode: unindentWhitespace(code),
        foreignCodeArgsExpected: args1.length > 0 ? args1.reduce((args, arg)=>{
            args[arg.identity] = arg;
            return args;
        }, {}) : undefined,
        ...rs
    };
}
function routeUnitModuleArgs() {
    return [
        {
            identity: "routeUnitFileSysPath",
            dataType: "string"
        }
    ];
}
function typicalScriptsInventory(identity1 = "typicalScripts") {
    const scriptsIndex = new Map();
    const jsonExplorer = {
        nature: "JSON-explorer"
    };
    const tableObjectProps = {
        nature: "table-object-properties"
    };
    const qualifiedNamePlaceholder = "[TBD]";
    const defaultScript = {
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
        presentation: tableObjectProps
    };
    const result = {
        identity: identity1,
        script: (identity)=>{
            return scriptsIndex.get(identity);
        },
        scriptIdentities: ()=>scriptsIndex.keys()
        ,
        defaultScript,
        libraries: [
            {
                name: "runtime",
                label: "Server Runtime",
                scripts: [
                    {
                        name: "memory.js.json",
                        label: "Show server runtime (Deno) memory statistics",
                        foreignModule: jsModule(`export default () => Deno.memoryUsage();`),
                        foreignCodeIdentity: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
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
                        presentation: tableObjectProps
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
                        presentation: jsonExplorer
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "design-system",
                label: "Design System",
                scripts: [
                    {
                        name: "design-system.js.json",
                        label: "Show summary of design system",
                        foreignModule: jsModule(`export default ({ publication }) => publication.ds.designSystem`),
                        foreignCodeIdentity: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
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
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
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
            }`, jsonDecycleResponse),
                        foreignCodeIdentity: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
                    },
                    {
                        name: "navigation-tree-items.js.json",
                        label: "Show all navigation tree items",
                        foreignModule: jsModule(`export default ({ publication }) => publication.routes.navigationTree.items`, jsonDecycleResponse),
                        presentation: tableObjectProps,
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "resource-by-route.js.json",
                        label: "Get resource by args.fileSysPath or args.location",
                        foreignModule: jsModule(`
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
            }`, jsonDecycleResponse, ...routeUnitModuleArgs()),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "resource-by-route.js.di",
                        label: "Get resource by args.fileSysPath or args.location in Deno.inspect format",
                        foreignModule: jsModule(`
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
            }`, denoInspectResponse(), ...routeUnitModuleArgs()),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "resources-tree-items.js.json",
                        label: "Show all resources in a tree",
                        foreignModule: jsModule(`export default ({ publication }) => publication.routes.resourcesTree.items`, jsonDecycleResponse),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "version-control",
                label: "Version Control (Git)",
                scripts: [
                    {
                        name: "git-log-active-route.js.json",
                        label: "Show revision history of the active route",
                        foreignModule: jsModule(`export default async ({ publication, args }) => await publication.config.contentGit?.log({ file: args.get("routeUnitFileSysPath") })`, jsonDecycleResponse, ...routeUnitModuleArgs()),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "git-log-site-updates.js.json",
                        label: "Show what's different between local and remote project (site)",
                        foreignModule: jsModule(`export default async ({ publication, args }) => await publication.config.contentGit?.log({ branch: "HEAD..origin/master" })`),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "git-log-rf-updates.js.json",
                        label: "Show what's different between local and remote Resource Factory",
                        foreignModule: jsModule(`export default async ({ publication, args }) => await publication.config.resFactoryGit?.log({ branch: "HEAD..origin/main" })`),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            }
        ]
    };
    const indexLibraries = (libraries)=>{
        const indexScript = (script, library)=>{
            if (script.foreignCodeIdentity == qualifiedNamePlaceholder) {
                script.foreignCodeIdentity = `${identity1}_${library.name}_${script.name}`;
            }
            scriptsIndex.set(script.foreignCodeIdentity, script);
        };
        for (const library1 of libraries){
            if (library1.qualifiedName == qualifiedNamePlaceholder) {
                library1.qualifiedName = library1.name;
            }
            for (const script of library1.scripts){
                indexScript(script, library1);
            }
        }
    };
    indexLibraries(result.libraries);
    return result;
}
typicalScriptsInventory();
export { jsonDecycleResponse as jsonDecycleResponse };
export { denoInspectResponse as denoInspectResponse };
export { jsModule as jsModule };
export { routeUnitModuleArgs as routeUnitModuleArgs };
export { typicalScriptsInventory as typicalScriptsInventory };
