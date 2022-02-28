"use strict";

const jsTokenEvalRE = /^[a-zA-Z0-9_]+$/;
const jsTokenEvalResults = {}; // serves as a cache, speed up later lookups

/**
 * jsTokenEvalResult finds functions, classes, or other "single word" hooks.
 * @param {string} name what you're looking for (e.g. a class name or function name)
 * @param {(string => any)} discover how to evaluate for discovery of token with 'name' (usually just 'eval' function)
 * @param {(name) => any} onInvalidToken if the given text is not a single word, call this function and return its result
 * @param {(error, name) => any} onFailedDiscovery in case the eval resulted in an exception, call this function and return its result
 * @returns the result of eval(name) or, if there's an error the result of the error callbacks
 */

function jsTokenEvalResult(name, discover = eval, onInvalidToken, onFailedDiscovery) {
    let result = jsTokenEvalResults[name];
    if (!result) {
        if (name.match(jsTokenEvalRE)) {
            // proceed only if the name is a single word string
            try {
                result = discover(name);
                jsTokenEvalResults[name] = result;
            } catch (error) {
                result = onFailedDiscovery ? onFailedDiscovery(error, name) : undefined;
            }
        } else {
            result = onInvalidToken ? onInvalidToken(name) : undefined;
        }
    }
    return result;
}

function importHtmlContent(url, select, inject) {
    fetch(url).then(resp => {
        resp.text().then(html => {
            const parser = new DOMParser();
            const foreignDoc = parser.parseFromString(html, "text/html");
            const selected = select(foreignDoc);
            if (Array.isArray(selected)) {
                for (const s of selected) {
                    const importedNode = document.adoptNode(s);
                    inject(importedNode, url, html);
                }
            } else if (selected) {
                const importedNode = document.adoptNode(selected);
                inject(importedNode, url, html);
            }
        });
    });
}

function fileSysStyleRouteParser() {
    const posixPathRE = /^((\/?)(?:[^\/]*\/)*)((\.{1,2}|[^\/]+?|)(\.[^.\/]*|))[\/]*$/;
    return (text) => {
        if (typeof text !== 'string') {
            throw new TypeError(
                "Parameter 'text' must be a string, not " + typeof text
            );
        }
        const components = posixPathRE.exec(text).slice(1);
        if (!components || components.length !== 5) {
            throw new TypeError("Invalid path '" + text + "'");
        }

        const parsedPath = {
            root: components[1],
            dir: components[0].slice(0, -1),
            base: components[2],
            ext: components[4],
            name: components[3],
            modifiers: []
        };

        const modifierIndex = parsedPath.name.lastIndexOf(".");
        if (modifierIndex > 0) {
            let ppn = parsedPath.name;
            let modifier = ppn.substring(modifierIndex);
            while (modifier && modifier.length > 0) {
                parsedPath.modifiers.push(modifier);
                ppn = ppn.substring(0, ppn.length - modifier.length);

                const modifierIndex = ppn.lastIndexOf(".");
                modifier = modifierIndex > 0 ? ppn.substring(modifierIndex) : undefined;
            }
            parsedPath.name = ppn;
        }

        return parsedPath;
    }
}

/**
 * Allows defining DOM "hook functions" like <html lang="en" XYZ-args-supplier="xyzArgsHook">.
 * Given one or more DOM elements, look for hookName attribute and, if the hookName ("XYZ-args-supplier")
 * references a Javascript function return it as a Javascript function instance. It's unsafe because it
 * runs an unchecked eval to determine if a string is a function.
 * @param {string} hookName the name of the DOM element attribute which specifies a function reference
 * @param {HTMLElement} domElems one or more DOM elements to search, defaults to <html>, and document
 * @param {HTMLElement} options optional custom handlers for value enhancement or error handling
 * @returns the first DOM element which has an attribute with hookName that points to a valid JS function
 */
function domElemsAttrHook(hookName, domElemsArg, options) {
    const handlers = {
        validValue: (value, ctx) => {
            return value;
        },
        invalidTypeValue: (ctx) => {
            console.error(`[Tunnel.domElemAttrHook(${ctx.elem.tagName}, ${ctx.hookName})] ${ctx.potentialHook} is not a function`);
            return undefined;
        },
        evalErrorValue: (ctx, error) => {
            console.error(`[Tunnel.domElemAttrHook(${ctx.elem?.tagName ?? '??ctx.elem?.tagName'}, ${ctx.hookName})] eval error`, error, ctx);
            return undefined;
        },
        notFoundValue: (ctx) => {
            return undefined;
        }
    };

    let domElems = domElemsArg
        ? (typeof domElemsArg === "function" ? domElemsArg() : domElemsArg)
        : [document.documentElement];
    if (!Array.isArray(domElems)) domElems = [domElems];

    const validValue = options?.validValue ?? handlers.validValue;
    const invalidTypeValue = options?.invalidTypeValue ?? handlers.invalidTypeValue;
    const evalErrorValue = options?.evalErrorValue ?? handlers.evalErrorValue;
    const notFoundValue = options?.notFoundValue ?? handlers.notFoundValue;

    for (const elem of domElems) {
        const ctx = { hookName, elem, domElems, options };
        try {
            const potentialHook = elem.getAttribute(hookName);
            if (potentialHook) {
                ctx.potentialHook = potentialHook;
                const hook = jsTokenEvalResult(potentialHook);
                return typeof hook === "function"
                    ? validValue(hook, ctx)
                    : invalidTypeValue(ctx);
            }
        } catch (error) {
            return evalErrorValue(ctx, error);
        }
    }

    return notFoundValue({ hookName, domElems, options });
}

