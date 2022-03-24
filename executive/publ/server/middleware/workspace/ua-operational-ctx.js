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

// TODO[essential]: currently this is very SLDS-specific but should really be generalized
// and placed as a DesignSystem layout strategy so that it can be supported across DSs
function toggleInspectorPanel(resourceID, inspectorPanelID) {
    const inspectorPanelElem = document.getElementById(inspectorPanelID)
    if (inspectorPanelElem) {
        // we've already injected it so just hide/show
        lightningToggleIsOpen(inspectorPanelElem)
    } else {
        // we haven't injected it yet so we need to mutate the DOM
        const inspectorPanelHTML = `<div id="${inspectorPanelID}" class="slds-panel slds-size_large slds-panel_docked slds-panel_docked-right slds-panel_drawer slds-is-open" aria-hidden="false">
            <div class="slds-panel__header">
            <h2 class="slds-panel__header-title slds-text-heading_small slds-truncate" title="rfInspector">
                <a href="/workspace/inspect/resource.html?resource=${resourceID}">rfInspector</a> (${d.editableFileRefHTML(resourceID, 25)})
            </h2>
            <div class="slds-panel__header-actions">
                <button class="slds-button slds-button_icon slds-button_icon-small slds-panel__close" title="Collapse rfInspector" onclick="window.toggleResFactoryInspectorPanel('${resourceID}', '${inspectorPanelID}')">
                <svg class="slds-button__icon" aria-hidden="true">
                    <use xlink:href="/lightning/image/slds-icons/utility-sprite/svg/symbols.svg#close"></use>
                </svg>
                <span class="slds-assistive-text">Collapse rfInspector</span>
                </button>
            </div>
            </div>
            <div id="${inspectorPanelID}Body" class="slds-panel__body">
                <iframe src="/workspace/inspect/resource.html?resource=${resourceID}" width="100%" height="${document.body.scrollHeight - 200}" frameBorder="0"></iframe>
            </div>
        </div>`;

        // typically the body thinks it's "alone" on the page so we:
        // 1. Create a new "body-container" element that will own the existing body and the new inspector
        // 2. Move all existing body elements into a new "body-prime" element
        // 3. Create the new inspector panel

        const bodyInspectorContainer = document.createElement("div");
        bodyInspectorContainer.style.position = "relative";
        bodyInspectorContainer.style.display = "flex";
        bodyInspectorContainer.flexDirection = "";

        // move everything in the body into an inspector-adjacent node
        const bodyPrime = document.createElement("div");
        bodyPrime.classList.toggle('slds-col');
        // slds-p-around_medium
        while (document.body.childNodes.length > 0) {
            bodyPrime.appendChild(document.body.childNodes[0]);
        }
        bodyInspectorContainer.appendChild(bodyPrime);

        const inspectionPanel = document.createElement("div");
        bodyInspectorContainer.appendChild(inspectionPanel);
        inspectionPanel.outerHTML = inspectorPanelHTML;

        document.body.appendChild(bodyInspectorContainer);
    }
    //inspectResource(inspectorPanelID);
}

// since we're in a module, we want this available publicly
window.toggleResFactoryInspectorPanel = toggleInspectorPanel;

// TODO[essential]: currently this is very SLDS-specific but should really be generalized
// and placed as a DesignSystem layout strategy so that it can be supported across DSs
function injectInspectionPanel(clientLayout, consoleNavContainerElem) {
    const inspectorPanelID = 'rfInspectorPanel';

    // TODO[essential] /lightning/image/slds-icons should not be harcoded, use operationalCtx variable
    const inspectorActivateHTML = `<button id="${inspectorPanelID}Activate" class="slds-button slds-button_icon slds-is-selected slds-button_icon-border-filled slds-button_icon-border" title="Toggle panel" aria-expanded="true" aria-controls="example-unique-id-10" aria-pressed="true" onclick="window.toggleResFactoryInspectorPanel('${clientLayout.route?.terminal?.fileSysPath}', '${inspectorPanelID}')">
        <svg class="slds-button__icon" aria-hidden="true">
            <use xlink:href="/lightning/image/slds-icons/utility-sprite/svg/symbols.svg#toggle_panel_right"></use>
        </svg>
        <span class="slds-assistive-text">Provide description of action</span>
    </button>`

    const inspectorActivate = document.createElement("button");
    consoleNavContainerElem.appendChild(inspectorActivate);
    inspectorActivate.outerHTML = inspectorActivateHTML;
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
                const link = document.createElement('link');
                link.href = "https://cdn.jsdelivr.net/gh/mcstudios/glightbox@master/dist/css/glightbox.css";
                link.rel = "stylesheet";
                document.head.appendChild(link);

                const gLightboxClassName = 'glightbox4';
                consoleNavContainer.innerHTML = `<button id="consoleButton" class="slds-button slds-button_brand">
                    <a href="/console/" class="${gLightboxClassName}" data-glightbox="width: ${window.innerWidth - 100}px; height: ${window.innerHeight - 100}px;">Console</a>
                </button>`;
                consoleNavContainer.style.display = "block"; // in case it was hidden to start
                GLightbox({ selector: '.' + gLightboxClassName });
                injectInspectionPanel(clientLayout, consoleNavContainer);
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
        }
    };

    serverHooks.provision();
    return serverHooks;
}

export default initExperimentalServerHooks;