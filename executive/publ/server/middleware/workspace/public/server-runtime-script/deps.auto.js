// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const importMeta = {
    url: "file:///home/snshah/workspaces/github.com/resFactory/factory/executive/publ/server/middleware/workspace/inventory/server-runtime-scripts.ts",
    main: false
};
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
        jsModule: `
    export default ({ publication }) => {
        const projectRootPath = publication.config.operationalCtx.projectRootPath;
        return {
            projectHome: projectRootPath("/", true),
            envrc: projectRootPath("/.envrc", true),
        };
    };`,
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
                        jsModule: `export default () => Deno.memoryUsage();`,
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
                        jsModule: `
          export default ({ publicationDB }) => ({
              sqliteFileName: publicationDB ? publicationDB.dbStoreFsPath : "publicationDB not provided"
          });`,
                        qualifiedName: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
                    },
                    {
                        name: "global-sql-db-conns.js.json",
                        label: "Show database connections used to generate content",
                        jsModule: `
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
            );`,
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
                        jsModule: `export default ({ publication }) => publication.ds.designSystem`,
                        qualifiedName: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
                    },
                    {
                        name: "layouts.js.json",
                        label: "Show all design system layouts",
                        jsModule: `
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
            export default ({ publication }) => layouts(publication);`,
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
export { typicalScriptsInventory as typicalScriptsInventory };
export { defaultScriptSupplier as defaultScriptSupplier };
