import { createDomain } from "https://unpkg.com/effector@22.2.0/effector.mjs";
import JSONFormatter from "https://cdn.jsdelivr.net/npm/json-formatter-js@2.3.4/dist/json-formatter.esm.js";

// We directly import Javascript but we need to "bundle" Typescript.
// deps.auto.js is auto-bundled from any Typescript we consider a dependency.
import * as d from "./deps.auto.js";
export * from "./deps.auto.js"; // make symbols available to pages

// public/operational-context/server.auto.mjs sets window.parent.inspectableClientLayout
// using executive/publ/server/middleware/workspace/public/inspect/index.html registerRfExplorerTarget
export const inspectableClientLayout = () => window.parent.inspectableClientLayout;
export const isClientLayoutInspectable = () => window.parent.inspectableClientLayout ? true : false;
export const isFramedExplorer = () => window.parent.isFramedExplorer && window.parent.isFramedExplorer() ? true : false;

// prepare effects, events and stores that can be used for site management;
// at a minimum, every page in the site should have this default Javascript:
//   document.addEventListener('DOMContentLoaded', () => activatePage(inspectableClientLayout()));
// assume that activatePage will be call after all content is loaded and that
// the "inspectable clientLayout" is available.
export const siteDomain = createDomain("project");
export const activatePage = siteDomain.createEvent();

export const pageFetchJsonFxCache = new Map();

// Whenever a basic JSON fetch is required, use this so others can listen in
// and react to effects in case they need it. Don't use custom fetches because
// those cannot be easily observed by others. This is the central JSON-focused
// "fetch service bus". The only required effect parameter is "fetchURL" but
// other parameters such as "fetchID" or "fetchCtx" could be used as well.
// You can pass in diagnose to add some diagnostics or pass in cache: false
// if a caching is not desired (don't use cache: undefined, use cache: false).
// Since deps.js.ts contains "https://raw.githubusercontent.com/douglascrockford/JSON-js/master/cycle.js",
// pageFetchJsonFx also supports JSON.decycle and JSON.retrocycle to allow complex
// JSON values which might have circular values. By default retrocyle is TRUE.
export const pageFetchJsonFx = siteDomain.createEffect(async (params) => {
    const { fetchURL, diagnose = false, cache = pageFetchJsonFxCache, retrocycle = true } = params;
    if (!fetchURL) throw new Error(`No fetchURL in pageFetchJsonFx(${JSON.stringify(params)})`);

    if (cache && cache.has(fetchURL)) {
        return cache.get(fetchURL);
    }

    const json = await (await fetch(params.fetchURL)).json();
    if (retrocycle) JSON.retrocycle(json);
    if (diagnose) {
        if (typeof json === "object") json.pageFetchJsonFxDiagnostics = {
            ...params,
            cache,
            cacheState: Object.fromEntries(cache), // we want the state of the cache at this moment
            retrocycled: retrocycle,
        };
    }
    if (cache) cache.set(fetchURL, json);
    return json;
});

export const transformContentFx = siteDomain.createEffect(async () => {
    // find all <pre data-transformable="markdown"> and run Markdown-it transformation
    await d.transformMarkdownElems();
});

export const jsEvalFailureHTML = (evaluatedJS, error, location, context) => {
    console.error(`Unable to evaluate ${evaluatedJS} in ${location}`, error, context);
    return `Unable to evaluate <code><mark>${evaluatedJS}</mark></code>: <code><mark style="background-color:#FFF2F2">${error}</mark></code> in <code>${location}</code>`;
}

