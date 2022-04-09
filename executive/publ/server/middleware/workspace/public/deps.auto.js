// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

if (typeof JSON.decycle !== "function") {
    JSON.decycle = function decycle(object, replacer) {
        "use strict";
        var objects = new WeakMap();
        return (function derez(value, path) {
            var old_path;
            var nu;
            if (replacer !== undefined) {
                value = replacer(value);
            }
            if (typeof value === "object" && value !== null && !(value instanceof Boolean) && !(value instanceof Date) && !(value instanceof Number) && !(value instanceof RegExp) && !(value instanceof String)) {
                old_path = objects.get(value);
                if (old_path !== undefined) {
                    return {
                        $ref: old_path
                    };
                }
                objects.set(value, path);
                if (Array.isArray(value)) {
                    nu = [];
                    value.forEach(function(element, i) {
                        nu[i] = derez(element, path + "[" + i + "]");
                    });
                } else {
                    nu = {};
                    Object.keys(value).forEach(function(name) {
                        nu[name] = derez(value[name], path + "[" + JSON.stringify(name) + "]");
                    });
                }
                return nu;
            }
            return value;
        })(object, "$");
    };
}
if (typeof JSON.retrocycle !== "function") {
    JSON.retrocycle = function retrocycle($) {
        "use strict";
        var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\(?:[\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;
        (function rez(value) {
            if (value && typeof value === "object") {
                if (Array.isArray(value)) {
                    value.forEach(function(element, i) {
                        if (typeof element === "object" && element !== null) {
                            var path = element.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(element);
                            }
                        }
                    });
                } else {
                    Object.keys(value).forEach(function(name) {
                        var item = value[name];
                        if (typeof item === "object" && item !== null) {
                            var path = item.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[name] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    });
                }
            }
        })($);
        return $;
    };
}
function isBoolean(any) {
    return typeof any === "boolean";
}
function isNull(any) {
    return any === null;
}
function isUndefined(any) {
    return typeof any === "undefined";
}
function isNumber(any) {
    return typeof any === "number";
}
function isString(any) {
    return typeof any === "string";
}
function isSymbol(any) {
    return typeof any === "symbol";
}
function isFunction(any) {
    return typeof any === "function";
}
function reflect(any, ancestors, options) {
    if (isBoolean(any) || isNull(any) || isUndefined(any) || isNumber(any) || isString(any) || isSymbol(any)) {
        const enhanceScalar = options?.enhanceScalar;
        const response = {
            value: any,
            type: typeof any
        };
        if (isSymbol(any)) {
            response.description = any.description;
        }
        return enhanceScalar ? enhanceScalar(response, ancestors) : response;
    }
    if (isFunction(any)) {
        const enhanceFunction = options?.enhanceFunction;
        const fn = {
            value: any,
            name: any.name,
            type: typeof any,
            stringify: any.toString()
        };
        return enhanceFunction ? enhanceFunction(fn, ancestors) : fn;
    }
    const enhanceObject = options?.enhanceObject;
    let propertiesNames = Object.getOwnPropertyNames(any);
    if (options?.objPropsFilter) {
        propertiesNames = propertiesNames.filter(options?.objPropsFilter);
    }
    const symbols = Object.getOwnPropertySymbols(any);
    const obj = {
        value: any,
        type: typeof any,
        properties: propertiesNames.map((prop)=>({
                ...reflect(any[prop], ancestors ? [
                    ...ancestors,
                    any
                ] : [
                    any
                ], options),
                key: prop,
                propertyDescription: Object.getOwnPropertyDescriptor(any, prop)
            })
        ),
        symbols: symbols.map((sym)=>({
                ...reflect(any[sym], ancestors ? [
                    ...ancestors,
                    any
                ] : [
                    any
                ], options),
                key: sym
            })
        ),
        stringify: any.toString()
    };
    return enhanceObject ? enhanceObject(obj) : obj;
}
export { reflect as reflect };
function humanFriendlyBytes(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }
    const units = si ? [
        "kB",
        "MB",
        "GB",
        "TB",
        "PB",
        "EB",
        "ZB",
        "YB"
    ] : [
        "KiB",
        "MiB",
        "GiB",
        "TiB",
        "PiB",
        "EiB",
        "ZiB",
        "YiB"
    ];
    let u = -1;
    const r = 10 ** dp;
    do {
        bytes /= thresh;
        ++u;
    }while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)
    return bytes.toFixed(dp) + " " + units[u];
}
function humanFriendlyPhrase(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s\s+/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, (letter)=>letter.toUpperCase()
    );
}
const humanPath = (original, maxLength = 50, formatBasename)=>{
    const tokens = original.split("/");
    const basename = tokens[tokens.length - 1];
    tokens.splice(0, 1);
    tokens.splice(tokens.length - 1, 1);
    if (original.length < maxLength) {
        return (tokens.length > 0 ? tokens.join("/") + "/" : "") + (formatBasename ? formatBasename(basename) : basename);
    }
    const remLen = maxLength - basename.length - 4;
    if (remLen > 0) {
        const path = tokens.join("/");
        const lenA = Math.ceil(remLen / 2);
        const lenB = Math.floor(remLen / 2);
        const pathA = path.substring(0, lenA);
        const pathB = path.substring(path.length - lenB);
        return pathA + "..." + pathB + "/" + (formatBasename ? formatBasename(basename) : basename);
    }
    return formatBasename ? formatBasename(basename) : basename;
};
export { humanFriendlyBytes as humanFriendlyBytes };
export { humanFriendlyPhrase as humanFriendlyPhrase };
export { humanPath as humanPath };
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
function singleLineTrim(text) {
    return text.replace(/(\r\n|\n|\r)/gm, "").replace(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, " ").trim();
}
export { minWhitespaceIndent as minWhitespaceIndent };
export { unindentWhitespace as unindentWhitespace };
export { singleLineTrim as singleLineTrim };
function markdownItTransformer() {
    return {
        dependencies: undefined,
        acquireDependencies: async (transformer)=>{
            const { default: markdownIt  } = await import("https://jspm.dev/markdown-it@12.2.0");
            return {
                markdownIt,
                plugins: await transformer.plugins()
            };
        },
        construct: async (transformer)=>{
            if (!transformer.dependencies) {
                transformer.dependencies = await transformer.acquireDependencies(transformer);
            }
            const markdownIt = transformer.dependencies.markdownIt({
                html: true,
                linkify: true,
                typographer: true
            });
            transformer.customize(markdownIt, transformer);
            return markdownIt;
        },
        customize: (markdownIt, transformer)=>{
            const plugins = transformer.dependencies.plugins;
            markdownIt.use(plugins.footnote);
            return transformer;
        },
        unindentWhitespace: (text, removeInitialNewLine = true)=>{
            const whitespace = text.match(/^[ \t]*(?=\S)/gm);
            const indentCount = whitespace ? whitespace.reduce((r, a)=>Math.min(r, a.length)
            , Infinity) : 0;
            const regex = new RegExp(`^[ \\t]{${indentCount}}`, "gm");
            const result = text.replace(regex, "");
            return removeInitialNewLine ? result.replace(/^\n/, "") : result;
        },
        plugins: async ()=>{
            const { default: footnote  } = await import("https://jspm.dev/markdown-it-footnote@3.0.3");
            return {
                footnote,
                adjustHeadingLevel: (md, options)=>{
                    function getHeadingLevel(tagName) {
                        if (tagName[0].toLowerCase() === 'h') {
                            tagName = tagName.slice(1);
                        }
                        return parseInt(tagName, 10);
                    }
                    const firstLevel = options.firstLevel;
                    if (typeof firstLevel === 'string') {
                        firstLevel = getHeadingLevel(firstLevel);
                    }
                    if (!firstLevel || isNaN(firstLevel)) {
                        return;
                    }
                    const levelOffset = firstLevel - 1;
                    if (levelOffset < 1 || levelOffset > 6) {
                        return;
                    }
                    md.core.ruler.push("adjust-heading-levels", function(state) {
                        const tokens = state.tokens;
                        for(let i = 0; i < tokens.length; i++){
                            if (tokens[i].type !== "heading_close") {
                                continue;
                            }
                            const headingOpen = tokens[i - 2];
                            const headingClose = tokens[i];
                            const currentLevel = getHeadingLevel(headingOpen.tag);
                            const tagName = 'h' + Math.min(currentLevel + levelOffset, 6);
                            headingOpen.tag = tagName;
                            headingClose.tag = tagName;
                        }
                    });
                }
            };
        }
    };
}
async function renderMarkdown(strategies, mditt = markdownItTransformer()) {
    const markdownIt = await mditt.construct(mditt);
    for await (const strategy of strategies(mditt)){
        const markdown = mditt.unindentWhitespace(await strategy.markdownText(mditt));
        strategy.renderHTML(markdownIt.render(markdown), mditt);
    }
}
function importMarkdownContent(input, select, inject) {
    fetch(input).then((resp)=>{
        resp.text().then((html)=>{
            const parser = new DOMParser();
            const foreignDoc = parser.parseFromString(html, "text/html");
            const selected = select(foreignDoc);
            if (Array.isArray(selected)) {
                for (const s of selected){
                    const importedNode = document.adoptNode(s);
                    inject(importedNode, input, html);
                }
            } else if (selected) {
                const importedNode = document.adoptNode(selected);
                inject(importedNode, input, html);
            }
        });
    });
}
async function transformMarkdownElemsCustom(srcElems, finalizeElemFn, mditt = markdownItTransformer()) {
    await renderMarkdown(function*() {
        for (const elem of srcElems){
            yield {
                markdownText: async ()=>{
                    if (elem.dataset.transformableSrc) {
                        const response = await fetch(elem.dataset.transformableSrc);
                        if (!response.ok) {
                            return `Error fetching ${elem.dataset.transformableSrc}: ${response.status}`;
                        }
                        return await response.text();
                    } else {
                        return elem.innerText;
                    }
                },
                renderHTML: async (html)=>{
                    try {
                        const formatted = document.createElement("div");
                        formatted.innerHTML = html;
                        elem.parentElement.replaceChild(formatted, elem);
                        if (finalizeElemFn) finalizeElemFn(formatted, elem);
                    } catch (error) {
                        console.error("Undiagnosable error in renderHTML()", error);
                    }
                }
            };
        }
    }, mditt);
}
async function transformMarkdownElems(firstHeadingLevel = 2) {
    const mdittDefaults = markdownItTransformer();
    await transformMarkdownElemsCustom(document.querySelectorAll(`[data-transformable="markdown"]`), (mdHtmlElem, mdSrcElem)=>{
        mdHtmlElem.dataset.transformedFrom = "markdown";
        if (mdSrcElem.className) mdHtmlElem.className = mdSrcElem.className;
        document.dispatchEvent(new CustomEvent("transformed-markdown", {
            detail: {
                mdHtmlElem,
                mdSrcElem
            }
        }));
    }, {
        ...mdittDefaults,
        customize: (markdownIt, transformer)=>{
            mdittDefaults.customize(markdownIt, transformer);
            markdownIt.use(transformer.dependencies.plugins.adjustHeadingLevel, {
                firstLevel: firstHeadingLevel
            });
        }
    });
}
export { markdownItTransformer as markdownItTransformer };
export { renderMarkdown as renderMarkdown };
export { importMarkdownContent as importMarkdownContent };
export { transformMarkdownElemsCustom as transformMarkdownElemsCustom };
export { transformMarkdownElems as transformMarkdownElems };
function getUrlQueryParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
const editableFileRedirectURL = (absPath)=>{
    let src = absPath;
    if (src.startsWith("file://")) {
        src = src.substring(7);
        return [
            `/workspace/editor-redirect/abs${src}`,
            src
        ];
    } else {
        if (absPath.startsWith("/")) {
            return [
                `/workspace/editor-redirect/abs${absPath}`,
                absPath
            ];
        } else {
            return [
                src,
                src
            ];
        }
    }
};
const editableFileRefHTML = (absPath, humanizeLength)=>{
    const [href, label] = editableFileRedirectURL(absPath);
    return humanizeLength ? humanPath(label, humanizeLength, (basename)=>`<a href="${href}" class="fw-bold" title="${absPath}">${basename}</a>`
    ) : `<a href="${href}">${label}</a>`;
};
const locationEditorRedirectURL = (location)=>editableFileRedirectURL(location.moduleImportMetaURL)
;
const locationEditorHTML = (location, humanizeLength)=>{
    const [href, label] = locationEditorRedirectURL(location);
    return humanizeLength ? humanPath(label, humanizeLength, (basename)=>`<a href="${href}" class="fw-bold" title="${location.moduleImportMetaURL}">${basename}</a>`
    ) : `<a href="${href}">${label}</a>`;
};
export { getUrlQueryParameterByName as getUrlQueryParameterByName };
export { editableFileRedirectURL as editableFileRedirectURL };
export { editableFileRefHTML as editableFileRefHTML };
export { locationEditorRedirectURL as locationEditorRedirectURL };
export { locationEditorHTML as locationEditorHTML };
