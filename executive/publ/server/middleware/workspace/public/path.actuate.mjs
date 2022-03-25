import { createDomain } from "https://unpkg.com/effector@22.2.0/effector.mjs";
import JSONFormatter from "https://cdn.jsdelivr.net/npm/json-formatter-js@2.3.4/dist/json-formatter.esm.js";

// We directly import Javascript but we need to "bundle" Typescript.
// deps.auto.js is auto-bundled from any Typescript we consider a dependency.
import * as d from "./deps.auto.js";
export * from "./deps.auto.js"; // make symbols available to pages

// public/operational-context/server.auto.mjs sets window.parent.inspectableClientLayout
// using executive/publ/server/middleware/workspace/public/inspect/index.html registerInspectionTarget
export const inspectableClientLayout = () => window.parent.inspectableClientLayout;

// prepare effects, events and stores that can be used for site management;
// at a minimum, every page in the site should have this default Javascript:
//   document.addEventListener('DOMContentLoaded', () => activatePage(inspectableClientLayout()));
export const siteDomain = createDomain("project");
export const activatePage = siteDomain.createEvent();

/**
 * Given a Resource Factory route-like instance, derive parts that could be used
 * to prepare an anchor, button or link.
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

/**
 * Activate all site-wide functionality such as navigation. We use as much
 * modern HTML5, "vanilla" HTML, and as little JS as possible. When JS is needed
 * use Effector for state management and async effect.
 * UI guide: https://www.w3schools.com/howto/
 */
export const activateSite = () => {
    // TODO: consider using https://www.w3schools.com/howto/howto_html_include.asp
    const navBar = document.createElement("div");
    navBar.className = "navbar";
    navBar.innerHTML = `
        <a href="#" class="highlight"><i class="fa-solid fa-file-code"></i> Edit</a>
        <a href="routes.html"><i class="fa-solid fa-route"></i> Routes</a>
        <a href="layout.html"><i class="fa-solid fa-layer-group"></i> Layout</a>
        <a href="operational-ctx.html"><i class="fa-solid fa-terminal"></i> Operational Context</a>`;
    document.body.insertBefore(navBar, document.body.firstChild);

    const eclTarget = editableClientLayoutTarget(
        inspectableClientLayout(), (route) => ({
            href: "#", narrative: `route not editable: ${JSON.stringify(route)}`
        }));
    const editAnchor = navBar.querySelector("a"); // the first anchor is the Edit button
    editAnchor.href = eclTarget.href;
    editAnchor.title = eclTarget.narrative;

    for (const a of navBar.children) {
        if (a.href == window.location) {
            a.className += " active";
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const footer = document.createElement("footer");
        footer.className = "hints";
        footer.innerHTML = `You can move the inspector by using ?<code>orientation</code>=<code>north|south|east|west</code>&amp;<code>size=25</code> where 25 is the percentage of the screen.`;
        document.body.appendChild(footer);
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

export const publicationDomain = createDomain("publication");

// Usually effects, events, and stores should be kept in pages; here we define
// Effector instances that could be reused across pages.

export const projectInitFx = publicationDomain.createEffect(async () =>
    (await fetch("/publication/inspect/project.json")).json()
);

export const $project = publicationDomain.createStore(null).on(
    projectInitFx.doneData,
    (_, project) => project,
);
