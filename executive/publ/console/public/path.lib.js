"use strict";

import {
    humanFriendlyPhrase,
    flexibleArgs,
    detectFileSysStyleRoute,
    EventEmitter,
    transformMarkdownElems,
    badgenBlock,
    typicalConnectionValidator,
    ServiceBus,
    serviceBusArguments,
    EventSourceTunnel,
    eventSourceConnNarrative,
    pingService,
    serverFileImpactService,
    userAgentOpenWindowService
} from "./deps.auto.js";

// this is commonly used outside of this script so let's make it available
export { EventEmitter, ServiceBus };

// prepare the event emitter globally in case anyone else might need it
window.actuationEvtEmitter = new EventEmitter();

// announce to everyone that an event emitter has been declared so they can hook into it
document.dispatchEvent(new CustomEvent(`actuation-event-emitter-available`, {
    detail: window.actuationEvtEmitter
}));

export function actuationStrategy(argsSupplier) {
    const actuationEE = window.actuationEvtEmitter;
    const config = flexibleArgs(argsSupplier, {
        defaultArgs: {
            actuate: (ctx) => new Executive({ actuationEE, ...ctx }).init(),
            actuationEE,
            announce: (eventID = "actuation-strategy-configured") => {
                document.dispatchEvent(new CustomEvent(eventID, { detail: config }))
            },
            hookableDomElemsAttrName: "actuation-args-supplier",
            hookableDomElems: [document.documentElement, document.head],
        }
    });
    if (config.args.announce) config.args.announce();
    return config;
}

function handleMetaData(filter, handle) {
    for (const meta of document.getElementsByTagName('meta')) {
        const identity = meta.getAttribute('name');
        if (filter(identity, meta)) {
            handle(meta.getAttribute('content'), identity, meta);
        }
    }
}

class ContextBarComponent extends HTMLElement {
    constructor() {
        // Always call super() first, this is required by the spec.
        super();
    }

