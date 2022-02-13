/**
 * After initialization pageLayout will be an instance of Executive class.
 * Usually a global scope is a code smell but we haven't figured out how to
 * pass the layout instance into HTML5 Custom Elements (CE) framework. Once
 * we have a solution to pass pageLayout into CEs then remove the global.
 */
export let executive = undefined;

class BodyHeadComponent extends HTMLElement {
    constructor() {
        // Always call super() first, this is required by the spec.
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <title>Resource Factory Console</title>
            <site-navigation></site-navigation>
        `;
    }
}

class BodyTailComponent extends HTMLElement {
    constructor() {
        // Always call super() first, this is required by the spec.
        super();
    }

    connectedCallback() {
        executive.bodyAft();
        this.innerHTML = `<!-- executed bodyAft() -->`;
    }
}

class NavigationComponent extends HTMLElement {
    constructor() {
        // Always call super() first, this is required by the spec.
        super();
    }

    connectedCallback() {
        this.innerHTML = `<nav class="navbar navbar-dark bg-dark">
            <div class="container">
                <a class="navbar-brand" href="#">
                    <img src="./image/favicon/favicon-32x32.png" alt="" width="32" height="32">
                    rfConsole
                </a>
                <span class="navbar-text" id="socket-commands-mgr-state-prose">
                </span>
            </div>
        </nav>`
    }
}

class PageState {
    constructor(executive, argsSupplier, optionsSupplier) {
        const defaultArgs = {
            // required arguments for PageNavigation
        };
        const defaultOptions = {
            // optional arguments for PageNavigation
        };
        this.args = argsSupplier ? argsSupplier({ ...defaultArgs }, this, executive) : defaultArgs;
        this.options = optionsSupplier ? optionsSupplier({ ...defaultOptions }, this, executive) : defaultOptions;
    }

    init() {
    }
}

class SiteNavigation {
    constructor(executive, argsSupplier, optionsSupplier) {
        const defaultArgs = {
            // required arguments for SiteNavigation
            baseURL: () => window.location.origin, // (forURL: string, SiteNavigation) => string
        };
        const defaultOptions = {
            // optional arguments for SiteNavigation
            route: undefined, // (suggested: string, forURL: string, SiteNavigation) => string,
        };
        this.args = argsSupplier ? argsSupplier({ ...defaultArgs }, this, executive) : defaultArgs;
        this.options = optionsSupplier ? optionsSupplier({ ...defaultOptions }, this, executive) : defaultOptions;
    }

    init() {
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
        return this.options.route ? this.options.route(suggested, url, this) : suggested;
    }
}

class PageLayout {
    #customElements;

    constructor(executive, argsSupplier, optionsSupplier) {
        const defaultArgs = {
            // required arguments for PageLayout
            customElementIdentity: (tagName) => `site-${tagName}`,
        };
        const defaultOptions = {
            // optional arguments for PageLayout
        };
        this.args = argsSupplier ? argsSupplier({ ...defaultArgs }, this, executive) : defaultArgs;
        this.options = optionsSupplier ? optionsSupplier({ ...defaultOptions }, this, executive) : defaultOptions;
        this.#customElements = [{
            identity: this.args.customElementIdentity('body-head', this, executive),
            renderer: BodyHeadComponent,
        }, {
            identity: this.args.customElementIdentity('navigation', this, executive),
            renderer: NavigationComponent
        }, {
            identity: this.args.customElementIdentity('body-tail', this, executive),
            renderer: BodyTailComponent,
        }];
    }

    init() {
        for (const ce of this.#customElements) {
            customElements.define(ce.identity, ce.renderer);
        }
    }
}

/**
 * Given one or more DOM elements, look for hookName attribute and, if the hookName
 * references a Javascript function return.
 * @param {HTMLElement} domElems one or more DOM elements to search
 * @param {string} hookName the name of the DOM element attribute which specifies a function reference
 * @returns the first domElem which has an attribute with name hookName that points to a function
 */
function domElemsAttrHook(domElems, hookName) {
    if (!Array.isArray(domElems)) domElems = [domElems];
    for (const elem of domElems) {
        const potentialHook = elem.getAttribute(hookName);
        try {
            if (potentialHook) {
                const hook = eval(potentialHook);
                if (typeof hook === "function") {
                    return hook;
                } else {
                    console.error(`[domElemAttrHook(${elem.tagName}, ${hookName})] ${potentialHook} is not a function`);
                }
            }
        } catch (err) {
            console.error(`[domElemAttrHook(${elem.tagName}, ${hookName})] eval error: ${err}`);
            return undefined;
        }
    }
}

class Executive {
    // these are valid after constructor() has completed.
    #hooks = {};
    #initialized = false;

    // these are only valid after init() has been completed.
    #navigation;
    #layout;
    #state;

    constructor(argsSupplier, optionsSupplier) {
        const defaultArgs = {
            // required arguments for Executive
            hooks: {
                // allows hooks like <html lang="en" executive-hook-args-supplier="executiveArgsHook" executive-hook-options-supplier="executiveOptionsHook">
                // where executiveArgsHook is the same signature as constructor.argsSupplier and executiveOptionsHook is same signature as constructor.optionsSupplier
                argsSupplier: () => domElemsAttrHook([document.documentElement, document.head], "executive-hook-args-supplier"),
                optionsSupplier: () => domElemsAttrHook([document.documentElement, document.head], "executive-hook-options-supplier"),
            }
        };
        const defaultOptions = {
            onBeforeInit: (executive) => {
                [document].forEach((elem) => {
                    elem.dispatchEvent(new CustomEvent(`executive-before-init`, {
                        detail: { executive }
                    }))
                })
            },
            onAfterInit: (executive) => {
                [document].forEach((elem) => {
                    elem.dispatchEvent(new CustomEvent(`executive-after-init`, {
                        detail: { executive }
                    }))
                })
            },
            // optional arguments for Executive
            layout: {
                argsSupplier: undefined, // (defaults, layout, executive) => ({})
                optionsSupplier: undefined, // (defaults, layout, executive) => ({})
            },
            navigation: {
                argsSupplier: undefined, // (defaults, navigation, executive) => ({})
                optionsSupplier: undefined, // (defaults, navigation, executive) => ({})
            },
            state: {
                argsSupplier: undefined, // (defaults, state, executive) => ({})
                optionsSupplier: undefined, // (defaults, state, executive) => ({})
            },
        };
        this.args = argsSupplier ? argsSupplier({ ...defaultArgs }, this) : defaultArgs;
        this.options = optionsSupplier ? optionsSupplier({ ...defaultOptions }, this) : defaultOptions;

        // If hooks like <html lang="en" executive-hook-args-supplier="executiveArgsHook" executive-hook-options-supplier="executiveOptionsHook">
        // are defined, allow them to do a final configuration of the args and options before Executive.init() will be called.
        this.#hooks.argsSupplier = this.args.hooks.argsSupplier();
        if (this.#hooks.argsSupplier) {
            this.args = this.#hooks.argsSupplier(this.args, this);
        }

        this.#hooks.optionsSupplier = this.args.hooks.optionsSupplier();
        if (this.#hooks.optionsSupplier) {
            this.options = this.#hooks.optionsSupplier(this.options, this);
        }
    }

    get initialized() { return this.#initialized; }
    get layout() { return this.#layout; }
    get state() { return this.#state; }
    get navigation() { return this.#navigation; }

    defineFavIconLink(rel, href, sizes, type) {
        const link = document.createElement('link');
        link.href = href;
        link.rel = rel;
        if (sizes) link.sizes = sizes;
        if (type) link.type = type;
        document.head.appendChild(link);
        return link;
    }

    init() {
        // Set this globally so that custom elements can have access.
        // TODO: figure out how to pass as instance to custom elements.
        executive = this;
        if (this.options.onBeforeInit) {
            this.options.onBeforeInit(this);
        }

        this.#navigation = new SiteNavigation(this, this.options.navigation.argsSupplier, this.options.navigation.optionsSupplier);
        this.#navigation.init();

        this.#state = new PageState(this, this.options.state.argsSupplier, this.options.state.optionsSupplier);
        this.#state.init();

        this.#layout = new PageLayout(this, this.options.layout.argsSupplier, this.options.layout.optionsSupplier);
        this.#layout.init();

        // used by bulma for responsive CSS
        const meta = document.createElement('meta');
        meta.name = "viewport";
        meta.content = "width=device-width, initial-scale=1";
        document.head.appendChild(meta)

        const scriptJS = document.createElement('script');
        scriptJS.src = "https://cdnjs.cloudflare.com/ajax/libs/script.js/2.5.9/script.min.js";
        document.head.appendChild(scriptJS);

        this.defineFavIconLink("apple-touch-icon", "./image/favicon/apple-touch-icon.png", "180x180");
        this.defineFavIconLink("icon", "./image/favicon/favicon-32x32.png", "32x32", "image/png");
        this.defineFavIconLink("icon", "./image/favicon/favicon-16x16.png", "16x16", "image/png");
        this.defineFavIconLink("manifest", "./image/favicon/site.webmanifest");

        this.#initialized = true;
        if (this.options.onAfterInit) {
            this.options.onAfterInit(this);
        }

        // allow chaining
        return this;
    }

    bodyAft() {
        const bootstrapBundleJS = document.createElement('script');
        bootstrapBundleJS.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js";
        document.body.appendChild(bootstrapBundleJS);
    }
}

new Executive().init();