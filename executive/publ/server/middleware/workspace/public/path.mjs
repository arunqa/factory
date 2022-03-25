import { createDomain } from "https://unpkg.com/effector@22.2.0/effector.mjs";
import JSONFormatter from "https://cdn.jsdelivr.net/npm/json-formatter-js@2.3.4/dist/json-formatter.esm.js";

import * as d from "./deps.auto.js";
export * from "./deps.auto.js"; // make symbols available to pages

/**
 * Activate all site-wide functionality such as navigation. We use as much
 * modern HTML5, "vanilla" HTML, and as little JS as possible. When JS is needed
 * use Effector for state management and async effect.
 * UI guide: https://www.w3schools.com/howto/
 */
export const activateSite = () => {
    const navBar = document.createElement("div");
    navBar.className = "navbar";
    navBar.innerHTML = `
        <a href="#" id="edit-origin-src" class="highlight"><i class="fa-solid fa-file-code"></i> Edit</a>
        <a href="routes.html"><i class="fa-solid fa-route"></i> Routes</a>
        <a href="layout.html"><i class="fa-solid fa-layer-group"></i> Layout</a>
        <a href="operational-ctx.html"><i class="fa-solid fa-terminal"></i> Operational Context</a>`;
    document.body.insertBefore(navBar, document.body.firstChild);
    for (const a of navBar.children) {
        if (a.href == window.location) {
            a.className += " active";
        }
    }

    // do anything that's content-specific after document loaded
    // document.addEventListener('DOMContentLoaded', () => {
    // });
}

export const projectDomain = createDomain("project");
export const projectInitFx = projectDomain.createEffect(async () =>
    (await fetch("/publication/inspect/project.json")).json()
);

export const $project = projectDomain.createStore(null).on(
    projectInitFx.doneData,
    (_, project) => project,
);

export const activatePage = (clientLayout, resAnchor = document.getElementById("edit-origin-src")) => {
    if (resAnchor) {
        populateResourceEditElem(clientLayout, resAnchor);
    }
}

// public/operational-context/server.auto.mjs sets window.parent.inspectClientLayout
// using executive/publ/server/middleware/workspace/public/inspect/index.html registerInspectionTarget
export const inspectClientLayout = () => window.parent.inspectClientLayout;

export const populateObjectJSON = (inspect, replaceElemContent) => {
    if (replaceElemContent) {
        replaceElemContent.innerHTML = "";
        // see https://github.com/mohsen1/json-formatter-js#api
        const formatter = new JSONFormatter(inspect);
        replaceElemContent.appendChild(formatter.render());
    }
}

export const populateResourceEditElem = (clientLayout, resAnchor) => {
    const activeResourceAbsPath = clientLayout.route?.terminal?.fileSysPath;
    if (activeResourceAbsPath) {
        const [redirectURL] = d.editableFileRedirectURL(activeResourceAbsPath);
        resAnchor.href = redirectURL;
        resAnchor.title = `Edit ${clientLayout.route?.terminal?.fileSysPathParts?.base} in IDE`;
    } else if (clientLayout.route?.origin) {
        const { origin } = clientLayout.route;
        const [href, loc] = d.locationEditorRedirectURL(origin);
        let fileName = loc;
        const lastSlash = loc ? loc.lastIndexOf('/') : -1;
        if (lastSlash > 0) fileName = loc.substring(lastSlash + 1);
        resAnchor.href = href;
        resAnchor.title = `Edit ${fileName} in IDE${origin.label ? ` (look for <code>${origin.label}</code>)` : ''}`;
    } else {
        resAnchor.href = "#";
        resAnchor.title = `${clientLayout.route?.terminal?.qualifiedPath} is not editable (no clientLayout.route.terminal.fileSysPath or clientLayout.route.origin)`;
    }
}