/**
 * Flexibly create an object from an arguments supplier and a set of rules.
 * This is our standard approach to constructing objects and hooks;
 * argsSupplier is the primary object instance and should contain the
 * canonical properties. When certain properties should always be present, they
 * can be supplied in rules.defaultArgs.
 * @param {object | () => object} argsSupplier
 * @param {object | () => object} rulesSupplier
 * @returns
 */
function flexibleArgs(argsSupplier, rulesSupplier) {
    // if rulesSupplier is a function, evaluate it and assume those are our rules;
    // rules may be undefined so be sure to use optional chaining to protect it.
    const rules = rulesSupplier
        ? (typeof rulesSupplier === "function" ? rulesSupplier(argsSupplier) : rulesSupplier)
        : undefined;

    // if we have a defaultArgs rule, use it; if defaultArgs is a function,
    // evaluate it and assume that those are the actual default arguments.
    const defaultArgsSupplier = rules?.defaultArgs ?? {};
    const defaultArgs = typeof defaultArgsSupplier === "function"
        ? defaultArgsSupplier(rules,
            typeof argsSupplier === "function"
                ? argsSupplier(rules)
                : argsSupplier,
            argsSupplier)
        : defaultArgsSupplier;

    // now that we have our rules and default arguments setup the canonical
    // arguments instance. If the argsSupplier is a function, evaluate it and
    // use it as the starting point. If argsSupplier is a function, it should
    // be defined like (defaultArgs) => ({...defaultArgs, myNewArg: "value"})
    // because the function is responsible for inheriting the default args.
    // If argsSupplier is an object instance, defaultArgs will automatically
    // be inherited.
    const args = typeof argsSupplier === "function"
        ? argsSupplier(defaultArgs, rules)
        : (argsSupplier ? { ...defaultArgs, ...argsSupplier } : defaultArgs);

    // If a DOM hook like <html lang="en" XYZ-args-supplier="xyzArgsHook"> is
    // defined, allow it to do a final flexible configuration of the args.
    // hookable DOM element instances can be an array or a function which
    // returns an array of DOM element instances. If no hookableDomElems are
    // provided in rules, we see if window.flexibleArgsHookableDomElems is
    // available use those as the instances. Finally, if no local DOM elems
    // are supplied and window.flexibleArgsHookableDomElems is not available
    // then document.documentElement (HTML tag), document.head (<head>), and
    // document.body (<body>) are used.
    let domHook = undefined;
    if (rules?.hookableDomElemsAttrName) {
        const hookableDomElemsSupplier = rules.hookableDomElems ?? window.flexibleArgsHookableDomElems;
        const hookableDomElems = hookableDomElemsSupplier
            ? (typeof rules.hookableDomElems === "function" ? rules.hookableDomElems(args, rules) : rules.hookableDomElems)
            : [document.documentElement];
        domHook = domElemsAttrHook(rules.hookableDomElemsAttrName, hookableDomElems, {
            validValue: (value, ctx) => {
                return { hookFn: value, domElem: ctx.elem, hookName: ctx.hookName };
            }
        });
    }

    if (rules?.enhanceArgs) {
        result = rules.enhanceArgs(result);
    }

    let result = { args, rules, domHook, argsSupplier, rulesSupplier };
    if (domHook) {
        if (rules.onDomHook) result = rules.onDomHook(result);
        result = domHook.hookFn(result);
        if (rules?.enhanceArgsAfterDomHook) {
            result = rules.enhanceArgsAfterDomHook(result);
        }
    }

    if (rules?.diagnose) rules.diagnose(result);

    // TODO: consider adding a dispatchEvent style args notification bus;
    //       this might be useful for object or hook-construction lifecyles.
    return result;
}

function governedArgs(argsSupplier, rulesSupplier) {
    const result = flexibleArgs(argsSupplier, rulesSupplier);
    // TODO: add https://ajv.js.org/ schema validation
    if (result.rules?.consumeArgs) {
        result.rules.consumeArgs(result);
    }
    return result;
}

class Singletons {
    #singletons = [];

