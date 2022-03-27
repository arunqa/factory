// this file is symlink'd by executive/publ/controller.ts:
//
// from executive/publ/server/middleware/workspace/ua-operational-ctx.js   (canonical)
//   to public/operational-context/server.auto.mjs                          (reference)
//
// It's imported as a module by all pages when they run in Console mode by
// pubctl.ts; it is run only by the browser, not at build time by Deno. If
// you make changes, you can easily just hit browser refresh to reload.
//
// It's best to edit this file from public/operational-context/server.auto.mjs
// rather than from executive/publ/server/middleware/workspace/ua-operational-ctx.js
// because the deps are imported relative to public/operational-context/server.auto.mjs.

// initExperimentalServerHooks should be called from a rfUniversalLayout.init() context

// d namespace contains Typescript-bundled dependencies
import * as d from "./deps.auto.js";

// https://github.com/biati-digital/glightbox is used for embedded Console
// TODO[essential]: don't use @master, use @3.2.x specific
//                  using @master now because of this bug: https://github.com/biati-digital/glightbox/pull/319
import 'https://cdn.jsdelivr.net/gh/mcstudios/glightbox@master/dist/js/glightbox.min.js';

// these are window-scoped so that child frames (e.g. Lightbox) can access;
// the same exact variable names are created by RF frameset explorer.
function registerInspectionTarget(clientLayout, serverHooks) {
    window.inspectableClientLayout = clientLayout;
    window.inspectServerHooks = serverHooks;
}

function injectRfExplorer(clientLayout, consoleNavContainerElem) {
    const link = document.createElement('link');
    link.href = "https://cdn.jsdelivr.net/gh/mcstudios/glightbox@master/dist/css/glightbox.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const isInFrame = window == window.top ? false : true;
    const activePath = clientLayout.navigation.location(clientLayout.route?.terminal);
    const gLightboxClassName = 'glightbox4';
    const inspectorActivateHTML = `
    <button class="slds-button">
        ${isInFrame
            ? `<a href="${activePath}" target="_top">Close rfExplorer</a>`
            : `<a href="/workspace${activePath == '/' ? '/' : `/index.html${activePath}`}?orientation=east&size=25">
                    <svg class="slds-button__icon" aria-hidden="true">
                        <use xlink:href="/lightning/image/slds-icons/utility-sprite/svg/symbols.svg#toggle_panel_right"></use>
                    </svg> rfExplorer
                </a>`}
    </button>
    <button class="slds-button">
        <a href="/workspace/db/" class="${gLightboxClassName}" data-glightbox="width: ${window.innerWidth - 100}px; height: ${window.innerHeight - 100}px;">
            <svg class="slds-button__icon" aria-hidden="true">
                <use xlink:href="/lightning/image/slds-icons/utility-sprite/svg/symbols.svg#new_window"></use>
            </svg>
        </a>
    </button>`

    consoleNavContainerElem.innerHTML = inspectorActivateHTML;
    consoleNavContainerElem.style.display = "block"; // in case it was hidden

    GLightbox({ selector: '.' + gLightboxClassName });
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

            const consoleNavContainer = document.getElementById("rf-console-nav-container");
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
            registerInspectionTarget(clientLayout, serverHooks);

            // in case we have a parent that cares about our layout (rfExplorer frameset needs this)
            if (window.parent && window.parent.registerInspectionTarget) {
                window.parent.registerInspectionTarget(clientLayout, serverHooks, window);
            }
        }
    };

    serverHooks.provision();
    return serverHooks;
}

export default initExperimentalServerHooks;