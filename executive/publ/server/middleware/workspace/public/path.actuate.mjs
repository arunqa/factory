// User agent (client side) hydration is managed by Effector events, stores,
// and effects. Learn from Svelte components which extracts state from components
// into a hoisted scope and sort all expressions into Effector "business logic".
// Unless we're talking about simple, truly local, state stored in components,
// perform all state management outside of components as Effect "business logic"
// and allow components to observe those events and stores ("watched hydration").
//
// A good example of watched hydration is pageFetchJsonFx, which acts as a server-
// fetch "service bus" Effector effect. All functions that need server side JSON
// should use the pageFetchJsonFx directly or wrap pageFetchJsonFx into a custom
// effect. Then, any page content that needs hydration can use either a wrapped,
// or "composed", or direct call to pageFetchJsonFx. This means that all server
// fetches for arbitrary JSON can be observed and reacted upon by each component
// without needing any special hydration at the component level.
//
// Observability should be Effector-independent, too. This means that each effect
// such as pageFetchJsonFx should implement normal DOM-based events whenever
// possible so that *.addEventListener can be used for listening to hydration
// messages.
//
// Philosopy:
// * Don't re-invent or re-imagine HTML, even if it's extra code just use HTML. It's
//   better not to create one-liners as functions unless those functions are events,
//   effects or stores that are observable.
// * HTML should be easy, where possible, for content authors / editors / writers.
//   This means that the HTML should not be assumed to be targeted at developers but
//   to a broad audience which might include non-developers (e.g. QA, editors, authors).
// * Allow progressive rendering to stream content to users as soon as it's ready.
//   Client side JavaScript bundles should be eliminated or async defered. Data
//   requests should never prevent rendering (load them after first paint). HTML,
//   assets, and images must be loaded as soon as possible with asynchronous
//   data loading in as it completes.

import { createDomain } from "https://unpkg.com/effector@22.3.0/effector.mjs";
import JSONFormatter from "https://cdn.jsdelivr.net/npm/json-formatter-js@2.3.4/dist/json-formatter.esm.js";
import * as sb from "./service-bus.mjs";

// We directly import Javascript but we need to "bundle" Typescript.
// deps.auto.js is auto-bundled from any Typescript we consider a dependency.
import * as d from "./deps.auto.js";
export * from "./deps.auto.js"; // make symbols available to pages

// public/operational-context/server.auto.mjs sets window.parent.inspectableClientLayout
// using executive/publ/server/middleware/workspace/public/inspect/index.html registerRfExplorerTarget
export const inspectableClientLayout = () => window.parent.inspectableClientLayout;
export const isClientLayoutInspectable = () => window.parent.inspectableClientLayout ? true : false;
export const isFramedExplorer = () => window.parent.isFramedExplorer && window.parent.isFramedExplorer() ? true : false;

// if a URL needs to pass information about a route, use routeUnitUrlSearchParams
export const routeUnitUrlSearchParams = (routeUnit) => {
    const usp = new URLSearchParams();
    usp.set('routeUnitFileSysPath', routeUnit.fileSysPath);
    usp.set('routeUnitQualifiedPath', routeUnit.qualifiedPath);
    return usp;
};


// if a fetchURL looks like "x/y/test.ts.json" or "test.js.json" it's
// considered a server-side source (serverSideSrc) fetch URL, which runs JS/TS
// code on the server and returns JSON response as evaluated on the server.
export const isServerSideSrcFetchURL = (fetchURL) => fetchURL.match(/\.(js|ts)\.json$/);

/**
 * fetchFxInitServerSideSrc prepares sb.fetchFx params with requestInit and
 * fetchURL for fetching server-side source (serverSideSrc) JSON value.
 * @param {*} fetchURL the endpoint to call
 * @param {*} serverSideSrc text of JS or TS source code to send to the server
 * @returns partial sb.fetchFx params which for spreading with other params
 */
export function fetchFxInitServerSideSrc(fetchURL, serverSideSrc) {
    return {
        fetchURL,
        requestInit: (_fetchFxParams) => {
            return {
                method: "POST",
                body: serverSideSrc,
                headers: { "Content-Type": "text/plain" }
            };
        }
    }
}

let fetchFxInitSqlIndex = 0;
export const fetchSqlFxSuccessEventName = "fetchSqlFxSuccess";

/**
 * fetchFxInitSQL prepares sb.fetchFx params with requestInit and
 * fetchURL for fetching SQL execution results from any server-side endpoint.
 * @param {string} SQL the SQL text to send to the server
 * @param {string} resultNature "rows" for array of arrays, or "records" for array of objects with keys as column names
 * @param {string} fetchURL the endpoint to call, defaults to "/SQL"
 * @returns partial sb.fetchFx params which for spreading with other params
 */