    constructor(lifecycleEE) {
        this.lifecycleEE = lifecycleEE;
    }

    declare(identity, construct, configArgsSupplier, configRulesSupplier) {
        const request = { identity, construct, configArgsSupplier, configRulesSupplier };
        let singleton = this.#singletons[identity];
        if (!singleton) {
            const config = flexibleArgs(configArgsSupplier, {
                defaultArgs: {
                    construct,                      // (config) => { return constructed; }
                    // optional:
                    lifecycleEE: this.lifecycleEE,  // EventEmitter
                    lifecycleEventName: undefined,  // (suggested) => string
                },
                hookableDomElemsAttrName: "rf-hook-universal-event-emitter-singletons",
                hookableDomElems: [document.documentElement, document.head],
                ...configRulesSupplier
            });
            singleton = {
                value: (reason) => {
                    const { construct, lifecycleEE, lifecycleEventName } = config.args;
                    if ("constructedValue" in singleton) {
                        if (lifecycleEE) lifecycleEE.emit(lifecycleEventName("accessed"), { ...singleton, reason });
                    } else {
                        singleton.constructedValue = construct(singleton.config, this);
                        if (lifecycleEE) {
                            lifecycleEE.emit(lifecycleEventName("constructed"), { ...singleton, reason });
                            lifecycleEE.emit(lifecycleEventName("accessed"), { ...singleton, reason });
                        }
                    }
                    return singleton.constructedValue;
                }, config
            };
            let { lifecycleEE, lifecycleEventName } = config.args;
            if (!lifecycleEventName) {
                lifecycleEventName = (suggested) => suggested;
                config.args.lifecycleEventName = lifecycleEventName;
            }
            this.#singletons[identity] = singleton;
            if (lifecycleEE) lifecycleEE.emit(lifecycleEventName("declared"), { singleton, manager: this, request });
        } else {
            configRulesSupplier?.onDuplicateDeclaration?.(request);
        }
        return singleton;
    }

    instance(identity, onNotDeclared) {
        const singleton = this.#singletons[identity];
        if (singleton) return singleton;

        if (onNotDeclared) {
            return onNotDeclared(this);
        } else {
            if (this.lifecycleEE) {
                this.lifecycleEE.emit("singleton-not-declared", identity);
            } else {
                console.log('Singletons.instance', identity, "not found, no onNotDeclared handler");
            }
            return undefined;
        }
    }
}

/**
 * https://github.com/subversivo58/Emitter/blob/master/Emitter.js
 * https://github.com/subversivo58/Emitter/commit/9f4bb5d93165cc17ad02810fb1a6cd4635f360c3
 * @license The MIT License (MIT)             - [https://github.com/subversivo58/Emitter/blob/master/LICENSE]
 * @copyright Copyright (c) 2020 Lauro Moraes - [https://github.com/subversivo58]
 * @version 0.1.0 [development stage]         - [https://github.com/subversivo58/Emitter/blob/master/VERSIONING.md]
 */
class EventEmitter extends EventTarget {
    static sticky = Symbol()
    static singletons = new class extends Singletons {
        declare(identity, configArgsSupplier, configRulesSupplier) {
            return super.declare(identity, () => new EventEmitter(), configArgsSupplier, configRulesSupplier);
        }
    }();

    constructor() {
        super()
        // store listeners (by callback)
        this.listeners = {
            '*': [] // pre alocate for all (wildcard)
        }
        // l = listener, c = callback, e = event
        this[EventEmitter.sticky] = (l, c, e) => {
            // dispatch for same "callback" listed (k)
            l in this.listeners ? this.listeners[l].forEach(k => k === c ? k(e.detail) : null) : null
        }
    }

    on(e, cb, once = false) {
        // store one-by-one registered listeners
        !this.listeners[e] ? this.listeners[e] = [cb] : this.listeners[e].push(cb)
        // check `.once()` ... callback `CustomEvent`
        once ? this.addEventListener(e, this[EventEmitter.sticky].bind(this, e, cb), { once: true }) : this.addEventListener(e, this[EventEmitter.sticky].bind(this, e, cb))
    }

    off(e, Fn = false) {
        if (this.listeners[e]) {
            // remove listener (include ".once()")
            let removeListener = target => {
                this.removeEventListener(e, target)
            }
            // use `.filter()` to remove expecific event(s) associated to this callback
            const filter = () => {
                this.listeners[e] = this.listeners[e].filter(val => {
                    return val === Fn ? removeListener(val) : val
                })
                // check number of listeners for this target ... remove target if empty
                this.listeners[e].length === 0 ? e !== '*' ? delete this.listeners[e] : null : null
            }
            // use `.while()` to iterate all listeners for this target
            const iterate = () => {
                let len = this.listeners[e].length
                while (len--) {
                    removeListener(this.listeners[e][len])
                }
                // remove all listeners references (callbacks) for this target (by target object)
                e !== '*' ? delete this.listeners[e] : this.listeners[e] = []
            }
            Fn && typeof Fn === 'function' ? filter() : iterate()
        }
    }