    connectedCallback() {
        // references: https://getbootstrap.com/docs/5.1/examples/navbars/
        //             https://getbootstrap.com/docs/5.1/examples/headers/
        this.innerHTML = `<nav id="sidebar" class="active" aria-label="Navbar">
            <div class="sidebar-wrapper active">
                <div class="sidebar-header">
                    <div class="d-flex justify-content-between">
                        <div class="logo">
                            <!-- "console-prime" prime is also specified in console/mod.ts openWindow event -->
                            <a href="/" target="console-prime"><img src="/console/image/favicon/favicon-32x32.png" alt="Logo" srcset=""> rfConsole</a>
                        </div>
                        <div class="toggler">
                            <a href="#" class="sidebar-hide d-xl-none d-block"><i class="bi bi-x bi-middle"></i></a>
                        </div>
                    </div>
                </div>
                <div class="sidebar-menu">
                    <p id="rf-universal-tunnel-state-summary-badge" class="text-center"><span title="If you're seeing this report it as a tunnel bug">Tunnel Bug!</span></p>
                    <ul class="menu">
                        <li class="sidebar-item">
                            <a href="/console/" class='sidebar-link'>
                                <i class="bi bi-grid-fill"></i>
                                <span>Home</span>
                            </a>
                        </li>

                        <li class="sidebar-title">Publication</li>

                        <li class="sidebar-item  has-sub">
                            <a href="#" class='sidebar-link'>
                                <i class="bi bi-stack"></i>
                                <span>Components</span>
                            </a>
                            <ul class="submenu ">
                                <li class="submenu-item ">
                                    <a href="component-alert.html">Alert</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-badge.html">Badge</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-breadcrumb.html">Breadcrumb</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-button.html">Button</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-card.html">Card</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-carousel.html">Carousel</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-dropdown.html">Dropdown</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-list-group.html">List Group</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-modal.html">Modal</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-navs.html">Navs</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-pagination.html">Pagination</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-progress.html">Progress</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-spinner.html">Spinner</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="component-tooltip.html">Tooltip</a>
                                </li>
                            </ul>
                        </li>

                        <li class="sidebar-item  has-sub">
                            <a href="#" class='sidebar-link'>
                                <i class="bi bi-collection-fill"></i>
                                <span>Extra Components</span>
                            </a>
                            <ul class="submenu ">
                                <li class="submenu-item ">
                                    <a href="extra-component-avatar.html">Avatar</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="extra-component-sweetalert.html">Sweet Alert</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="extra-component-toastify.html">Toastify</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="extra-component-rating.html">Rating</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="extra-component-divider.html">Divider</a>
                                </li>
                            </ul>
                        </li>

                        <li class="sidebar-item  has-sub">
                            <a href="#" class='sidebar-link'>
                                <i class="bi bi-grid-1x2-fill"></i>
                                <span>Layouts</span>
                            </a>
                            <ul class="submenu ">
                                <li class="submenu-item ">
                                    <a href="layout-default.html">Default Layout</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="layout-vertical-1-column.html">1 Column</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="layout-vertical-navbar.html">Vertical Navbar</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="layout-rtl.html">RTL Layout</a>
                                </li>
                                <li class="submenu-item ">
                                    <a href="layout-horizontal.html">Horizontal Menu</a>
                                </li>
                            </ul>
                        </li>

                        <li class="sidebar-title">Observability</li>

                        <li class="sidebar-item">
                            <a href="/console/health.html" class='sidebar-link'>
                                <i class="bi bi-activity"></i>
                                <span>Health</span>
                            </a>
                        </li>

                        <li class="sidebar-item">
                            <a href="/console/observability.html" class='sidebar-link'>
                                <i class="bi bi-bar-chart-steps"></i>
                                <span>Assets Analytics</span>
                            </a>
                        </li>

                        <li class="sidebar-item">
                            <a href="/console/access-log.html" class='sidebar-link'>
                                <i class="bi bi-grid-1x2-fill"></i>
                                <span>Access Log</span>
                            </a>
                        </li>

                        <li class="sidebar-item">
                            <a href="/console/assurance/" class='sidebar-link'>
                                <i class="bi bi-file-earmark-medical-fill"></i>
                                <span>Unit Tests</span>
                            </a>
                        </li>

                        <li class="sidebar-title">pubctl.ts Controller</li>

                        <li class="sidebar-item">
                            <a onclick="fetch('/server/restart')" href="#" class='sidebar-link'>
                                <i class="bi bi-life-preserver"></i>
                                <span>Restart pubctl.ts</span>
                            </a>
                        </li>

                        <li class="sidebar-item">
                            <a href="/console/diagnostics.html" class='sidebar-link'>
                                <i class="bi bi-puzzle"></i>
                                <span>Diagnostics</span>
                            </a>
                        </li>
                    </ul>
                </div>
                <button class="sidebar-toggler btn x"><i data-feather="x"></i></button>
            </div>
        </nav>`;
    }
}

class ContentSuppliers {
    #config;