export function fetchFxInitSQL(SQL, fetchFxSqlID, resultNature = "records", fetchURL = "/SQL") {
    fetchFxInitSqlIndex++;
    return {
        fetchFxSqlID: fetchFxSqlID && fetchFxSqlID.toString().trim().length > 0
            ? fetchFxSqlID
            : `fetchFxInitSQL_${fetchFxInitSqlIndex}`,
        fetchURL,
        requestInit: () => ({
            method: "POST",
            headers: {
                'Content-type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ SQL, resultNature })
        }),
        fetchFxSuccessEventName: fetchSqlFxSuccessEventName
    }
}

/**
 * fetchFxInitPublSqlDQL prepares sb.fetchFx params with requestInit and
 * fetchURL for fetching SQL execution results from server-side SQLite instance.
 * @param {string} SQL the SQL text to send to the server
 * @param {string} resultNature "rows" for array of arrays, or "records" for array of objects with keys as column names
 * @returns partial sb.fetchFx params which for spreading with other params
 */
export function fetchFxInitPublSqlDQL(SQL, fetchFxSqlID, resultNature) {
    return fetchFxInitSQL(SQL, fetchFxSqlID, resultNature, "/SQL/publ/DQL");
}

/**
 * fetchFxInitAlaSqlProxyDQL prepares sb.fetchFx params with requestInit and
 * fetchURL for fetching SQL execution results from server-side AlaSqlProxy instance.
 * @param {string} SQL the SQL text to send to the server
 * @param {string} resultNature "rows" for array of arrays, or "records" for array of objects with keys as column names
 * @returns partial sb.fetchFx params which for spreading with other params
 */
export function fetchFxInitAlaSqlProxyDQL(SQL, fetchFxSqlID, resultNature) {
    return fetchFxInitSQL(SQL, fetchFxSqlID, resultNature, "/SQL/asp");
}

// prepare effects, events and stores that can be used for site management;
export const siteDomain = createDomain("project");
export const pageDomain = createDomain("page");

export function withScriptDeps(deps, depsID, onReady, options) {
    const {
        autoLoadScriptJS = "//cdnjs.cloudflare.com/ajax/libs/script.js/2.5.9/script.min.js",
        onError = (reason) => console.error(`withScriptDeps error: ${reason}`),
        onReadyGuard = undefined, // () => truthy will test for a truthy result before returning
        onReadyGuardMaxAttempts = 10, // if attempts is greater than 0, will wait for onReadyGuard
        onReadyGuardInterval = 500, // milliseconds between attempts
        onReadyGuardFailed = undefined, // what to call on failure
        report = undefined, // (...args) => console.log(`[withScriptDeps]`, ...args)
    } = options ?? {};
    let onReadyGuardResult = onReadyGuard && onReadyGuard(options);
    if (onReadyGuardResult) {
        onReady(onReadyGuardResult);
    } else {
        if ("$script" in window) {
            $script(deps, depsID, () => {
                onReadyGuardResult = onReadyGuard && onReadyGuard(options);
                report?.('[withScriptDeps] loaded', { onReadyGuardResult, deps, depsID, onReady, options });
                if (!onReadyGuard || onReadyGuardResult) {
                    onReady(onReadyGuardResult);
                } else if (onReadyGuard && onReadyGuardMaxAttempts) {
                    const guard = (onReadyGuardAttempt = 0) => {
                        onReadyGuardResult = onReadyGuard(options);
                        if (onReadyGuardResult) {
                            onReady(onReadyGuardResult);
                        } else {
                            if (onReadyGuardAttempt < onReadyGuardMaxAttempts) {
                                report?.('[onReadyGuard] attempt', onReadyGuardAttempt, 'of', onReadyGuardMaxAttempts, { onReadyGuardResult, deps, depsID, onReady, options });
                                setTimeout(() => guard(onReadyGuardAttempt + 1), onReadyGuardInterval);
                            } else {
                                report?.('[onReadyGuard] onReadyGuardMaxAttempts exceeded', { onReadyGuardResult, deps, depsID, onReady, options });
                                onReadyGuardFailed?.(deps, depsID, onReady, options, onReadyGuardAttempt);
                            }
                        }
                    }
                    guard();
                } else {
                    report?.('[onReadyGuardFailed] onReadyGuard without onReadyGuardMaxAttempts', { deps, depsID, onReady, options });
                    onReadyGuardFailed?.(deps, depsID, onReady, options);
                }
            });
        } else {
            if (autoLoadScriptJS && !options.isAutoLoadRecursionResult) {
                report?.('auto-loading $script', autoLoadScriptJS);
                const scriptElem = document.createElement('script');
                scriptElem.onload = () => {
                    report?.('auto-loaded $script', autoLoadScriptJS);
                    withScriptDeps(deps, depsID, onReady, { ...options, isAutoLoadRecursionResult: true });
                }
                scriptElem.type = 'text/javascript';
                scriptElem.src = autoLoadScriptJS;
                document.head.appendChild(scriptElem);
            } else {
                // need loader: <script src="https://cdnjs.cloudflare.com/ajax/libs/script.js/2.5.9/script.min.js"></script>
                onError?.('$script-not-available');
            }
        }
    }
}

export function withTippyJsDeps(onReady) {
    // reminder: tippy.js needs popperjs, popper is loaded in deps.js.ts;
    // TODO: once we figure out how to get tippy.js into deps.js.ts let's move it
    withScriptDeps("//unpkg.com/tippy.js@6", 'tippyjs', (tippyJsInstance) => {
        onReady(tippyJsInstance);
    }, {
        // after loading the script dependencies we need to see if Tippy.js is available;
        // if it's not, we'll check every 500ms up to 10 times (5 seconds).
        onReadyGuard: () => window.tippy,
        onReadyGuardInterval: 500, // in milleseconds
        onReadyGuardMaxAttempts: 10,
        onReadyGuardFailed: (deps, depsID) => console.error(`[withTippyJsDeps] unable to load deps with guard`, { deps, depsID, tippyJsInstance: window.tippy }),
    });
}

// This is the default activatePage effect which just sets up the basic site
// infrastructure. If no special setup is required, use:
//
//   document.addEventListener('DOMContentLoaded', activatePageFx);
//
// If you need special setup, use:
//
//   document.addEventListener('DOMContentLoaded', () => {
//     -- create events, stores, etc. needed by activatePageFx.done.watch()
//     activatePageFx();
//   });
//
export const activatePageFx = siteDomain.createEffect(async (params) => {
    const {
        autoActivateSite = true,
        onBeforeActivate, // in case something should be done before activation
    } = params ?? {};

    const activateFxResult = {
        inspectableRFUL: inspectableClientLayout()
    };

    if (typeof autoActivateSite == "boolean" && autoActivateSite) {
        activateSite(activateFxResult);
    }

    // it's best for onBeforeActivate to be an Effector effect but it can be
    // any async function; page will not active until onBeforeActivate
    // concludes and all triggers attached to it fire.
    if (onBeforeActivate) await onBeforeActivate(activateFxResult);

    // When page activation is completed, this can be used to do any further setup:
    //    activatePageFx.done.watch(({ result: { inspectableRFUL } }) => {
    //      console.log('done initializing', inspectableRFUL);
    //    });
    return activateFxResult;
});

activatePageFx.fail.watch((failedFxArgs) => {
    console.error('activatePageFx.fail.watch', { failedFxArgs });
});

window.addEventListener(sb.fetchFxFailEventName, (event) => {
    console.error(sb.fetchFxFailEventName, { event });
});

// Whenever a basic JSON fetch is required, use this so others can listen in
// and react to effects in case they need it. Don't use custom fetches because
// those cannot be easily observed by others. This is the central JSON-focused
// "fetch service bus". The only required effect parameter is "fetchURL" but
// other parameters such as "fetchID" or "fetchCtx" could be used as well.
// You can pass in diagnose to add some diagnostics or pass in cache: false
// if a caching is not desired (don't use cache: undefined, use cache: false).
export const pageFetchJsonFx = siteDomain.createEffect(async (params) => await sb.fetchFx({
    // put fetchValue first since it may be overwritten in ...params
    fetchValue: sb.fetchRespJsonValue, ...params,
}));

// Since deps.js.ts contains "https://raw.githubusercontent.com/douglascrockford/JSON-js/master/cycle.js",
// pageFetchJsonFx also supports JSON.decycle and JSON.retrocycle to allow complex
// JSON values which might have circular values.
export const pageFetchRetrocycledJsonJFx = siteDomain.createEffect(async (params) => await sb.fetchFx({
    // put fetchValue first since it may be overwritten in ...params
    fetchValue: sb.fetchRespRetrocycledJsonValue, ...params,
}));

// create an effect for a specific script with given arguments
export function prepareFetchServerRuntimeScriptJsonEffect(srScript, srScriptArgs) {
    const fetchFxArgs = {
        ...fetchFxInitServerSideSrc(`/unsafe-server-runtime-proxy/module/${srScript.name}${srScriptArgs ? `?${srScriptArgs.toString()}` : ''}`, srScript.module.code),
        srScript, srScriptArgs,
        cache: false,
        fetchValue: srScript.transformResult == "retrocycle-JSON"
            ? sb.fetchRespRetrocycledJsonValue
            : sb.fetchRespJsonValue,
    };
    return siteDomain.createEffect(async (params) => await sb.fetchFx({ ...fetchFxArgs, ...params }));
}

// create an effect for any script - where script is passed in when effect is launched
export const pageFetchServerRuntimeScriptJsonFx = siteDomain.createEffect(async (params) => {
    if (params.srScript) {
        // srScript must be provided in params
        const args = {
            ...fetchFxInitServerSideSrc(`/unsafe-server-runtime-proxy/module/${params.srScript.name}${params.srScriptArgs ? `?${params.srScriptArgs.toString()}` : ''}`, params.srScript.module.code),
            ...params,
            cache: false,
            fetchValue: params.srScript.transformResult == "retrocycle-JSON"
                ? sb.fetchRespRetrocycledJsonValue
                : sb.fetchRespJsonValue,
        };
        return await pageFetchJsonFx(args);
    } else {
        console.error(`srScript missing in params to preparServerRuntimeScriptFx(params)`);
        return undefined;
    }
});

pageFetchServerRuntimeScriptJsonFx.fail.watch((watchParams) => {
    console.error('pageFetchServerRuntimeScriptJsonFx.fail', { watchParams });
})

export function watchPageFetchServerRuntimeScriptJsonFxDone(watchSrScriptSupplier, watcher) {
    let isTargetScript;
    let launchableFxParams;
    switch (typeof watchSrScriptSupplier) {
        case "string":
            isTargetScript = (srScript) => srScript.qualifiedName == watchSrScriptSupplier;
            break;
        case "object":
            if (watchSrScriptSupplier?.srScript) {
                launchableFxParams = watchSrScriptSupplier;
                isTargetScript = (srScript) => srScript.qualifiedName == launchableFxParams.srScript.qualifiedName;
            } else {
                console.warn('watchPageFetchServerRuntimeScriptJsonFxDone', "watchSrScriptSupplier is a launchableFxParams candidate but doesn't supply .srScript");
                return;
            }
            break;
        case "function":
            isTargetScript = watchSrScriptSupplier;
            break;
        default:
            console.warn('watchPageFetchServerRuntimeScriptJsonFxDone', "unknown watchSrScriptSupplier");
            return;
    }
    pageFetchServerRuntimeScriptJsonFx.done.watch((watchParams) => {
        if (isTargetScript(watchParams.params.srScript)) {
            watcher(watchParams);
        }
    });
    if (launchableFxParams && launchableFxParams.autoActivate) {
        activatePageFx.done.watch(() => {
            pageFetchServerRuntimeScriptJsonFx(launchableFxParams);
        });
    }
}

export const transformContentFx = siteDomain.createEffect(async () => {
    // find all <pre data-transformable="markdown"> and run Markdown-it transformation
    await d.transformMarkdownElems();
});

export const jsEvalFailureHTML = (evaluatedJS, error, location, context) => {
    console.error(`Unable to evaluate ${evaluatedJS} in ${location}`, error, context);
    return `Unable to evaluate <code><mark>${evaluatedJS}</mark></code>: <code><mark style="background-color:#FFF2F2">${error}</mark></code> in <code>${location}</code>`;
}

export function prepareHookableDomRenderEffect(elem, options) {
    const defaulJsEvalFailureHTML = ({ evaluatedJS, error, location = "prepareHookableDomRenderEffect", context }) => {
        console.error(`Unable to evaluate ${evaluatedJS} in ${location}`, error, context);
        return `Unable to evaluate <code><mark>${evaluatedJS}</mark></code>: <code><mark style="background-color:#FFF2F2">${error}</mark></code> in <code>${location}</code>`;
    }

    const {
        evalJS = eval, // pass in context-aware eval if desired
        renderJsDestructureArgs, // provide "local variables" support for elem.renderJsCode eval context
        renderJsBodyCodeSupplier, // a function which gives the JS code for the body of the renderer
        renderHookJsCodeSupplier, // a function which gives the JS code for the eval'able hook provider
        renderHook, // if you want to override the entire render hook, supply the method
        jsEvalFailureHTML = defaulJsEvalFailureHTML,
        renderJS, // if you want to override the entire renderJS before eval, supply a string
        render, // if you want to override the entire render method (no eval required), supply a function
        renderFx // if you want to override the entire renderFx itself, supply an Effector createEffect() instance
    } = options ?? {};

    // when this method is finished, elem.render() and elem.renderFx() are core deliverables;
    // elem.renderJsBody and elem.renderJS are for debugging and useful in error path.

    elem.renderJsBody = renderJsBodyCodeSupplier?.(elem, options);
    elem.renderJS = renderJS?.(elem) ?? `
            (fxParams) => {
                // fxParams is what's passed via elem.renderFx(): target, jsEvalFailureHTML, etc.
                ${renderJsDestructureArgs && renderJsDestructureArgs.trim().length > 0 ? `const ${renderJsDestructureArgs} = fxParams;` : '// no local variables requested'}
                try {
                    ${elem.renderJsBody ?? "// no elem.renderJsBody available via renderJsBodyCodeSupplier(elem, options)"}
                } catch(error) {
                    fxParams.target.innerHTML = fxParams.jsEvalFailureHTML({
                        evaluatedJS: fxParams.target.renderJsBody, error,
                        location: fxParams.jsEvalFailureLocation, context: fxParams
                    });
                }
            }`;
    // prepare for exception
    let evaluatedJS = elem.renderJS;
    try {
        // if evalJS is supplied by caller, evaluate the JS in that context otherwise
        // it will be evaluated in this script's context
        elem.render = render ?? evalJS(evaluatedJS, elem, options);
        elem.renderFx = renderFx ?? pageDomain.createEffect((params) => elem.render({
            ...params,
            target: elem,
            jsEvalFailureLocation: evaluatedJS,
            jsEvalFailureHTML
        }));

        // now that the effect is setup, see if the element wants to hook anything
        if (renderHook || renderHookJsCodeSupplier) {
            // we reuse evaluatedJS name so that if exception occurs, we use the new code;
            // evaluatedJS should be JS code which returns a function accepting a single
            // object which will have a 'target' property, like:
            //    ({ target }) => someFx.done.watch(target.renderFx)
            if (renderHookJsCodeSupplier) evaluatedJS = renderHookJsCodeSupplier(elem, options);
            elem.renderHook = renderHook ?? evalJS(evaluatedJS, elem, { ...options, isRenderHookEvalJS: true });
            elem.renderHook({ target: elem, jsEvalFailureHTML, jsEvalFailureLocation: evaluatedJS });
        }
    } catch (error) {
        elem.innerHTML = jsEvalFailureHTML({
            evaluatedJS, error,
            location: `prepareHookableDomRenderEffect[${elem.tagName}]`,
            context: { elem, options }
        });
    }

    if (elem.hasAttribute("diagnose")) {
        console.log(`prepareHookableDomRenderEffect diagnose`, { elem, options });
    }
}

export const registerFootnotesContainer = pageDomain.createEvent();
export const $footnotesContainer = pageDomain.createStore(null)
    .on(registerFootnotesContainer, (_, value) => value);

export const registerFootnote = pageDomain.createEvent();
export const clearFootnotes = pageDomain.createEvent();
export const $footnotes = pageDomain.createStore({})
    .on(registerFootnote, (list, args) => {
        let { elem, content = elem?.innerHTML, defaultIndex } = args;
        const {
            nature = "footnote",
            identitySupplier = () => elem.id.length > 0 ? elem.id : undefined,
            fnIndexAttrName = "fn-index",
            refAnchorHTML = (state) => `<a href="#fn${state.index}" class="fn-ref fn-ref-${state.index}">${state.index}<a>`,
            targetAnchorHTML = (state) => {
                const refs = state.refElems();
                return `<a id="fn${state.index}" title="${refs.length} ref${refs.length != 1 ? 's' : ''}" class="fn-ref-target fn-ref-target-${state.index}">${state.index}<a>`;
            },
            refsSelector = (state) => document.querySelectorAll(`sup[elaboration="${state.identity}"]`),
        } = args;

        const fnContainer = $footnotesContainer.getState();
        if (!elem) {
            if (args.identity && content && fnContainer) {
                elem = document.createElement("div");
                elem.id = args.identity;
                fnContainer.appendChild(elem);
                defaultIndex = fnContainer.querySelectorAll("div").length;
            } else {
                console.error(`[$footnotes.on(registerFootnote)] unable to create footnote content, need identity + content + fnContainer`);
            }
        }

        const domSuppliedIndex = elem.getAttribute(fnIndexAttrName);
        const index = domSuppliedIndex && domSuppliedIndex.length > 0 ? domSuppliedIndex : defaultIndex
        const identity = identitySupplier() ?? `fn${index}`;
        const elaborationState = {
            nature,
            identity,
            content, // "frozen" version so
            index,
            refElems: () => refsSelector(elaborationState),
            render: () => {
                elem.innerHTML = `<sup>${targetAnchorHTML(elaborationState)}</sup> ${content}`;
                elaborationState.refElems().forEach(refElem => {
                    refElem.innerHTML = refAnchorHTML(elaborationState);
                    withTippyJsDeps((tippy) => tippy(refElem, {
                        content,
                        allowHTML: true,
                        placement: 'right'
                    }));
                });
            }
        };
        elem.elaborationState = elaborationState;
        return { ...list, [identity]: elaborationState };
    })
    .reset(clearFootnotes);

$footnotes.watch((footnotes) => {
    // render all on any change (in case dynamic content supplied)
    Object.values(footnotes).forEach(fn => fn.render());
});

export function prepareDomEffects(domEffectsInit = {}) {
    const {
        evalJS,
        renderFxAttrName = "render-fx", // custom renderer provided in <script> or attribute
        populateJsonFxResultAttrName = "populate-json-fx", // no body required, populateObjectJSON renders FX result
        populateJsonStoreAttrName = "populate-json-store", // no body required, populateObjectJSON renders FX result
        interpolateFxAttrName = "interpolate-fx", // body is interpolated as template text literal
        renderHookAttrName = "render-hook", // when to render one of the above
        renderHookActivatePageAttrName = "render-hook-activate-page", // special hook for page activation
    } = domEffectsInit;

    const typicalRenderHook = (renderElem) => {
        if (renderElem.hasAttribute(renderHookActivatePageAttrName)) {
            return ({ target }) => activatePageFx.done.watch(target.renderFx);
        }
        return undefined;
    }

    for (const renderElem of document.querySelectorAll(`[${renderFxAttrName}]`)) {
        prepareHookableDomRenderEffect(renderElem, {
            evalJS,
            renderJS: (elem) => {
                // if a <script type="render-fx"> is available, use it otherwise
                // use render-fx="({ target, result }) => target.innerHTML = 'something'" attribute
                // if no <script> or render-fx attr available, use the entire body as a script
                const scriptElem = elem.querySelector('script[type="render-fx"]');
                const attrValue = renderElem.getAttribute(renderFxAttrName);
                return scriptElem ? scriptElem.innerText : (attrValue ? attrValue : elem.innerHTML);
            },
            renderHookJsCodeSupplier: (elem) => {
                return elem.getAttribute(renderHookAttrName);
            },
            renderHook: typicalRenderHook(renderElem)
        });
    }

    for (const renderElem of document.querySelectorAll(`[${populateJsonFxResultAttrName}]`)) {
        prepareHookableDomRenderEffect(renderElem, {
            evalJS,
            render: ({ result, target }) => {
                const attrValue = renderElem.getAttribute(populateJsonFxResultAttrName);
                if (!attrValue || attrValue != "append") {
                    target.innerHTML = '';
                }
                populateObjectJSON(result, target, 2)
            },
            renderHookJsCodeSupplier: (elem) => {
                return elem.getAttribute(renderHookAttrName);
            },
            renderHook: typicalRenderHook(renderElem)
        });
    }

    for (const renderElem of document.querySelectorAll(`[${populateJsonStoreAttrName}]`)) {
        prepareHookableDomRenderEffect(renderElem, {
            evalJS,
            render: (storeValue) => {
                const attrValue = renderElem.getAttribute(populateJsonStoreAttrName);
                if (!attrValue || attrValue != "append") {
                    renderElem.innerHTML = '';
                }
                populateObjectJSON(storeValue, renderElem, 2);
            },
            renderHookJsCodeSupplier: (elem) => {
                return elem.getAttribute(renderHookAttrName);
            },
            renderHook: typicalRenderHook(renderElem)
        });
    }

    for (const renderElem of document.querySelectorAll(`[${interpolateFxAttrName}]`)) {
        const scriptElem = renderElem.querySelector('script[type="interpolate-fx"]');
        const jsBodyCode = scriptElem ? scriptElem.innerText : renderElem.innerHTML;
        prepareHookableDomRenderEffect(renderElem, {
            evalJS,
            renderJsDestructureArgs: renderElem.getAttribute(interpolateFxAttrName),
            renderJsBodyCodeSupplier: () => {
                // use the entire element HTML as template literal string to interpolate;
                // the interpolated text will have access to whatever the effect/store passes in
                return `fxParams.target.innerHTML = \`${jsBodyCode}\``;
            },
            renderHookJsCodeSupplier: (elem) => {
                return elem.getAttribute(renderHookAttrName);
            },
            renderHook: typicalRenderHook(renderElem)
        });
    }

    // footnote content is placed in a class class "elaborations"
    const elaborations = document.querySelectorAll(`.elaborations div`);
    if (elaborations.length > 0) {
        elaborations.forEach((elem, index) => registerFootnote({ elem, defaultIndex: index + 1 }));
    } else {
        const elaborationRefs = document.querySelectorAll(`sup[elaboration]`);
        elaborationRefs.forEach(elem => {
            elem.title = `no elaboration content supplied for ${elem.getAttribute("elaboration")}`;
            elem.innerHTML = `⚠️`;
            console.warn(elem.title, { elem });
        });
    }
}

/**
 * Given a Resource Factory route-like instance, derive parts that could be used
 * to prepare an anchor, button or link that would lead to the editable resource
 * in IDEs like VS Code.
 * @param {rfGovn.Route} route RF route-like instance
 * @returns {{ fileName: string, src: string, href: string, narrative: string}} parts that could be used in anchors
 */
export const editableRouteAnchor = (route, onNotEditable) => {
    const activeResourceAbsPath = route?.terminal?.fileSysPath;
    if (activeResourceAbsPath) {
        const [redirectURL, src] = d.editableFileRedirectURL(activeResourceAbsPath);
        return {
            fileName: route?.terminal?.fileSysPathParts?.base,
            src,
            href: redirectURL,
            narrative: `Edit ${route?.terminal?.fileSysPathParts?.base} in IDE`,
        };
    } else if (route?.origin) {
        const { origin } = route;
        const [href, src] = d.locationEditorRedirectURL(origin);
        let fileName = src;
        const lastSlash = src ? src.lastIndexOf('/') : -1;
        if (lastSlash > 0) fileName = src.substring(lastSlash + 1);
        return {
            fileName,
            src,
            href,
            narrative: `Edit ${fileName} in IDE${origin.label ? ` (look for ${origin.label})` : ''}`,
        };
    }
    return onNotEditable ? onNotEditable(route) : undefined;
}

export const editableClientLayoutTarget = (clientLayout = inspectableClientLayout(), onNotEditable) => {
    return editableRouteAnchor(clientLayout.route, onNotEditable);
}

export const activateFooter = () => {
    const footer = document.createElement("footer");
    footer.className = "page";

    if (isFramedExplorer()) {
        footer.appendChild(document.createTextNode("🧭"));

        const selected = (which) => window.parent.location.search.indexOf(`orientation=${which}`) > 0 ? " selected" : "";
        const orientationSelect = document.createElement("select");
        orientationSelect.className = "orientation";
        orientationSelect.innerHTML = `
            <option value="?orientation=east&size=25"${selected('east')}>East</option>
            <option value="?orientation=south&size=35"${selected('south')}>South</option>
            <option value="?orientation=west&size=25"${selected('west')}>West</option>
            <option value="?orientation=north&size=35"${selected('north')}>North</option>`;
        orientationSelect.onchange = (event) => window.parent.location.search = event.target.value;
        orientationSelect.title = "Change rfExplorer Panel Orientation";
        footer.appendChild(orientationSelect);

        if (isClientLayoutInspectable()) {
            const clientLayout = inspectableClientLayout();
            const closeAnchor = document.createElement("a");
            closeAnchor.className = "info action-close-explorer";
            closeAnchor.href = clientLayout.navigation.location(clientLayout.route?.terminal);
            closeAnchor.target = "_top";
            closeAnchor.innerHTML = "❎ Close";
            closeAnchor.title = "Close rfExplorer Panel";
            footer.appendChild(closeAnchor);
        }
    }

    const restartAnchor = document.createElement("a");
    restartAnchor.className = "info action-restart-publ-server";
    restartAnchor.onclick = () => fetch('/server/restart');
    restartAnchor.innerHTML = "↻ Restart";
    footer.appendChild(restartAnchor);
    withTippyJsDeps((tippy) => tippy(restartAnchor, {
        content: "Restart pubctl.ts server",
        placement: 'top'
    }));

    const todoAnchor = document.createElement("a");
    todoAnchor.className = "info action-TODO";
    todoAnchor.href = '/workspace/docs/';
    todoAnchor.innerHTML = "TODOs";
    footer.appendChild(todoAnchor);

    const editWsPageAnchor = document.createElement("a");
    let wsPageLogicalFsPath = window.location.pathname.replace("/workspace", "/public");
    if (wsPageLogicalFsPath.endsWith("/")) wsPageLogicalFsPath += "index.html";
    const wsPageFactoryPath = `/factory/executive/publ/server/middleware/workspace${wsPageLogicalFsPath}`;
    editWsPageAnchor.className = "info action-edit-workspace-src";
    editWsPageAnchor.href = `/workspace/editor-redirect${wsPageFactoryPath}`;
    editWsPageAnchor.innerHTML = "📝 Src";
    editWsPageAnchor.title = `Edit ${wsPageFactoryPath}`;
    footer.appendChild(editWsPageAnchor);

    document.body.appendChild(footer);
}

/**
 * Activate all site-wide functionality such as navigation and footers. We use
 * as much modern HTML5, "vanilla" HTML, and as little JS as possible. When JS
 * is needed use Effector for state management and async effect.
 */
export const activateSite = () => {
    // TODO: consider using https://www.w3schools.com/howto/howto_html_include.asp
    const baseURL = "/workspace";
    const navPrime = document.createElement("nav");
    navPrime.className = "prime";

    let contextBarHTML;
    if (isClientLayoutInspectable()) {
        const eclTarget = editableClientLayoutTarget(
            inspectableClientLayout(), (route) => ({
                href: "#", narrative: `route not editable: ${JSON.stringify(route)}`
            }));
        contextBarHTML = `<a href="${eclTarget.href}" title="${eclTarget.narrative}">Edit <code class="rf-resource-inspectable-active">${eclTarget.fileName}</code> in IDE</a>`
    }

    // <!-- --> are there in between <a> tags to allow easier readability here but render with no spacing in DOM
    navPrime.innerHTML = `
        ${contextBarHTML ? `<div class="context">${contextBarHTML}</div>` : ''}<!--
        --><a href="${baseURL}/resource/index.html"><i class="fa-solid fa-file-lines"></i> Resource</a><!--
        --><a href="${baseURL}/design-system/index.html"><i class="fa-solid fa-layer-group"></i> Design System</a><!--
        --><a href="${baseURL}/site/index.html"><i class="fa-solid fa-sitemap"></i> Site</a><!--
        --><a href="${baseURL}/server-runtime-sql/index.html"><i class="fa-solid fa-database"></i> SQL</a><!--
        --><a href="${baseURL}/server-runtime-script/index.html"><i class="fa-brands fa-js-square"></i> Evaluate</a><!--
        --><a href="${baseURL}/assurance/"><i class="fa-solid fa-microscope"></i> Unit Tests</a>`;
    document.body.insertBefore(navPrime, document.body.firstChild);

    for (const a of navPrime.children) {
        if (a.href == window.location) {
            a.className += " active";
        }
    }

    activateFooter();

    // see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
    // and https://css-tricks.com/send-an-http-request-on-page-exit/
    document.addEventListener('visibilitychange', function logData() {
        if (document.visibilityState === 'hidden') {
            //TODO: [ ] add /server/beacon to record telemetry in database
            navigator.sendBeacon('/server/beacon', "TODO");
        }
    });
}

export const objectJsonHtmlElem = (inspect, open, options) => {
    // see https://github.com/mohsen1/json-formatter-js#api
    const formatter = new JSONFormatter(inspect, open, options);
    return formatter.render();
}

export const populateObjectJSON = (inspect, targetElem, open, options) => {
    if (targetElem) {
        targetElem.innerHTML = "";
        // see https://github.com/mohsen1/json-formatter-js#api
        const formatter = new JSONFormatter(inspect, open, options);
        targetElem.appendChild(formatter.render());
    }
}

export const populateSelectElem = (selectElem, optionsSupplier) => {
    selectElem.length = 0;
    selectElem.selectedIndex = 0;
    for (const item of optionsSupplier()) {
        const nOption = document.createElement('option');
        const nData = document.createTextNode(item.text ?? item.value);
        nOption.setAttribute('value', item.value ?? item.text);
        nOption.appendChild(nData);
        selectElem.appendChild(nOption);
    }
}

const MINUTE = 60,
    HOUR = MINUTE * 60,
    DAY = HOUR * 24,
    WEEK = DAY * 7,
    MONTH = DAY * 30,
    YEAR = DAY * 365

export function timeSince(date) {
    const secondsAgo = Math.round((+new Date() - date) / 1000)
    let divisor = null
    let unit = null

    if (secondsAgo < MINUTE) {
        return secondsAgo + " seconds ago"
    } else if (secondsAgo < HOUR) {
        [divisor, unit] = [MINUTE, 'minute']
    } else if (secondsAgo < DAY) {
        [divisor, unit] = [HOUR, 'hour']
    } else if (secondsAgo < WEEK) {
        [divisor, unit] = [DAY, 'day']
    } else if (secondsAgo < MONTH) {
        [divisor, unit] = [WEEK, 'week']
    } else if (secondsAgo < YEAR) {
        [divisor, unit] = [MONTH, 'month']
    } else if (secondsAgo > YEAR) {
        [divisor, unit] = [YEAR, 'year']
    }

    const count = Math.floor(secondsAgo / divisor)
    return `${count} ${unit}${(count > 1) ? 's' : ''}`
}