    emit(e, d) {
        this.listeners['*'].length > 0 ? this.dispatchEvent(new CustomEvent('*', { detail: d })) : null;
        this.dispatchEvent(new CustomEvent(e, { detail: d }))
    }

    once(e, cb) {
        this.on(e, cb, true)
    }
}

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function debounce(func, wait) {
    let timeout;
    let waitFunc;

    return function () {
        if (isFunction(wait)) {
            waitFunc = wait;
        }
        else {
            waitFunc = function () { return wait };
        }

        // deno-lint-ignore no-this-alias
        const context = this, args = arguments;
        const later = function () {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, waitFunc());
    };
}

function inspectUrlHttpHeaders(options = {
    inspectURL: null, // default is current page/location
    onHeaders: null,  // (headers, url) => void,
    onHeader: null,   // { "header": (value, key, alias, url) => void, "header2": [found: (value, key, alias, url) => void, notFound: (key, alias, url) => void] }
}) {
    function parseHttpHeaders(httpHeaders) {
        return httpHeaders.split("\r\n")
            .map(x => x.split(/: */, 2))
            .filter(x => x[0])
            .reduce((ac, x) => {
                const headerNameAsIs = x[0];
                const headerNameCamelCase = headerNameAsIs.toLowerCase().replace(/([-_][a-z])/g, group =>
                    group.toUpperCase()
                        .replace('-', '')
                        .replace('_', '')
                );
                const headerValueAsIs = x[1];
                let headerValue = undefined;
                try {
                    headerValue = JSON.parse(headerValueAsIs);
                } catch {
                    headerValue = headerValueAsIs;
                }
                ac[headerNameAsIs] = headerValue;
                ac[headerNameCamelCase] = headerValue;
                ac.__headerNameAliases[headerNameCamelCase] = headerNameAsIs;
                ac.__headerNameAliases[headerNameAsIs] = headerNameCamelCase;
                return ac;
            }, { __headerNameAliases: {} });
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
                const alias = headers.__headerNameAliases[key];
                const handlers = options.onHeader[key];
                const foundHeaderFn = Array.isArray(handlers) ? handlers[0] : handlers;
                const notFoundHeaderFn = Array.isArray(handlers) ? handlers[1] : undefined;
                if (!(key in headers)) {
                    if (typeof notFoundHeaderFn === "function") {
                        notFoundHeaderFn(key, alias, inspectURL);
                    } else if (notFoundHeaderFn) {
                        console.error(`[inspectUrlHttpHeaders] onHeader "${key}" notFoundHeaderFn is not a function`);
                    }
                } else {
                    const value = headers[key];
                    if (typeof foundHeaderFn === "function") {
                        foundHeaderFn(value, key, alias, inspectURL);
                    } else {
                        console.error(`[inspectUrlHttpHeaders] onHeader "${key}" foundHeaderFn is not a function`);
                    }
                }
            }
        }
    }
    xhr.send();
}

function httpEndpointAvailableAction(url, action, state) {
    const prepareHttpRequest = (url, state) => {
        const http = new XMLHttpRequest();
        http.open("HEAD", url, /*async*/true);
        http.setRequestHeader('Content-Type', 'text/plain');
        return http;
    }

    // if caller wants to setup any state, use the context variable
    const http = state?.prepareXMLHttpRequest
        ? state.prepareXMLHttpRequest(url, state)
        : prepareHttpRequest(url, state);

    http.onreadystatechange = function (xhrEvent) {
        if (http.readyState == 4) {
            if (http.status == 200) {
                action({ request: http, url, xhrEvent, state });
            } else {
                if (state?.onInvalidStatus) {
                    state.onInvalidStatus({ request: http, url, xhrEvent, state });
                }
            }
        }
    };
    try {
        http.send(null);
    } catch (error) {
        if (state?.onError) {
            if (state?.onInvalidStatus) {
                state.onInvalidStatus({ request: http, url, xhrEvent, state, error });
            }
        }
    }
}

/**
 * Since location.reload(true) is depractated, use POST instead of GET
 * to force reload of the current page.
 */
function httpHardRefreshURL(url = location.href) {
    const form = document.createElement('form');
    form.method = "POST";
    form.action = url;
    document.body.appendChild(form);
    form.submit();
}

class LabeledBadge {
    // valid after construction
    remoteBaseURL;
    useBadgenLib;
    importModule;
    #initialized = false;
    #isBadgenLibLoaded = false;

    // valid only after init() is called
    autoHTML; // (badgenArgs) => string -- will automatically be set based on whether we're using loadBadgenLib

