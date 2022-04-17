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
const importMeta = {
    url: "file:///home/snshah/workspaces/github.com/resFactory/factory/executive/publ/server/middleware/workspace/inventory/server-runtime-scripts.ts",
    main: false
};
function jsModule(code) {
    return {
        language: "js",
        code: unindentWhitespace(code)
    };
}
function flexibleModuleArgs(...args) {
    const srScriptArgs = {};
    for (const arg of args){
        srScriptArgs[arg.identity] = arg;
    }
    return srScriptArgs;
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
        module: jsModule(`
    export default ({ publication }) => {
        const projectRootPath = publication.config.operationalCtx.projectRootPath;
        return {
            projectHome: projectRootPath("/", true),
            envrc: projectRootPath("/.envrc", true),
        };
    };`),
        qualifiedName: qualifiedNamePlaceholder,
        presentation: tableObjectProps
    };
    const result = {
        identity: identity1,
        origin: {
            moduleImportMetaURL: importMeta.url
        },
        endpoints: {
            eval: "/unsafe-server-runtime-proxy/eval",
            module: "/unsafe-server-runtime-proxy/module"
        },
        script: (identity)=>{
            return scriptsIndex.get(identity);
        },
        defaultScript,
        libraries: [
            {
                name: "runtime",
                label: "Server Runtime",
                scripts: [
                    {
                        name: "memory.js.json",
                        label: "Show server runtime (Deno) memory statistics",
                        module: jsModule(`export default () => Deno.memoryUsage();`),
                        qualifiedName: qualifiedNamePlaceholder,
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
                        module: jsModule(`
          export default ({ publicationDB }) => ({
              sqliteFileName: publicationDB ? publicationDB.dbStoreFsPath : "publicationDB not provided"
          });`),
                        qualifiedName: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
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
                        module: jsModule(`export default ({ publication }) => publication.ds.designSystem`),
                        qualifiedName: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
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
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "site",
                label: "Site",
                scripts: [
                    {
                        name: "navigation-tree-items.js.json",
                        label: "Show all navigation tree items",
                        module: jsModule(`export default ({ publication }) => publication.routes.navigationTree.items`),
                        transformResult: "retrocycle-JSON",
                        presentation: tableObjectProps,
                        qualifiedName: qualifiedNamePlaceholder
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
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        name: "resources-tree-items.js.json",
                        label: "Show all resources in a tree",
                        module: jsModule(`export default ({ publication }) => publication.routes.resourcesTree.items`),
                        transformResult: "retrocycle-JSON",
                        qualifiedName: qualifiedNamePlaceholder
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
                        module: jsModule(`export default async ({ publication, args }) => await publication.config.git.log({ file: args.get("routeUnitFileSysPath") })`),
                        moduleArgs: flexibleModuleArgs(...routeUnitModuleArgs()),
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            }
        ]
    };
    const indexLibraries = (libraries)=>{
        const indexScript = (script, library)=>{
            if (script.qualifiedName == qualifiedNamePlaceholder) {
                script.qualifiedName = `${identity1}_${library.name}_${script.name}`;
            }
            scriptsIndex.set(script.qualifiedName, script);
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
const defaultScriptSupplier = ()=>typicalScriptsInventory()
;
export { jsModule as jsModule };
export { flexibleModuleArgs as flexibleModuleArgs };
export { routeUnitModuleArgs as routeUnitModuleArgs };
export { typicalScriptsInventory as typicalScriptsInventory };
export { defaultScriptSupplier as defaultScriptSupplier };