    constructor(argsSupplier) {
        this.#config = flexibleArgs(argsSupplier, {
            defaultArgs: {
                hookableDomElemsAttrName: "content-suppliers-args-supplier",
                hookableDomElems: [document.documentElement, document.head],
                pageTitle: () => {
                    if (!document.title || document.title == defaultPageTitle) {
                        const firstHeader = document.querySelector("header h1");
                        return firstHeader ? firstHeader.innerText : document.title;
                    } else {
                        return document.title;
                    }
                },
            }
        });
    }

    get config() { return this.#config; }
    get args() { return this.#config.args; }
    get pageTitle() { return this.args.pageTitle; }

    init() {
        return this;
    }
}

class CustomElements {
    #config;
    #registry;

    constructor(argsSupplier) {
        this.#config = flexibleArgs(argsSupplier, {
            defaultArgs: {
                customElementIdentity: (tagName) => `site-${tagName}`,
                hookableDomElemsAttrName: "custom-elements-args-supplier",
                hookableDomElems: [document.documentElement, document.head],
            }
        });

        this.contextBarCE = {
            identity: this.#config.args.customElementIdentity('context-bar', this),
            construct: () => document.createElement(this.contextBarCE.identity),
            renderer: ContextBarComponent
        };
        this.#registry = [this.contextBarCE];
    }

    get config() { return this.#config; }
    get args() { return this.#config.args; }
    get registry() { return this.#registry; }

    init() {
        for (const ce of this.#registry) {
            customElements.define(ce.identity, ce.renderer);
        }

        return this;
    }
}

class PageLayouts {
    #config;

    constructor(argsSupplier) {
        this.#config = flexibleArgs(argsSupplier, {
            defaultArgs: {
                layoutIdentity: {
                    supplier: () => document.body.dataset.layout ?? "auto", // () => string
                    renderInvalid: (identity) => this.renderWarning(`Body attribute data-layout="${identity}" is invalid. Available: ${this.args.layoutIdentity.available.join(', ')}`),
                    available: ['auto', 'typical']
                },
                mutateURL: () => {
                    // TODO: use HTML5 history API to change titles, URLs for "pretty URLs"
                    // this doesn't quite work yet:
                    // history.pushState("object or string representing the state of the page", "new title", "newURL");
                },
                mutatePageTitle: (titleSupplier) => {
                    const title = typeof titleSupplier === "function" ? titleSupplier() : titleSupplier;
                    if (title) document.title = title;
                },
                customElements: new CustomElements(),
                contentSuppliers: new ContentSuppliers(),
            },
            hookableDomElemsAttrName: "page-layouts-args-supplier",
            hookableDomElems: [document.documentElement, document.head],
        });
    }

    get config() { return this.#config; }
    get args() { return this.#config.args; }
    get customElements() { return this.args.customElements; }
    get contentSuppliers() { return this.args.contentSuppliers; }
    get layoutIdentity() { return this.args.layoutIdentity.supplier(); }

    init() {
        this.args.customElements.init(this);
        this.args.contentSuppliers.init(this);
        return this;
    }

    defineFavIconLink(rel, href, sizes, type) {
        const link = document.createElement('link');
        link.href = href;
        link.rel = rel;
        if (sizes) link.sizes = sizes;
        if (type) link.type = type;
        document.head.appendChild(link);
        return link;
    }

    renderHead(identity = this.layoutIdentity) {
        let meta = document.createElement('meta');
        meta.name = "layout";
        meta.content = identity;
        document.head.appendChild(meta);

        // used by layouts for responsive CSS
        meta = document.createElement('meta');
        meta.name = "viewport";
        meta.content = "width=device-width, initial-scale=1";
        document.head.appendChild(meta);

        const scriptJS = document.createElement('script');
        scriptJS.src = "https://cdnjs.cloudflare.com/ajax/libs/script.js/2.5.9/script.min.js";
        document.head.appendChild(scriptJS);

        const link = document.createElement('link');
        link.href = "https://fonts.gstatic.com";
        link.rel = "preconnect";
        document.head.appendChild(link);

        this.defineFavIconLink("apple-touch-icon", "/console/image/favicon/apple-touch-icon.png", "180x180");
        this.defineFavIconLink("icon", "/console/image/favicon/favicon-32x32.png", "32x32", "image/png");
        this.defineFavIconLink("icon", "/console/image/favicon/favicon-16x16.png", "16x16", "image/png");
        this.defineFavIconLink("manifest", "/console/image/favicon/site.webmanifest");

        this.args.mutatePageTitle?.(this.args.contentSuppliers.pageTitle);
    }

    renderBody(identity = this.layoutIdentity) {
        const layout = { identity }
        switch (identity) {
            case "auto":
            case "typical":
                this.#renderBodyContextBar(layout);
                this.#styleSemanticElems(layout);
                this.#renderBodyTail(layout);
                break;

            default:
                this.args.layoutIdentity.renderInvalid(layout);
        }

        transformMarkdownElems()
    }

    #renderBodyContextBar() {
        // the "context bar" is our masthead and top-level navigation
        document.body.insertBefore(this.customElements.contextBarCE.construct(), document.body.firstChild);
    }

    #styleSemanticElems() {
        // our philosophy is to not have styling in *.html semantic tags so let's style them now;
        [
            ["main", (elem) => { if (!elem.id) elem.id = "main" }], // TODDO: remove mazer requirement for elem.id = "main", use semantic
            // ["main article", (elem) => elem.className += " bg-light p-5 rounded-lg"],
            // ["main article header", (elem) => elem.className += " h1"],
            // ["main article section header", (elems) => elems.forEach(e => e.className += " h2"), true],
            // ["main article section section header", (elems) => elems.forEach(e => e.className += " h2"), true],
        ].forEach(directive => {
            const [query, handler, multiple] = directive;
            const selected = multiple ? document.querySelectorAll(query) : document.querySelector(query);
            if (selected) handler(selected);
        });
    }

    #renderBodyTail() {
        [
            "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js",
            "https://cdn.jsdelivr.net/npm/perfect-scrollbar@1.5.5/dist/perfect-scrollbar.min.js",
            "/console/vendor/mazer/mazer.js"
        ].forEach(src => {
            const js = document.createElement('script');
            js.src = src;
            document.body.appendChild(js);
        });
    }

    renderWarning(diagnostics) {
        const bodyHead = document.createElement("div");
        bodyHead.className = "alert alert-warning";
        bodyHead.innerHTML = diagnostics;
        document.body.insertBefore(bodyHead, document.body.firstChild);
    }
}

