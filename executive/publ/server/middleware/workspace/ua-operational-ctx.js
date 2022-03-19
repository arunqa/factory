// this file is symlink'd by executive/publ/controller.ts:
//
// from executive/publ/server/middleware/workspace/ua-operational-ctx.js   (canonical)
//   to public/operational-context/server.auto.js                          (reference)
//
// It's imported as a module by all pages when they run in Console mode by
// pubctl.ts; it is run only by the browser, not at build time by Deno. If
// you make changes, you can easily just hit browser refresh to reload.
//
// It's best to edit this file from public/operational-context/server.auto.js
// rather than from executive/publ/console/public/server.js because the deps
// are imported relative to public/operational-context/server.auto.js.

import * as d from "./deps.auto.js";

const rfOperationalCtx = {
    isExperimentalOperationalCtx: d.rfOperationalCtxArgs.isExperimentalOperationalCtx,
    publicUrlLocation: d.rfOperationalCtxArgs.publicUrlLocation,
    serviceBus: undefined,
    publicURL: function (path) { return d.rfOperationalCtxArgs.publicUrlLocation + path },
    diagnostics: {
        universal: {
            verbose: true,
            report: function () {
                console.info("%c[rfOperationalCtx]%c", "color:#D3D3D3", "color:#999999", ...arguments);
            }
        },
        fileImpact: {
            verbose: true,
            report: function () {
                console.info("%c[rfOperationalCtx fileImpact]%c", "color:#D3D3D3", "color:#999999", ...arguments);
            }
        },
        serviceBus: {
            verbose: true,
            report: function () {
                console.info("%c[rfOperationalCtx serviceBus]%c", "color:#D3D3D3", "color:#999999", ...arguments);
            }
        },
        workspaceTunnel: {
            verbose: true,
            report: function () {
                console.info("%c[rfOperationalCtx workspaceTunnel]%c", "color:#D3D3D3", "color:#777777", ...arguments);
            }
        },
    },
    console: {
        location: function (path) { return d.rfOperationalCtxArgs.publicUrlLocation + '/console' + path },
        tunnel: {
            sseHealthURL: d.rfOperationalCtxArgs.publicUrlLocation + '/console/sse/ping',
            sseURL: d.rfOperationalCtxArgs.publicUrlLocation + '/console/sse/tunnel',
            badgenRemoteBaseURL: d.rfOperationalCtxArgs.badgenRemoteBaseURL, // from env:RF_UNIVERSAL_BADGEN_REMOTE_BASE_URL
        }
    },
    workspace: {
        baseURL: "/workspace",
        footerContentDomID: "rf-universal-footer-experimental-server-workspace",
        isHotReloadAvailable: true,
        activePageTerminalRoute: undefined, // will be set in provision()
        reloadIfImpacted: (fsAbsPathAndFileNameImpacted, ctx) => {
            // rfOperationalCtx.workspace.activePageTerminalRoute should be set in rfOperationalCtx.provision()
            // to see if the "impacted" workspace file is our current page
            const activePageFileSysPath = rfOperationalCtx.workspace.activePageTerminalRoute?.fileSysPath;
            if (activePageFileSysPath == fsAbsPathAndFileNameImpacted) {
                location.reload();
            } else {
                const diags = rfOperationalCtx.diagnostics.fileImpact;
                if (diags.verbose) {
                    diags.report("rfOperationalCtx.workspace.reloadIfImpacted() called but this page was not impacted", fsAbsPathAndFileNameImpacted, rfOperationalCtx.workspace.activePageTerminalRoute, ctx);
                }
            }
        },
        tunnel: {
            sseHealthURL: d.rfOperationalCtxArgs.publicUrlLocation + '/workspace/sse/ping',
            sseURL: d.rfOperationalCtxArgs.publicUrlLocation + '/workspace/sse/tunnel',
            badgenRemoteBaseURL: d.rfOperationalCtxArgs.badgenRemoteBaseURL, // from env:RF_UNIVERSAL_BADGEN_REMOTE_BASE_URL
        },
        provision: function (clientLayout) {
            // this method will NOT be called before DOMContentLoaded so don't assume anything
            // we're not running in a server that supports experimental workspace (IDE)
            if (!window.rfOperationalCtx.isExperimentalOperationalCtx) return;

            const { diagnostics } = rfOperationalCtx;
            const reportServiceBusDiags = diagnostics.serviceBus.report;
            const reportWorkspaceTunnelDiags = diagnostics.workspaceTunnel.report;

            const wsTunnelStateBadge = d.badgenBlock();
            wsTunnelStateBadge.prepareRenderTarget(() => document.getElementById("rf-universal-tunnel-state-summary-badge"), "render-rf-universal-tunnel-state-summary-badge-content");

            rfOperationalCtx.workspace.activePageTerminalRoute = clientLayout.route.terminal;
            if (diagnostics.universal.verbose) {
                diagnostics.universal.report("rfOperationalCtx workspace enabled for", clientLayout, rfOperationalCtx.workspace.activePageTerminalRoute);
            }

            let workspaceTunnel = undefined;
            const serviceBus = new d.ServiceBus(d.serviceBusArguments({
                fetchBaseURL: `/console/user-agent-bus`,
                esTunnels: function* (serviceBusOnMessage) {
                    const esURL = rfOperationalCtx.workspace.tunnel.sseURL;
                    const esEndpointValidator = d.typicalConnectionValidator(rfOperationalCtx.workspace.tunnel.sseHealthURL);
                    const eventSourceFactory = {
                        construct: (esURL) => {
                            // we have to prepare the entire EventSources
                            // each time we are called; this is because ESs
                            // can error out and be dropped/recreated
                            const result = new EventSource(esURL);
                            // ServiceBus only handles raw messages and does
                            // not do anything with listeners; this means
                            // typed events shouldn't be done by ES, it should
                            // be handled by ServiceBus (that's it's job!)
                            result.onmessage = serviceBusOnMessage;
                            return result;
                        }
                    };
                    workspaceTunnel = new d.EventSourceTunnel({
                        esURL, esEndpointValidator, eventSourceFactory, options: {
                            onConnStateChange: (active, previous, tunnel) => {
                                const escn = d.eventSourceConnNarrative(tunnel);
                                if (diagnostics.workspaceTunnel.verbose) reportWorkspaceTunnelDiags("[provision!] connection state", escn.summary, escn.summaryHint, active, previous);
                                wsTunnelStateBadge.render({ content: { label: "Workspace", status: escn.summary, title: escn.summaryHint, color: escn.color }, autoDisplay: true });
                            },
                            onReconnStateChange: (active, previous, reconnStrategy, tunnel) => {
                                const escn = d.eventSourceConnNarrative(tunnel, reconnStrategy);
                                if (diagnostics.workspaceTunnel.verbose) reportWorkspaceTunnelDiags("[provision!] reconnection state", active, previous, escn.summary, escn.summaryHint);
                                wsTunnelStateBadge.render({ content: { label: "Workspace", status: escn.summary, title: escn.summaryHint, color: escn.color }, autoDisplay: true });
                            },
                        }
                    });
                    workspaceTunnel.init();
                    yield workspaceTunnel;
                }
            }));
            rfOperationalCtx.serviceBus = serviceBus;
            if (diagnostics.serviceBus.verbose) {
                // observe modality-specific payloads
                serviceBus.observeFetchEvent((payload, reqInit) => reportServiceBusDiags("observed universal fetch", payload, reqInit));
                serviceBus.observeFetchEventResponse((respPayload, fetchPayload) => reportServiceBusDiags("observed universal fetchResponse", fetchPayload, respPayload));
                serviceBus.observeFetchEventError((error, reqInit, fetchPayload) => reportServiceBusDiags("observed universal fetchRespError", error, reqInit, fetchPayload));
                serviceBus.observeEventSource((esPayload) => reportServiceBusDiags("observed universal EventSource", esPayload));
                serviceBus.observeEventSourceError((esPayload) => reportServiceBusDiags("observed universal EventSource error", esPayload));
                serviceBus.observeWebSocketSendEvent((esPayload) => reportServiceBusDiags("observed universal WebSocket send", esPayload));
                serviceBus.observeWebSocketReceiveEvent((esPayload) => reportServiceBusDiags("observed universal WebSocket receive", esPayload));
                serviceBus.observeWebSocketErrorEvent((esPayload) => reportServiceBusDiags("observed universal WebSocket error", esPayload));

                // observe modality-independent payloads
                serviceBus.observeUnsolicitedPayload((esPayload) => reportServiceBusDiags("observed universal unsolicited payload from SSE or WS", esPayload));
                serviceBus.observeSolicitedPayload((esPayload) => reportServiceBusDiags("observed universal solicited payload from fetch or WS(TODO) ", esPayload));
                serviceBus.observeReceivedPayload((esPayload) => reportServiceBusDiags("observed universal receive payload from fetch, SSE, or WS", esPayload));
            }

            const ping = d.pingService((baseURL) => baseURL);
            if (diagnostics.serviceBus.verbose) serviceBus.observeReceivedPayload((payload) => reportServiceBusDiags("observed ping payload", payload), ping);
            const sfImpact = d.serverFileImpactService((baseURL) => baseURL);
            serviceBus.observeReceivedPayload((payload) => {
                if (diagnostics.serviceBus.verbose) reportServiceBusDiags("observed file impact payload", payload);
                rfOperationalCtx.workspace.reloadIfImpacted(payload.serverFsAbsPathAndFileName);
            }, sfImpact);

            const footerContentElem = document.getElementById(window.rfOperationalCtx.workspace.footerContentDomID);
            if (footerContentElem) {
                footerContentElem.style.display = 'block';
                const htmlDataSet = document.documentElement.dataset;
                if (htmlDataSet.rfOriginLayoutSrc) {
                    footerContentElem.innerHTML = `<p title="${htmlDataSet.rfOriginLayoutSrc}" class="localhost-diags">
                    Using layout <code class="localhost-diags-layout-origin">${htmlDataSet.rfOriginLayoutName}</code>
                    (<code class="localhost-diags-layout-origin">${htmlDataSet.rfOriginLayoutSymbol}</code>) in
                    <code class="localhost-diags-layout-origin-src">${htmlDataSet.rfOriginLayoutSrc.split('/').reverse()[0]}</code></p>`;
                } else {
                    footerContentElem.innerHTML = `<p title="${htmlDataSet.rfOriginLayoutSrc}" class="localhost-diags localhost-diags-warning">No layout information in <code>&lt;html data-rf-origin-layout-*&gt;</code></p>`;
                }
            }
        }
    },
}

window.addEventListener("clientLayout.provisionAfterContentLoaded", () => {
    rfOperationalCtx.workspace.provision(clientLayout);
}, false);

window.rfOperationalCtx = rfOperationalCtx;