    constructor(argsSupplier) {
        const { args } = governedArgs(argsSupplier, {
            defaultArgs: {
                remoteBaseURL: 'https://badgen.net/badge',
                importModule: (lib, actuate) => import(lib).then(actuate),
                useBadgenLib: true,
            },
        });

        this.remoteBaseURL = args.remoteBaseURL;
        this.useBadgenLib = args.useBadgenLib;
        this.importModule = args.importModule;
    }

    badgenArgs(args) {
        const badgenArgs = {
            // API: https://github.com/badgen/badgen#in-browser
            status: args.status || "status", // <Text>, required
            ...args
        };
        return args?.enhanceBadgen ? args.enhanceBadgen(badgenArgs) : badgenArgs;
    }

    badgenRemoteURL(badgenArgs) {
        const badge = this.badgenArgs(badgenArgs);
        return `${this.remoteBaseURL}/${badge.label}/${badge.status}/${badge.color}`;
    }

    decorateHTML(badgenArgs, html) {
        if (badgenArgs.elaborationText) {
            html = `<span title="${badgenArgs.elaborationText}">${html}</span>`;
        }
        if (badgenArgs.actionable) {
            html = `<a onclick="${badgenArgs.actionable}">${html}</a>`
        }
        return html;
    }

    badgenRemoteImageHTML(badgenArgs) {
        return this.decorateHTML(badgenArgs, `<img src="${this.badgenRemoteURL(badgenArgs)}">`);
    }

    init() {
        // we return 'this' to allow convenient method chaining
        if (this.#initialized) return this;

        // use the external badge API temporarily while the badgen script is being loaded
        // while this is the primary update(), this.#isBadgenLibLoaded should remain false
        this.autoHTML = (badgenArgs) => {
            return this.badgenRemoteImageHTML(badgenArgs);
        }

        if (this.useBadgenLib) {
            // load the badgen script so that if it's needed later it will be faster than making network calls
            this.importModule("https://unpkg.com/badgen", () => {
                this.autoHTML = (badgenArgs) => {
                    return this.decorateHTML(badgenArgs, badgen(this.badgenArgs(badgenArgs)));
                };
                // once we've loaded the library, statistics are possible (not before then)
                this.#isBadgenLibLoaded = true;
            });
        }

        this.#initialized = true;

        // we return 'this' to allow convenient method chaining
        return this;
    }

    get isBadgenLibLoaded() {
        return this.#isBadgenLibLoaded;
    }
}

class TunnelStatePresentation {
    static defaultInitialStatus = "inactive";
    summaryBadgeDomID; // string
    elaborationHtmlDomID; // string

    constructor(argsSupplier) {
        const { args } = governedArgs(argsSupplier, {
            defaultArgs: {
                summaryBadgeDomID: "rf-universal-tunnel-state-summary-badge",
                elaborationHtmlDomID: "rf-universal-tunnel-state-elaboration",
                initialStatus: TunnelStatePresentation.defaultInitialStatus,
                labeledBadge: new LabeledBadge().init(),
                defaultLabel: "Tunnel"
            },
        });

        this.summaryBadgeDomID = args.summaryBadgeDomID;
        this.elaborationHtmlDomID = args.elaborationHtmlDomID;
        this.labeledBadge = args.labeledBadge;
        this.defaultLabel = args.defaultLabel;
    }

    badgenArgs(state, options) {
        const status = state.status;
        const label = options?.label ?? this.defaultLabel;
        const color = options?.color ?? (status == "inactive" ? 'red' : (status == "active" ? 'green' : 'orange'));
        const icon = options?.icon;
        return this.labeledBadge.badgenArgs({
            // API: https://github.com/badgen/badgen#in-browser
            label,             // <Text>
            labelColor: '555', // <Color RGB> or <Color Name> (default: '555')
            status,            // <Text>, required
            color,             // <Color RGB> or <Color Name> (default: 'blue')
            style: 'classic',  // 'flat' or 'classic' (default: 'classic')
            icon,              // Use icon (default: undefined), best to use 'data:image/svg+xml;base64,...'
            iconWidth: 13,     // Set this if icon is not square (default: 13)
            scale: 1,          // Set badge scale (default: 1)
            ...options,
        });
    }

    update(state, options) {
        const tspElem = document.getElementById(this.summaryBadgeDomID);
        if (tspElem) {
            tspElem.innerHTML = this.labeledBadge.autoHTML(this.badgenArgs(state, options));
        } else {
            console.warn(`Tunnel state could not be updated: DOM element id='${this.summaryBadgeDomID}' was not found.`);
        }
    }

    display(state = true) {
        if (this.summaryBadgeElement) {
            this.summaryBadgeElement.style.display = state ? 'block' : 'none';
        }
    }

    get summaryBadgeElement() {
        return document.getElementById(this.summaryBadgeDomID);
    }

    get elaborationHtmlElement() {
        return document.getElementById(this.elaborationHtmlDomID);
    }

