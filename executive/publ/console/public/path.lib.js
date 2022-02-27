// prepare the event emitter globally in case anyone else might need it
export const actuationEvtEmitterIdentity = "actuation";
EventEmitter.singletons.declare(actuationEvtEmitterIdentity);

// announce to everyone that an event emitter has been declared so they can hook into it
document.dispatchEvent(new CustomEvent(`actuation-event-emitter-declared`, {
    detail: EventEmitter.singletons.instance(actuationEvtEmitterIdentity).value()
}));

export function actuationStrategy(argsSupplier) {
    const actuationEE = EventEmitter.singletons.instance(actuationEvtEmitterIdentity).value();
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
        this.innerHTML = `<nav class="navbar navbar-expand-sm navbar-dark bg-dark fixed-top" aria-label="Navbar">
            <div class="container-fluid">
                <a class="navbar-brand" href="#">
                    <img src="./image/favicon/favicon-32x32.png" alt="" width="32" height="32">
                    rfConsole
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#contextBar-navigation-primary" aria-controls="contextBar-navigation-primary" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse justify-content-md-center" id="contextBar-navigation-primary">
                    <ul class="navbar-nav me-auto mb-2 mb-sm-0">
                        <li class="nav-item">
                            <a class="nav-link" href="./index.html">Home</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./health.html">Health</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./assurance.html">Assurance</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./observability.html">Observability</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./access-log.html">Access Log</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./diagnostics.html">Diagnostics</a>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="dropdown03" data-bs-toggle="dropdown" aria-expanded="false">Experiment</a>
                            <ul class="dropdown-menu" aria-labelledby="dropdown03">
                                <li><a class="dropdown-item" href="./experiment/uhtml.html">Experiment</a></li>
                                <li><a class="dropdown-item" href="#">Another action</a></li>
                                <li><a class="dropdown-item" href="#">Something else here</a></li>
                            </ul>
                        </li>
                    </ul>
                    <div>
                        <span id="rf-universal-tunnel-state-summary-badge"><span title="If you're seeing this report it as a tunnel bug">Tunnel Bug!</span></span>
                        <button href="#" onclick="fetch('/server/restart')" class="btn btn-secondary btn-sm">Restart pubctl.ts</button>
                    </div>
                </div>
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
                        const firstHeader = document.querySelector("header");
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

class MarkdownTransform {
    static opportunities = () => {
        return document.querySelectorAll(`[data-transform="markdown"]`);
    }

    static necessary = (potential = MarkdownTransform.opportunities()) => {
        return potential && potential.length > 0;
    };

    #config;
    #markdownIt; // valid only after init(), the Markdown-it instance

    constructor(argsSupplier) {
        this.#config = flexibleArgs(argsSupplier, {
            defaultArgs: {
                hookableDomElemsAttrName: "markdown-render-args-supplier",
                hookableDomElems: [document.documentElement, document.head],
                transformElements: () => {
                    return MarkdownTransform.opportunities();
                },
            },
        });
    }

    get config() { return this.#config; }
    get args() { return this.#config.args; }
    get markdownIt() { return this.#markdownIt; }

    async transform(mdElems = this.args.transformElements()) {
        const { default: markdownIt } = await import("https://jspm.dev/markdown-it@12.2.0");
        const { default: markdownItFootnote } = await import("https://jspm.dev/markdown-it-footnote@3.0.3");
        // import { default as markdownItReplaceLink } from "https://jspm.dev/markdown-it-replace-link@1.1.0";
        // import { default as markdownItAnchor } from "https://jspm.dev/markdown-it-anchor@8.3.0";
        // import { default as markdownItTitle } from "https://jspm.dev/markdown-it-title@4.0.0";
        // import { default as markdownItDirective } from "https://jspm.dev/markdown-it-directive@1.0.1";
        // import { default as markdownItDirectiveWC } from "https://jspm.dev/markdown-it-directive-webcomponents@1.2.0";
        // import { default as markdownItHashtag } from "https://jspm.dev/markdown-it-hashtag@0.4.0";
        // import { default as markdownItTaskCheckbox } from "https://jspm.dev/markdown-it-task-checkbox";

        function getHeadingLevel(tagName) {
            if (tagName[0].toLowerCase() === 'h') {
                tagName = tagName.slice(1);
            }

            return parseInt(tagName, 10);
        }

        function adjustHeadingLevel(md, options) {
            const firstLevel = options.firstLevel;

            if (typeof firstLevel === 'string') {
                firstLevel = getHeadingLevel(firstLevel);
            }

            if (!firstLevel || isNaN(firstLevel)) {
                return;
            }

            const levelOffset = firstLevel - 1;
            if (levelOffset < 1 || levelOffset > 6) {
                return;
            }

            md.core.ruler.push("adjust-heading-levels", function (state) {
                const tokens = state.tokens
                for (let i = 0; i < tokens.length; i++) {
                    if (tokens[i].type !== "heading_close") {
                        continue
                    }

                    const headingOpen = tokens[i - 2];
                    // var heading_content = tokens[i - 1];
                    const headingClose = tokens[i];

                    // we could go deeper with <div role="heading" aria-level="7">
                    // see http://w3c.github.io/aria/aria/aria.html#aria-level
                    // but clamping to a depth of 6 should suffice for now
                    const currentLevel = getHeadingLevel(headingOpen.tag);
                    const tagName = 'h' + Math.min(currentLevel + levelOffset, 6);

                    headingOpen.tag = tagName;
                    headingClose.tag = tagName;
                }
            });
        }

        this.#markdownIt = markdownIt({
            html: true,
            linkify: true,
            typographer: true,
        });
        this.#markdownIt.use(markdownItFootnote);
        this.#markdownIt.use(adjustHeadingLevel, { firstLevel: 2 });

        if (mdElems && mdElems.length > 0) {
            for (const mde of mdElems) {
                const markdown = unindentTextWhitespace(mde.innerText);
                const formatted = document.createElement("div");
                formatted.innerHTML = this.#markdownIt.render(markdown);
                formatted.dataset.contentTransformedFrom = "markdown";
                mde.replaceWith(formatted);

                // const codeBlocks = document.querySelectorAll("code.hljs");
                // for (const cb of codeBlocks) {
                //     cb.className += " shadow p-3 mb-5 bg-light.bg-gradient rounded";
                // }
            }
        }

        // if you change the version of highlight.js, also update the CSS in path.actuate.css
        // https://highlightjs.org/
        const { default: hljs } = await import("https://jspm.dev/highlight.js@11.4.0");
        hljs.highlightAll();

        // encourage chaining
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
                markdownTranformer: MarkdownTransform.necessary() ? new MarkdownTransform() : undefined,
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

        this.defineFavIconLink("apple-touch-icon", "./image/favicon/apple-touch-icon.png", "180x180");
        this.defineFavIconLink("icon", "./image/favicon/favicon-32x32.png", "32x32", "image/png");
        this.defineFavIconLink("icon", "./image/favicon/favicon-16x16.png", "16x16", "image/png");
        this.defineFavIconLink("manifest", "./image/favicon/site.webmanifest");

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

        if (this.args.markdownTranformer) {
            this.args.markdownTranformer.transform();
        }
    }

    #renderBodyContextBar() {
        // the "context bar" is our masthead and top-level navigation
        document.body.insertBefore(this.customElements.contextBarCE.construct(), document.body.firstChild);
    }

    #styleSemanticElems() {
        // our philosophy is to not have styling in *.html semantic tags so let's style them now;
        [
            ["main", (elem) => elem.className += " container"],
            ["main article", (elem) => elem.className += " bg-light p-5 rounded-lg"],
            ["main article header", (elem) => elem.className += " h1"],
            ["main article section header", (elems) => elems.forEach(e => e.className += " h2"), true],
            ["main article section section header", (elems) => elems.forEach(e => e.className += " h2"), true],
        ].forEach(directive => {
            const [query, handler, multiple] = directive;
            const selected = multiple ? document.querySelectorAll(query) : document.querySelector(query);
            if (selected) handler(selected);
        });
    }

    #renderBodyTail() {
        const bootstrapBundleJS = document.createElement('script');
        bootstrapBundleJS.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js";
        document.body.appendChild(bootstrapBundleJS);
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
                    const parse = fileSysStyleRouteParser();
                    const parsed = parse(source);
                    return {
                        unit: parsed.name,
                        label: humanizeText(parsed.name),
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
        for (const nl of document.querySelectorAll("#contextBar-navigation-primary ul.navbar-nav li.nav-item a.nav-link")) {
            if (nl.href == window.location) {
                nl.className += " active";
                nl.setAttribute("aria-current", "page");
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

    // actuationEE instance is expected in actuatorCtx as a property
    constructor(actuatorCtx) {
        this.#config = flexibleArgs(actuatorCtx, {
            hookableDomElemsAttrName: "executive-hook-args-supplier",
            hookableDomElems: [document.documentElement, document.head],
            diagnose: (result) => { console.log('Executive.config', result) },
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

    #initTunnels(ctx) {
        const tunnels = new Tunnels((defaults) => ({ ...defaults, baseURL: '/console' })).init();
        this.#consoleTunnel = tunnels.registerEventSourceState(new EventSourceTunnelState(tunnels, (defaults) => ({
            ...defaults,
            identity: () => "Console SSE",
        })));
        this.#consoleTunnel.addEventSourceEventListener("ping", (evt) => { }, { diagnose: true });
        this.#consoleTunnel.addEventSourceEventListener("location.reload-console", (evt) => {
            location.reload();
        });
        this.#consoleTunnel.addEventSourceEventListener("window.open", (evt) => {
            const payload = JSON.parse(evt.data);
            if (payload && "url" in payload) {
                const windowInstance = window.open(payload.url, payload.target);
                // TODO: how do we track the windows we opened, across page reloads?
                //windowsOpened[payload.target] = { ...payload, windowInstance }
                windowInstance.focus();
            } else {
                console.error(`invalid payload for window.open, expected { url: string; target?: string}: ${evt.data}`);
            }
        });
    }

    #init(ctx) {
        const executiveArgs = this.args;

        this.#initTunnels(ctx);
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