// find any fetchable JSON placeholders and fill them in
activatePage.watch((clientLayout) => {
    for (const elem of document.querySelectorAll(`[data-var]`)) {
        const varElem = document.getElementById(elem.dataset.var);
        if (varElem) {
            elem.innerHTML = varElem.innerHTML;
        } else {
            elem.innerHTML = `<code>var</code> tag with ID <code><mark>${elem.dataset.var}</mark></code> not defined`;
        }
    }

    for (const elem of document.querySelectorAll(`[data-populate-fetched-json-url]`)) {
        // usage example:
        //   <div data-populate-fetched-json-url="/publication/inspect/project.json"></div>
        //   <div data-populate-fetched-json-url="/publication/inspect/project.json" data-populate-fetched-json-expr="result.something"></div>
        const fetchURL = elem.dataset.populateFetchedJsonUrl;
        pageFetchJsonFx.done.watch(({ params, result }) => {
            if (params.fetchURL === fetchURL) {
                const evalExpr = elem.dataset.populateFetchedJsonExpr;
                if (evalExpr) {
                    // if given an eval'able expression, get the expression value
                    // in this context and populate that JSON instead of full JSON
                    try {
                        populateObjectJSON(eval(evalExpr), elem);
                    } catch (error) {
                        elem.innerHTML = jsEvalFailureHTML(evalExpr, error, 'activatePage.watch(data-populate-fetched-json-expr)', { clientLayout });
                    }
                } else {
                    // Not given an eval'able expression, populate full JSON
                    populateObjectJSON(result, elem);
                }
            }
        });
        pageFetchJsonFx.fail.watch(({ error, params }) => {
            if (params.fetchURL === fetchURL) {
                elem.innerHTML = `Unable to fetch <code>${fetchURL}</code>: <code>${JSON.stringify(error)}</code> in activatePage.watch(${JSON.stringify(params)})`;
            }
        });
        pageFetchJsonFx({ fetchURL });
    }

    for (const elem of document.querySelectorAll(`[data-populate-activate-page-watch-json]`)) {
        // usage examples:
        //   <div data-populate-activate-page-watch-json="clientLayout.route"></div>
        //   <div data-populate-activate-page-watch-json="clientLayout.route.terminal"></div>
        const evalExpr = elem.dataset.populateActivatePageWatchJson;
        try {
            const result = eval(evalExpr);
            if (result) {
                populateObjectJSON(result, elem);
            } else {
                elem.innerHTML = `Evaluation of Unable to evaluate <code><mark>${evalExpr}</mark></code> produced undefined result`;
            }
        } catch (error) {
            elem.innerHTML = jsEvalFailureHTML(evalExpr, error, 'activatePage.watch(data-populate-activate-page-watch-json)', { clientLayout });
        }
    }
});

/**
 * Given a Resource Factory route-like instance, derive parts that could be used
 * to prepare an anchor, button or link that would lead to the editable resource
 * in IDEs like VS Code.
 * @param {rfGovn.Route} route RF route-like instance
 * @returns {{ src: string, href: string, narrative: string}} parts that could be used in anchors
 */
export const editableRouteAnchor = (route, onNotEditable) => {
    const activeResourceAbsPath = route?.terminal?.fileSysPath;
    if (activeResourceAbsPath) {
        const [redirectURL, src] = d.editableFileRedirectURL(activeResourceAbsPath);
        return {
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
    restartAnchor.title = "Restart pubctl.ts server";
    footer.appendChild(restartAnchor);

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
    console.log({ editWsPageAnchorHref: editWsPageAnchor.href })
    editWsPageAnchor.innerHTML = "📝 Src";
    editWsPageAnchor.title = `Edit ${wsPageFactoryPath}`;
    footer.appendChild(editWsPageAnchor);

    document.body.appendChild(footer);
}

/**
 * Activate all site-wide functionality such as navigation. We use as much
 * modern HTML5, "vanilla" HTML, and as little JS as possible. When JS is needed
 * use Effector for state management and async effect.
 * UI guide: https://www.w3schools.com/howto/
 */
export const activateSite = () => {
    // TODO: consider using https://www.w3schools.com/howto/howto_html_include.asp
    const baseURL = "/workspace";
    const navPrime = document.createElement("nav");
    navPrime.className = "prime";
    // <!-- --> are there in between <a> tags to allow easier readability here but render with no spacing in DOM
    navPrime.innerHTML = `
           <a href="#" class="highlight"><i class="fa-solid fa-file-code"></i> Edit</a><!--
        --><a href="${baseURL}/inspect/routes.html"><i class="fa-solid fa-route"></i> Routes</a><!--
        --><a href="${baseURL}/inspect/layout.html"><i class="fa-solid fa-layer-group"></i> Layout</a><!--
        --><a href="${baseURL}/db/index.html"><i class="fa-solid fa-database"></i> psDB</a><!--
        --><a href="${baseURL}/inspect/operational-ctx.html"><i class="fa-solid fa-terminal"></i> OpCtx</a><!--
        --><a href="${baseURL}/assurance/"><i class="fa-solid fa-microscope"></i> Unit Tests</a>`;
    document.body.insertBefore(navPrime, document.body.firstChild);

    const editAnchor = navPrime.querySelector("a"); // the first anchor is the Edit button
    if (isClientLayoutInspectable()) {
        const eclTarget = editableClientLayoutTarget(
            inspectableClientLayout(), (route) => ({
                href: "#", narrative: `route not editable: ${JSON.stringify(route)}`
            }));
        editAnchor.href = eclTarget.href;
        editAnchor.title = eclTarget.narrative;
    } else {
        editAnchor.style.display = "none";
    }

    for (const a of navPrime.children) {
        if (a.href == window.location) {
            a.className += " active";
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        activateFooter();
    });
}

export const populateObjectJSON = (inspect, targetElem, open, options) => {
    if (targetElem) {
        targetElem.innerHTML = "";
        // see https://github.com/mohsen1/json-formatter-js#api
        const formatter = new JSONFormatter(inspect, open, options);
        targetElem.appendChild(formatter.render());
    }
}