    get isStatisticsPresentationPossible() {
        return this.labeledBadge.isBadgenLibLoaded;
    }
}

class TunnelReconnectStrategy {
    static UNKNOWN = 0;
    static WAITING = 1;
    static TRYING = 2;
    static COMPLETED = 3;
    static ABORTED = 4;

    connect;     // (trs: TunnelReconnectStrategy) => void
    report;      // (trs: TunnelReconnectStrategy) => void
    maxAttempts; // number;
    #attempt;
    #interval;
    #status = TunnelReconnectStrategy.UNKNOWN;

    constructor(connect, report, maxAttempts = 15) {
        this.connect = connect;
        this.report = report;
        this.maxAttempts = maxAttempts;
        this.#attempt = 0;
    }

    get attempt() {
        return this.#attempt;
    }

    get status() {
        return this.#status;
    }

    set status(value) {
        this.#status = value;
        this.report(this);
    }

    get statusText() {
        switch (this.#status) {
            case TunnelReconnectStrategy.UNKNOWN:
                return "unknown";
            case TunnelReconnectStrategy.WAITING:
                return "waiting";
            case TunnelReconnectStrategy.TRYING:
                return `reconnecting ${this.#attempt}/${this.maxAttempts}`;
            case TunnelReconnectStrategy.COMPLETED:
                return "reconnected";
            case TunnelReconnectStrategy.ABORTED:
                return "aborted";
        }
        return "?";
    }

    reconnect() {
        this.status = TunnelReconnectStrategy.WAITING;
        this.#interval = setInterval(() => {
            this.#attempt++;
            if (this.#attempt > this.maxAttempts) {
                this.exit(TunnelReconnectStrategy.ABORTED);
            } else {
                this.status = TunnelReconnectStrategy.TRYING;
                this.connect(this);
            }
        }, 1000);
        return this; // return 'this' to encourage method chaining
    }

    exit(status = TunnelReconnectStrategy.COMPLETED) {
        this.status = status;
        if (this.#interval) {
            clearInterval(this.#interval);
            this.#interval = undefined;
        }
        return this; // return 'this' to encourage method chaining
    }
}

class EventSourceTunnelState {
    static instanceIndex = 0;
    static defaultInitialStatus = "inactive";

    // these are valid after constructor() has completed.
    esURL;                              // string (event source URL)
    esPingURL;                          // string (event source readiness URL)
    #identity;                          // string
    #wrappedListeners = [];             // { type: string, callback: (event) => void}[]
    #eventSourceSupplier;               // () => EventSource
    #eventSource;                       // EventSource
    #status;                            // string
    #statusErrorEvent;                  // if #status is 'error', this is the error event
    #statePresentation;                 // (status, options) => void

    // these are only valid after init() has been completed.
    #messageIdentitiesEncountered = {}; // Record<string, { count: number }>

    constructor(tunnel, argsSupplier) {
        this.esURL = `${tunnel.baseURL}/sse/tunnel`;
        this.esPingURL = `${tunnel.baseURL}/sse/ping`;
        const { args } = governedArgs(argsSupplier, {
            defaultArgs: {
                eventSourceSupplier: () => new EventSource(this.esURL),
                statePresentation: () => tunnel.statePresentation,
                identity: () => {
                    EventSourceTunnelState.instanceIndex++;
                    return `EventSourceTunnelState${EventSourceTunnelState.instanceIndex}`;
                },
                initialStatus: () => EventSourceTunnelState.defaultInitialStatus,
            },
        });

        this.#eventSourceSupplier = args.eventSourceSupplier;
        this.#identity = args.identity();
        this.#status = args.initialStatus ? args.initialStatus() : EventSourceTunnelState.defaultInitialStatus;
        this.#statePresentation = args.statePresentation();
    }