class PageState {
    #config;
    #routeUnit;

    constructor(argsSupplier) {
        this.#config = flexibleArgs(argsSupplier, {
            defaultArgs: {
                activeUnitSupplier: (source = window.location.pathname) => {
                    const parsed = detectFileSysStyleRoute(source);
                    return {
                        unit: parsed.name,
                        label: humanFriendlyPhrase(parsed.name),
                        source: parsed,
                    }
                },
                routeUnitSupplier: (suggested) => {
                    let result = suggested;
                    handleMetaData((identity) => identity == "navigation.route.unit", (content) => {
                        result = JSON.parse(content);
                    });
                    return result;
                },
            }
        });
    }

    get config() { return this.#config; }
    get args() { return this.#config.args; }
    get routeUnit() { return this.#routeUnit ?? this.args.routeUnitSupplier(this.args.activeUnitSupplier()); }

    init() {
        console.log(`PageState.init`, this.routeUnit);
        // allow optional chaining
        return this;
    }

    mutateStateContent() {
        for (const nl of document.querySelectorAll("#sidebar ul.menu li.sidebar-item a.sidebar-link")) {
            if (nl.href == window.location) {
                nl.parentElement.className += " active";
                nl.parentElement.setAttribute("aria-current", "page");
            }
        }
    }
}

class SiteNavigation {
    #config;

    constructor(argsSupplier) {
        this.#config = flexibleArgs(argsSupplier, {
            defaultArgs: {
                // required arguments for SiteNavigation
                baseURL: () => window.location.origin, // (forURL: string, SiteNavigation) => string
                // optional arguments for SiteNavigation
                route: undefined, // (suggested: string, forURL: string, SiteNavigation) => string,
            }
        });
    }

    get config() { return this.#config; }
    get args() { return this.#config.args; }

    init() {
        // allow optional chaining
        return this;
    }

    /**
     * Ascertain the path of the active page.
     * @returns path of the current page
     */
    activePath() {
        const loc = window.location.pathname;
        return loc.substring(0, loc.lastIndexOf('/'));
    }

    baseURL(forURL) {
        return this.args.baseURL(forURL, navigation);
    }

    navigate(url) {
        window.location.href = this.route(url);
    }

    route(url) {
        const baseURL = this.baseURL(url, this);
        if (baseURL.endsWith("/")) {
            baseURL = baseURL.substring(0, baseURL.length - 1);
        }
        const suggested = `${baseURL}${url}`;
        return this.args.route ? this.args.route(suggested, url, this) : suggested;
    }
}

class Executive {
    static BEFORE_INIT_EVENT_NAME = 'actuation.executive-before-init';
    static AFTER_INIT_EVENT_NAME = 'actuation.executive-after-init';

    // these are valid after constructor() has completed.
    #config;
    #initialized = false;

    // these are only valid after init() has been completed.
    #navigation;
    #layouts;
    #state;
    #consoleTunnel;
    #serviceBus;

    // actuationEE instance is expected in actuatorCtx as a property
    constructor(actuatorCtx) {
        this.#config = flexibleArgs(actuatorCtx, {
            hookableDomElemsAttrName: "executive-hook-args-supplier",
            hookableDomElems: [document.documentElement, document.head],
            defaultArgs: {
                onBeforeInit: (ctx, executive) => {
                    const event = { ctx, executive };
                    [document].forEach((elem) => {
                        elem.dispatchEvent(new CustomEvent(Executive.BEFORE_INIT_EVENT_NAME, {
                            detail: event
                        }))
                    });
                    this.actuationEE.emit(Executive.BEFORE_INIT_EVENT_NAME, event);
                },
                onAfterInit: (ctx, executive) => {
                    const event = { ctx, executive };
                    [document].forEach((elem) => {
                        elem.dispatchEvent(new CustomEvent(Executive.AFTER_INIT_EVENT_NAME, {
                            detail: event
                        }))
                    });
                    this.actuationEE.emit(Executive.AFTER_INIT_EVENT_NAME, event);
                },
                state: { construct: () => new PageState() },
                layouts: { construct: () => new PageLayouts() },
                navigation: { construct: () => new SiteNavigation() },
                diagnostics: {
                    universal: {
                        verbose: true,
                        report: function () {
                            console.info("%c[Executive]%c", "color:#D3D3D3", "color:#999999", ...arguments);
                        }
                    },
                    serviceBus: {
                        verbose: false,
                        report: function () {
                            console.info("%c[Executive serviceBus]%c", "color:#D3D3D3", "color:#999999", ...arguments);
                        }
                    },
                    consoleTunnel: {
                        verbose: true,
                        report: function () {
                            console.info("%c[Executive consoleTunnel]%c", "color:#D3D3D3", "color:#777777", ...arguments);
                        }
                    },
                },
            }
        });
    }

    get config() { return this.#config; }
    get args() { return this.#config.args; }
    get initialized() { return this.#initialized; }
    get layouts() { return this.#layouts; }
    get state() { return this.#state; }
    get navigation() { return this.#navigation; }
    get actuationEE() { return this.#config.args.actuationEE; }
    get consoleTunnel() { return this.#consoleTunnel; }

    #beforeInit(ctx) {
        this.args.onBeforeInit?.(ctx, this);
    }

    #afterInit(ctx) {
        this.args.onAfterInit?.(ctx, this);
    }

    #initServiceBus(ctx) {
        const consoleTunnelStateBadge = badgenBlock();
        consoleTunnelStateBadge.prepareRenderTarget(() => document.getElementById("rf-universal-tunnel-state-summary-badge"), "render-rf-universal-tunnel-state-summary-badge-content");

        const { diagnostics } = this.args;
        const reportServiceBusDiags = diagnostics.serviceBus.report;
        const reportConsoleTunnelDiags = diagnostics.consoleTunnel.report;

        const baseURL = "/console";
        let consoleTunnel = undefined; // we cannot access this.#consoleTunnel in function* below so we stash here
        this.#serviceBus = new ServiceBus(serviceBusArguments({
            fetchBaseURL: `${baseURL}/user-agent-bus`,
            esTunnels: function* (serviceBusOnMessage) {
                const esURL = `${baseURL}/sse/tunnel`;
                const esEndpointValidator = typicalConnectionValidator(`${baseURL}/sse/ping`);
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
                consoleTunnel = new EventSourceTunnel({
                    esURL, esEndpointValidator, eventSourceFactory, options: {
                        onConnStateChange: (active, previous, tunnel) => {
                            const escn = eventSourceConnNarrative(tunnel);
                            if (diagnostics.consoleTunnel.verbose) reportConsoleTunnelDiags("connection state", escn.summary, escn.summaryHint, active, previous);
                            consoleTunnelStateBadge.render({ content: { label: "Tunnel", status: escn.summary, title: escn.summaryHint, color: escn.color }, autoDisplay: true });
                        },
                        onReconnStateChange: (active, previous, reconnStrategy, tunnel) => {
                            const escn = eventSourceConnNarrative(tunnel, reconnStrategy);
                            if (diagnostics.consoleTunnel.verbose) reportConsoleTunnelDiags("reconnection state", active, previous, escn.summary, escn.summaryHint);
                            consoleTunnelStateBadge.render({ content: { label: "Tunnel", status: escn.summary, title: escn.summaryHint, color: escn.color }, autoDisplay: true });
                        },
                    }
                });
                consoleTunnel.init();
                yield consoleTunnel;
            }
        }));
        this.#consoleTunnel = consoleTunnel;
        if (diagnostics.serviceBus.verbose) {
            // observe modality-specific payloads
            this.#serviceBus.observeFetchEvent((payload, reqInit) => reportServiceBusDiags("observed universal fetch", payload, reqInit));
            this.#serviceBus.observeFetchEventResponse((respPayload, fetchPayload) => reportServiceBusDiags("observed universal fetchResponse", fetchPayload, respPayload));
            this.#serviceBus.observeFetchEventError((error, reqInit, fetchPayload) => reportServiceBusDiags("observed universal fetchRespError", error, reqInit, fetchPayload));
            this.#serviceBus.observeEventSource((esPayload) => reportServiceBusDiags("observed universal EventSource", esPayload));
            this.#serviceBus.observeEventSourceError((esPayload) => reportServiceBusDiags("observed universal EventSource error", esPayload));
            this.#serviceBus.observeWebSocketSendEvent((esPayload) => reportServiceBusDiags("observed universal WebSocket send", esPayload));
            this.#serviceBus.observeWebSocketReceiveEvent((esPayload) => reportServiceBusDiags("observed universal WebSocket receive", esPayload));
            this.#serviceBus.observeWebSocketErrorEvent((esPayload) => reportServiceBusDiags("observed universal WebSocket error", esPayload));

            // observe modality-independent payloads
            this.#serviceBus.observeUnsolicitedPayload((esPayload) => reportServiceBusDiags("observed universal unsolicited payload from SSE or WS", esPayload));
            this.#serviceBus.observeSolicitedPayload((esPayload) => reportServiceBusDiags("observed universal solicited payload from fetch or WS(TODO) ", esPayload));
            this.#serviceBus.observeReceivedPayload((esPayload) => reportServiceBusDiags("observed universal receive payload from fetch, SSE, or WS", esPayload));
        }

        const ping = pingService((baseURL) => baseURL);
        if (diagnostics.serviceBus.verbose) ping.observeReceivedPayload(this.#serviceBus, (payload) => reportServiceBusDiags("observed ping (RPC/WS/SSE)", payload));

        const sfImpact = serverFileImpactService((baseURL) => baseURL);
        this.#serviceBus.observeReceivedPayload((payload) => {
            if (diagnostics.serviceBus.verbose) reportServiceBusDiags("observed file impact (RPC/WS/SSE)", payload);
            location.reload();
        }, sfImpact);

        const uaOpenWindow = userAgentOpenWindowService((baseURL) => baseURL);
        this.#serviceBus.observeReceivedPayload((payload) => {
            if (diagnostics.serviceBus.verbose) reportServiceBusDiags("observed open window SSE (RPC/WS/SSE)", payload);
            if (payload && "location" in payload) {
                const uaOpenWindowStorageKey = "userAgentOpenWindowService";
                const uaOpenWindowState = sessionStorage.getItem(uaOpenWindowStorageKey);
                if (!uaOpenWindowState) {
                    const windowInstance = window.open(payload.location, payload.target);
                    sessionStorage.setItem(uaOpenWindowStorageKey, JSON.stringify(payload));
                    windowInstance.focus();
                    windowInstance.onunload = function () {
                        // TODO: figure out why this isn't working -- every time window opens, it's being refreshed by something?
                        // sessionStorage.removeItem(uaOpenWindowStorageKey);
                    };
                } else {
                    diagnostics.universal.report(`sessionStorage ${uaOpenWindowStorageKey} exists, not opening`, payload);
                }
            } else {
                console.error(`invalid payload for window.open, expected { location: string; target?: string}: ${evt.data}`);
            }
        }, uaOpenWindow);
    }

    #init(ctx) {
        const executiveArgs = this.args;

        this.#initServiceBus(ctx);
        this.#navigation = executiveArgs.navigation.construct().init();
        this.#layouts = executiveArgs.layouts.construct().init({ navigation: this.#navigation });
        this.#state = executiveArgs.state.construct().init({ navigation: this.#navigation, layouts: this.#layouts });

        // we have everything we need now, mutate the <head> elems so that others can depend on it
        this.#layouts.renderHead();

        // After the document loads, set all our classes dynamically based on
        // layout requested
        document.addEventListener('DOMContentLoaded', () => {
            this.#layouts.renderBody();
            this.#state.mutateStateContent();

            // in case we used <html style="display:none"> to prevent flash of unstyled content (FOUC), turn on display
            document.getElementsByTagName("html")[0].style.display = "block";
        });

        // allow chaining
        return this;
    }

    // public init is separate from private #init to allow easier subclassing
    init(ctx) {
        this.#beforeInit(ctx);
        this.#init(ctx);
        this.#afterInit(ctx);

        // allow chaining
        return this;
    }
}

