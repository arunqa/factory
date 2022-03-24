// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

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