    init(reconnector = undefined) {
        // if the server is available, try to connect to the EventSource SSE endpoint
        httpEndpointAvailableAction(this.esPingURL, (httpEAA) => {
            this.#eventSource = this.#eventSourceSupplier();

            this.#eventSource.onopen = (event) => {
                // this will trigger set status(value) and this.#statePresentation.update(this)
                this.status = "active";
                if (reconnector) reconnector.exit();
            }

            this.#eventSource.onclose = (event) => {
                // this will trigger set status(value) and this.#statePresentation.update(this)
                this.status = "inactive";
                if (reconnector) reconnector.exit(TunnelReconnectStrategy.ABORTED);
            }

            this.#eventSource.onerror = (event) => {
                this.#eventSource.close();
                this.#statusErrorEvent = event;
                // this will trigger set status(value) and this.#statePresentation.update(this)
                this.status = "error";
                // recursively call init() until success or aborted exit
                new TunnelReconnectStrategy((reconnector) => {
                    this.init(reconnector);
                }, (reconnector) => {
                    this.#statePresentation.update(this, {
                        enhanceBadgen: (suggested) => {
                            suggested.status = reconnector.statusText;
                            return suggested;
                        }
                    });
                }).reconnect();
            }

            // in case we're reconnecting, get the existing listeners attached to the new ES
            if (this.#wrappedListeners.length > 0) {
                this.#wrappedListeners.forEach(l => {
                    this.#eventSource.addEventListener(l.identity, l.wrappedCB);
                });
            }
        }, {
            onInvalidStatus: (event) => {
                this.#status = "tunnel-unhealthy";
                this.#statePresentation.update(this, {
                    enhanceBadgen: (suggested) => {
                        suggested.status = "unavailable";
                        suggested.elaborationText = `Ping URL ${this.esPingURL} is not available (click to hard-refresh)`;
                        suggested.elaborationHTML = `<a href="${this.esPingURL}">Ping URL</a> was not available.`;
                        suggested.actionable = () => { httpHardRefreshURL() }
                        return suggested;
                    }
                });
            }
        });

        // we return 'this' to allow convenient method chaining
        return this;
    }

    get identity() {
        return this.#identity;
    }

    get status() {
        return this.#status;
    }

    set status(value) {
        this.#status = value;
        this.#statePresentation.update(this);
    }

    get statusErrorEvent() {
        return this.#statusErrorEvent;
    }

    get statePresentation() {
        return this.#statePresentation;
    }

    addEventSourceEventListener(identity, callback, options) {
        const wrappedCB = (event) => {
            let encountered = this.#messageIdentitiesEncountered[identity];
            if (!encountered) {
                encountered = { count: 0 };
                this.#messageIdentitiesEncountered[identity] = encountered;
            }
            encountered.count++;

            const diagnose = options?.diagnose ?? false;
            if (diagnose) {
                console.info(`[TunnelState] message: ${identity}`, event, encountered);
            }
            callback(event);
        }
        // hang onto the listeners in case we need to reconnect with a new EventSource
        // or if the #eventSource is not ready yet.
        this.#wrappedListeners.push({ identity, wrappedCB, options });
        if (this.#eventSource) {
            // if the event source is available go ahead and assign the listener;
            // sometimes due to reconnection or other async requests it won't be
            // available, so the listener will be added when #eventSource becomes
            // available.
            this.#eventSource.addEventListener(identity, wrappedCB);
        }
        return this;
    }
}

class Tunnels {
    // these are only valid after init() has been completed.
    #esTunnels = {};

    constructor(argsSupplier) {
        const { args } = governedArgs(argsSupplier, {
            defaultArgs: {
                baseURL: "/tunnel",
                statePresentation: new TunnelStatePresentation(),
            },
            hookableDomElemsAttrName: "tunnel-hook-args-supplier",
            hookableDomElems: [document.documentElement, document.head],
        });

        this.baseURL = args.baseURL;
        this.statePresentation = args.statePresentation;
    }

    init() {
        // for future extensions in case subclasses need to do special init;
        // always return 'this' to allow convenient method chaining
        return this;
    }

    registerEventSourceState(eventSourceTunnelStateArg) {
        const eventSourceTunnelState = typeof eventSourceTunnelStateArg === "function"
            ? eventSourceTunnelState(this)
            : eventSourceTunnelStateArg;
        eventSourceTunnelState.init();
        this.#esTunnels[eventSourceTunnelState.identity] = eventSourceTunnelState;
        return eventSourceTunnelState;
    }
}

class UserAgentBus {
    #clientReqMessageBaseURL;
    #config;
    #registry = [];
    #identifiables = {};

