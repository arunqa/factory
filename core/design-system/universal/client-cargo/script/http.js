"use strict";

function inspectUrlHttpHeaders(options = {
    inspectURL: null, // default is current page/location
    onHeaders: null,  // (headers, url) => void,
    onHeader: null,   // { "header": (value, header, url) => void, "header2": [found: (value, header, url) => void, notFound: (header, url) => void] }
}) {
    function parseHttpHeaders(httpHeaders) {
        return httpHeaders.split("\n")
            .map(x => x.split(/: */, 2))
            .filter(x => x[0])
            .reduce((ac, x) => { ac[x[0]] = x[1]; return ac; }, {});
    }

    const inspectURL = options?.inspectURL || location;
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", inspectURL);
    xhr.onload = function () {
        const headers = parseHttpHeaders(xhr.getAllResponseHeaders());
        if (options?.onHeaders && typeof options.onHeaders === "function") options.onHeaders(headers, inspectURL);
        if (options?.onHeader) {
            if (typeof options.onHeader !== "object") {
                console.error(`[inspectUrlHttpHeaders] options.onHeader is expected to be an object`);
                return;
            }
            for (const key in options.onHeader) {
                const handlers = options.onHeader[key];
                const foundHeaderFn = Array.isArray(handlers) ? handlers[0] : handlers;
                const notFoundHeaderFn = Array.isArray(handlers) ? handlers[1] : undefined;
                if (!(key in headers)) {
                    if (typeof notFoundHeaderFn === "function") {
                        notFoundHeaderFn(key, inspectURL);
                    } else {
                        console.error(`[inspectUrlHttpHeaders] onHeader "${key}" notFoundHeaderFn is not a function`);
                    }
                } else {
                    const value = headers[key];
                    if (typeof foundHeaderFn === "function") {
                        foundHeaderFn(value, key, inspectURL);
                    } else {
                        console.error(`[inspectUrlHttpHeaders] onHeader "${key}" foundHeaderFn is not a function`);
                    }
                }
            }
        }
    }
    xhr.send();
}
