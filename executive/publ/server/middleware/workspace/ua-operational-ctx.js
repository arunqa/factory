// this file is symlink'd by executive/publ/controller.ts:
//
// from executive/publ/server/middleware/workspace/ua-operational-ctx.js   (canonical)
//   to public/operational-context/server.auto.mjs                         (reference)
//
// It's imported as a module by all pages when they run in Experimental server mode by
// pubctl.ts ("development mode"); it is run only by the browser, not at build time by
// Deno. If you make changes, you can easily just hit browser refresh to reload.
//
// It's best to edit this file from public/operational-context/server.auto.mjs
// rather than from executive/publ/server/middleware/workspace/ua-operational-ctx.js
// because the deps are imported relative to public/operational-context/server.auto.mjs.

// initExperimentalServerHooks should be called from a rfUniversalLayout.init() context.

// d namespace contains Typescript-bundled dependencies
import * as d from "./deps.auto.js";

// these are window-scoped so that child frames (e.g. Lightbox) can access;
// the same exact variable names are created by RF frameset explorer.
function registerRfExplorerTarget(clientLayout, serverHooks) {
    window.inspectableClientLayout = clientLayout;
    window.inspectServerHooks = serverHooks;
}

function injectRfExplorer(clientLayout, consoleNavContainerElem) {
    // https://github.com/biati-digital/glightbox is used for embedded Console
    // TODO[essential]: don't use @master, use @3.2.x specific
    //                  using @master now because of this bug: https://github.com/biati-digital/glightbox/pull/319
    import("https://cdn.jsdelivr.net/gh/mcstudios/glightbox@master/dist/js/glightbox.min.js").then(() => {
        const glbStylesheet = document.createElement('link');
        glbStylesheet.href = "https://cdn.jsdelivr.net/gh/mcstudios/glightbox@master/dist/css/glightbox.css";
        glbStylesheet.rel = "stylesheet";
        document.head.appendChild(glbStylesheet);

        const activePath = clientLayout.navigation.location(clientLayout.route?.terminal);
        const workspaceCtxURL = `/workspace${activePath == '/' ? '/' : `/index.html${activePath}`}`;
        const gLightboxClassName = 'glightbox4';
        const inspectorActivateHTML = `
            <style>
            .rfExplorerStrategies { display: none; }
            .rfExplorerActivate:hover + .rfExplorerStrategies {
                display: inline;
                cursor:pointer;
            }
            .rfExplorerStrategies:hover {
                display: inline;
                cursor:pointer;
            }
            .rfExplorerActivate:hover {
                cursor:pointer;
            }
            .rfExplorerStrategies a { text-decoration: none; }
            </style>
            <div style="padding-top: 4px">
                <span class="rfExplorerActivate">🔭 rfExplorer</span><span class="rfExplorerStrategies">
                    <a href="/workspace/server-runtime-sql/index.html" class="${gLightboxClassName}" data-glightbox="width: ${window.innerWidth - 100}px; height: ${window.innerHeight - 100}px;" title="Open rfExplorer lightbox">🗔</a>
                    <a href="${workspaceCtxURL}?orientation=east&size=25" target="_top" title="Open rfExplorer panel to the right (East)">▶️</a>
                    <a href="${workspaceCtxURL}?orientation=south&size=25" target="_top" title="Open rfExplorer panel below (South)">🔽</a>
                    <a href="${workspaceCtxURL}?orientation=west&size=25" target="_top" title="Open rfExplorer panel to the left (West)">◀️</a>
                    <a href="${workspaceCtxURL}?orientation=north&size=25" target="_top" title="Open rfExplorer panel above (North)">🔼</a>
                </span>
            </div>`;

        consoleNavContainerElem.innerHTML = inspectorActivateHTML;
        consoleNavContainerElem.style.display = "block"; // in case it was hidden

        // "teach" GLightbox which anchor should initiate the explorer
        GLightbox({ selector: '.' + gLightboxClassName });
    });
}

function initExperimentalServerHooks(rfUniversalLayoutInitEvent) {
    const { layoutResult: clientLayout } = rfUniversalLayoutInitEvent;
    const { publicUrlLocation, isExperimentalOperationalCtx } = clientLayout.originCtx.operationalCtx;

    const serverHooks = {
        isExperimentalOperationalCtx,
        publicUrlLocation,
        publicURL: function (path) { return publicUrlLocation + path },
        provision: function () {
            const wsTunnel = d.esTunnel({
                constructEventSource: (esURL) => {
                    const es = new EventSource(esURL);
                    es.addEventListener("server-resource-impact", (event) => {
                        // see core/design-system/universal/client-cargo/script/typical.js
                        // event.data is a JSON string of type "impact" which should match something like
                        // "{ nature: "fs-resource-modified", fsAbsPathAndFileNameImpacted: "/abs/file/name.ext" }"
                        // where nature indicates the kind of impact and everything else is associated with nature
                        clientLayout.onServerResourceImpact(JSON.parse(event.data));
                    });
                    return es;
                },
            });
            wsTunnel.$status.watch((status) => {
                const badgeElem = document.getElementById("rf-universal-tunnel-state-summary-container");
                if (badgeElem) {
                    badgeElem.innerHTML = window.badgen({ status, label: "Workspace", color: status == "connected" ? "green" : "red" });
                    badgeElem.style.display = "block"; // in case it was hidden to start
                }
            });
            wsTunnel.connect({ validateURL: `${publicUrlLocation}/workspace/sse/ping`, esURL: `${publicUrlLocation}/workspace/sse/tunnel` });

            const consoleNavContainer = document.getElementById("rf-explorer-activate-container");
            if (consoleNavContainer) {
                injectRfExplorer(clientLayout, consoleNavContainer);
            }

            const footerContentElem = document.getElementById("rf-universal-footer-experimental-server-workspace");
            if (footerContentElem) {
                footerContentElem.style.display = 'block';
                const originLayout = clientLayout.originCtx.designSystem.layout;
                const { src, name, symbol } = (originLayout ?? {});
                if (src) {
                    footerContentElem.innerHTML = `<p title="${src}" class="localhost-diags">
                    Using ${clientLayout.originCtx.designSystem.identity} layout <code class="localhost-diags-layout-origin">${name}</code>
                    (<code class="localhost-diags-layout-origin">${symbol}</code>) in
                    <code class="localhost-diags-layout-origin-src">${src.split('/').reverse()[0]}</code></p>`;
                } else {
                    footerContentElem.innerHTML = `<p title="${src}" class="localhost-diags localhost-diags-warning">No layout information in <code>&lt;html data-rf-origin-design-system&gt;</code></p>`;
                }
            }

            // prepare globals if lightbox is used
            registerRfExplorerTarget(clientLayout, serverHooks);

            // in case we have a parent that cares about our layout (rfExplorer frameset needs this)
            if (window.parent && window.parent.registerRfExplorerTarget) {
                window.parent.registerRfExplorerTarget(clientLayout, serverHooks, window);
            }
        }
    };

    serverHooks.provision();
    return serverHooks;
}

export default initExperimentalServerHooks;