    constructor(argsSupplier) {
        this.#config = flexibleArgs(argsSupplier, {
            defaultArgs: {
                hookableDomElemsAttrName: "user-interactions-args-supplier",
                hookableDomElems: [document.documentElement, document.head],
                domElemHookName: (element, potentialName = element.dataset.tunnelUi) => {
                    return (potentialName == "auto" || potentialName == "yes")
                        ? `tuiHook_${element.id || `${element.tagName}_${this.registry.length}`}`
                        : potentialName;
                },
                discoverDomElemHook(element, discover = eval) {
                    const hookName = this.domElemHookName(element);
                    const hookFactory = jsTokenEvalResult(
                        hookName,
                        discover,
                        (name) => { console.log(`[UserAgentBus.discoverDomElemHook] '${name}' is not a token for current scope (${element.tagName} ${element.id})`, element); return undefined; },
                        (error, name) => { console.log(`[UserAgentBus.discoverDomElemHook] token discovery '${name}' generated error in current scope (${element.tagName} ${element.id}): ${error}`, error, element); return undefined; }
                    );
                    if (hookFactory) {
                        const hook = hookFactory(element, hookName, this);
                        hook.operationsEE.emit("constructed", { element, hookName, hookFactory, uab: this });
                        return this.register(hook);
                    }
                    return undefined;
                },
                prepareClientReqMessage: (hook, message) => {
                    return {
                        nature: "UserAgentBus.message",
                        tuiHookIdentity: hook.identity,
                        ...message
                    }
                },
                determineMessageHook: (message, onNotFound = this.args.onHandleMessageHookIdNotFound) => {
                    const attemptedHookID = message.tuiHookIdentity;
                    if (attemptedHookID) {
                        let hook = this.#identifiables[attemptedHookID];
                        if (!hook) hook = onNotFound(message, attemptedHookID, this)
                        return hook;
                    }
                    return this.args.onHandleMessageHookIdNotProvided(message, this);
                },
                onDuplicateControlHook: (newHook, existingHook, identity) => {
                    console.warn(`[UserAgentBus.register] duplicate controlHook '${identity}' registered.`, newHook, existingHook, identity);
                    return newHook; // sending back hook means register this one, sending undefined skips its
                },
                onHandleMessageHookIdNotProvided: (message) => {
                    console.warn(`[UserAgentBus.onHandleMessageHookIdNotProvided] controlHook ID not provided in message (expecting message.tuiHookIdentity property).`, message, this.identifiables);
                    return undefined; // sending back undefined means stop looking, any other value would be a hook in case this method wants to replace it
                },
                onHandleMessageHookIdNotFound: (message, attemptedHookID) => {
                    console.warn(`[UserAgentBus.onHandleMessageHookIdNotFound] controlHook ID '${attemptedHookID}' in message not found.`, message, this.identifiables);
                    return undefined; // sending back undefined means stop looking, any other value would be a hook in case this method wants to replace it
                },
            }
        });

        this.#clientReqMessageBaseURL = this.#config.args.clientReqMessageBaseURL;
        if (!this.#clientReqMessageBaseURL) throw Error("this.#config.args.clientReqMessageBaseURL expected in new UserAgentBus({ clientReqMessageBaseURL: ? })");
    }

    get clientReqMessageBaseURL() { return this.#clientReqMessageBaseURL; }
    get config() { return this.#config; }
    get args() { return this.#config.args; }
    get registry() { return this.#registry; }
    get domElemHookName() { return this.#config.args.domElemHookName; }
    get discoverDomElemHook() { return this.#config.args.discoverDomElemHook; }
    get identifiables() { return this.#identifiables; }
    get prepareClientReqMessage() { return this.#config.args.prepareClientReqMessage; }

    register(constructedHook) {
        let registeredHook = constructedHook;
        const identity = registeredHook.identity;
        this.#registry.push(registeredHook);
        if (identity) {
            const existing = this.#identifiables[identity];
            if (existing && this.args.onDuplicateControlHook) {
                registeredHook = this.args.onDuplicateControlHook(registeredHook, existing, identity);
            }
            if (registeredHook) {
                this.#identifiables[identity] = registeredHook;
                const { operationsEE } = registeredHook;
                operationsEE.on("user-agent-request", (message) => {
                    this.sendClientReqMessage(registeredHook, message, true);
                });
                operationsEE.on("user-agent-notification", (message) => {
                    this.sendClientReqMessage(registeredHook, message, false);
                });
                operationsEE.emit("registered", { uab: this, identity });
            }
        }
        // chainable
        return this;
    }

    sendClientReqMessage(hook, message, fullDuplex) {
        const transactionID = "TODO:UUIDv5?"; // tokens, user agent strings, etc.
        const clientProvenance = 'UserAgentBus.sendClientMessage';
        const endpoint = this.#clientReqMessageBaseURL;
        const payload = this.prepareClientReqMessage(hook, { ...message, transactionID, endpoint, clientProvenance, uab: this });
        console.log("[UserAgentBus.sendClientMessage]", payload);

        const body = JSON.stringify(payload);
        if (fullDuplex) {
            fetch(endpoint, { method: "POST", body })
                .then(res => res.json())
                .then(message => {
                    hook.operationsEE.emit("user-agent-server-response", { ...message, transactionID, endpoint, clientProvenance, uab: this });
                }).catch(error => {
                    hook.operationsEE.emit("user-agent-request-error", { body, error, transactionID, uab: this });
                    console.error(`${endpoint} POST error`, body, error);
                });
        } else {
            fetch(endpoint, { method: "POST", body }).catch(error => {
                hook.operationsEE.emit("user-agent-notification-error", { body, error, transactionID, uab: this });
                console.error(`${endpoint} POST error`, body, error);
            });
        }
    }

    handleServerMessage(message, onNotFound) {
        const hook = this.args.determineMessageHook(message, onNotFound);
        if (hook) {
            const clientProvenance = 'UserAgentBus.handleServerMessage';
            hook.operationsEE.emit("server-notification", { ...message, endpoint, clientProvenance, uab: this });
        }
    }

    // deno-lint-ignore require-await
    async init() {
        console.log(`[UserAgentBus.init]`, this);
        // encourage chaining
        return this;
    }
}