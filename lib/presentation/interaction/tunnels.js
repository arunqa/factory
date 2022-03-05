import { governedArgs } from "../../conf/flexible-args.ts"
import { httpEndpointAvailableAction } from "../net/http-endpoint-action.js";

export class LabeledBadge {
    // valid after construction
    remoteBaseURL;
    useBadgenLib;
    importModule;
    #initialized = false;
    #isBadgenLibLoaded = false;

    // valid only after init() is called
    autoHTML; // (badgenArgs) => string -- will automatically be set based on whether we're using loadBadgenLib

    constructor(argsSupplier) {
        const { args } = governedArgs(argsSupplier, {
            defaultArgs: {
                remoteBaseURL: 'https://badgen.net/badge',
                importModule: (lib, actuate) => import(lib).then(actuate),
                useBadgenLib: true,
            },
        });

        this.remoteBaseURL = args.remoteBaseURL;
        this.useBadgenLib = args.useBadgenLib;
        this.importModule = args.importModule;
    }

    badgenArgs(args) {
        const badgenArgs = {
            // API: https://github.com/badgen/badgen#in-browser
            status: args.status || "status", // <Text>, required
            ...args
        };
        return args?.enhanceBadgen ? args.enhanceBadgen(badgenArgs) : badgenArgs;
    }

    badgenRemoteURL(badgenArgs) {
        const badge = this.badgenArgs(badgenArgs);
        return `${this.remoteBaseURL}/${badge.label}/${badge.status}/${badge.color}`;
    }

    decorateHTML(badgenArgs, html) {
        if (badgenArgs.elaborationText) {
            html = `<span title="${badgenArgs.elaborationText}">${html}</span>`;
        }
        if (badgenArgs.actionable) {
            html = `<a onclick="${badgenArgs.actionable}">${html}</a>`
        }
        return html;
    }

    badgenRemoteImageHTML(badgenArgs) {
        return this.decorateHTML(badgenArgs, `<img src="${this.badgenRemoteURL(badgenArgs)}">`);
    }

    init() {
        // we return 'this' to allow convenient method chaining
        if (this.#initialized) return this;

        // use the external badge API temporarily while the badgen script is being loaded
        // while this is the primary update(), this.#isBadgenLibLoaded should remain false
        this.autoHTML = (badgenArgs) => {
            return this.badgenRemoteImageHTML(badgenArgs);
        }

        if (this.useBadgenLib) {
            // load the badgen script so that if it's needed later it will be faster than making network calls
            this.importModule("https://unpkg.com/badgen", () => {
                this.autoHTML = (badgenArgs) => {
                    return this.decorateHTML(badgenArgs, badgen(this.badgenArgs(badgenArgs)));
                };
                // once we've loaded the library, statistics are possible (not before then)
                this.#isBadgenLibLoaded = true;
            });
        }

        this.#initialized = true;

        // we return 'this' to allow convenient method chaining
        return this;
    }

    get isBadgenLibLoaded() {
        return this.#isBadgenLibLoaded;
    }
}

export class TunnelStatePresentation {
    static defaultInitialStatus = "inactive";
    summaryBadgeDomID; // string
    elaborationHtmlDomID; // string

    constructor(argsSupplier) {
        const { args } = governedArgs(argsSupplier, {
            defaultArgs: {
                summaryBadgeDomID: "rf-universal-tunnel-state-summary-badge",
                elaborationHtmlDomID: "rf-universal-tunnel-state-elaboration",
                initialStatus: TunnelStatePresentation.defaultInitialStatus,
                labeledBadge: new LabeledBadge().init(),
                defaultLabel: "Tunnel"
            },
        });

        this.summaryBadgeDomID = args.summaryBadgeDomID;
        this.elaborationHtmlDomID = args.elaborationHtmlDomID;
        this.labeledBadge = args.labeledBadge;
        this.defaultLabel = args.defaultLabel;
    }

    badgenArgs(state, options) {
        const status = state.status;
        const label = options?.label ?? this.defaultLabel;
        const color = options?.color ?? (status == "inactive" ? 'red' : (status == "active" ? 'green' : 'orange'));
        const icon = options?.icon;
        return this.labeledBadge.badgenArgs({
            // API: https://github.com/badgen/badgen#in-browser
            label,             // <Text>
            labelColor: '555', // <Color RGB> or <Color Name> (default: '555')
            status,            // <Text>, required
            color,             // <Color RGB> or <Color Name> (default: 'blue')
            style: 'classic',  // 'flat' or 'classic' (default: 'classic')
            icon,              // Use icon (default: undefined), best to use 'data:image/svg+xml;base64,...'
            iconWidth: 13,     // Set this if icon is not square (default: 13)
            scale: 1,          // Set badge scale (default: 1)
            ...options,
        });
    }

    update(state, options) {
        const tspElem = document.getElementById(this.summaryBadgeDomID);
        if (tspElem) {
            tspElem.innerHTML = this.labeledBadge.autoHTML(this.badgenArgs(state, options));
        } else {
            console.warn(`Tunnel state could not be updated: DOM element id='${this.summaryBadgeDomID}' was not found.`);
        }
    }

    display(state = true) {
        if (this.summaryBadgeElement) {
            this.summaryBadgeElement.style.display = state ? 'block' : 'none';
        }
    }

    get summaryBadgeElement() {
        return document.getElementById(this.summaryBadgeDomID);
    }

    get elaborationHtmlElement() {
        return document.getElementById(this.elaborationHtmlDomID);
    }

    get isStatisticsPresentationPossible() {
        return this.labeledBadge.isBadgenLibLoaded;
    }
}

export class TunnelReconnectStrategy {
    static UNKNOWN = 0;
    static WAITING = 1;
    static TRYING = 2;
    static COMPLETED = 3;
    static ABORTED = 4;

    connect;     // (trs: TunnelReconnectStrategy) => void
    report;      // (trs: TunnelReconnectStrategy) => void
    maxAttempts; // number;
    #attempt;
    #interval;
    #status = TunnelReconnectStrategy.UNKNOWN;

    constructor(connect, report, maxAttempts = 15) {
        this.connect = connect;
        this.report = report;
        this.maxAttempts = maxAttempts;
        this.#attempt = 0;
    }

    get attempt() {
        return this.#attempt;
    }

    get status() {
        return this.#status;
    }

    set status(value) {
        this.#status = value;
        this.report(this);
    }

    get statusText() {
        switch (this.#status) {
            case TunnelReconnectStrategy.UNKNOWN:
                return "unknown";
            case TunnelReconnectStrategy.WAITING:
                return "waiting";
            case TunnelReconnectStrategy.TRYING:
                return `reconnecting ${this.#attempt}/${this.maxAttempts}`;
            case TunnelReconnectStrategy.COMPLETED:
                return "reconnected";
            case TunnelReconnectStrategy.ABORTED:
                return "aborted";
        }
        return "?";
    }

    reconnect() {
        this.status = TunnelReconnectStrategy.WAITING;
        this.#interval = setInterval(() => {
            this.#attempt++;
            if (this.#attempt > this.maxAttempts) {
                this.exit(TunnelReconnectStrategy.ABORTED);
            } else {
                this.status = TunnelReconnectStrategy.TRYING;
                this.connect(this);
            }
        }, 1000);
        return this; // return 'this' to encourage method chaining
    }

    exit(status = TunnelReconnectStrategy.COMPLETED) {
        this.status = status;
        if (this.#interval) {
            clearInterval(this.#interval);
            this.#interval = undefined;
        }
        return this; // return 'this' to encourage method chaining
    }
}

export class EventSourceTunnelState {
    static instanceIndex = 0;
    static defaultInitialStatus = "inactive";

    // these are valid after constructor() has completed.
    esURL;                              // string (event source URL)
    esPingURL;                          // string (event source readiness URL)
    #identity;                          // string
    #wrappedListeners = [];             // { type: string, callback: (event) => void}[]
    #eventSourceSupplier;               // () => EventSource
    #eventSource;                       // EventSource
    #status;                            // string
    #statusErrorEvent;                  // if #status is 'error', this is the error event
    #statePresentation;                 // (status, options) => void

    // these are only valid after init() has been completed.
    #messageIdentitiesEncountered = {}; // Record<string, { count: number }>

    constructor(tunnel, argsSupplier) {
        this.esURL = `${tunnel.baseURL}/sse/tunnel`;
        this.esPingURL = `${tunnel.baseURL}/sse/ping`;
        const { args } = governedArgs(argsSupplier, {
            defaultArgs: {
                eventSourceSupplier: () => new EventSource(this.esURL),
                statePresentation: () => tunnel.statePresentation,
                identity: () => {
                    EventSourceTunnelState.instanceIndex++;
                    return `EventSourceTunnelState${EventSourceTunnelState.instanceIndex}`;
                },
                initialStatus: () => EventSourceTunnelState.defaultInitialStatus,
            },
        });

        this.#eventSourceSupplier = args.eventSourceSupplier;
        this.#identity = args.identity();
        this.#status = args.initialStatus ? args.initialStatus() : EventSourceTunnelState.defaultInitialStatus;
        this.#statePresentation = args.statePresentation();
    }

    init(reconnector = undefined) {
        // if the server is available, try to connect to the EventSource SSE endpoint
        httpEndpointAvailableAction(this.esPingURL, (httpEAA) => {
            this.#eventSource = this.#eventSourceSupplier();

            this.#eventSource.onopen = (event) => {
                // this will trigger set status(value) and this.#statePresentation.update(this)
                this.status = "active";
                if (reconnector) reconnector.exit();
            }

            this.#eventSource.onclose = (event) => {
                // this will trigger set status(value) and this.#statePresentation.update(this)
                this.status = "inactive";
                if (reconnector) reconnector.exit(TunnelReconnectStrategy.ABORTED);
            }

            this.#eventSource.onerror = (event) => {
                this.#eventSource.close();
                this.#statusErrorEvent = event;
                // this will trigger set status(value) and this.#statePresentation.update(this)
                this.status = "error";
                // recursively call init() until success or aborted exit
                new TunnelReconnectStrategy((reconnector) => {
                    this.init(reconnector);
                }, (reconnector) => {
                    this.#statePresentation.update(this, {
                        enhanceBadgen: (suggested) => {
                            suggested.status = reconnector.statusText;
                            return suggested;
                        }
                    });
                }).reconnect();
            }

            // in case we're reconnecting, get the existing listeners attached to the new ES
            if (this.#wrappedListeners.length > 0) {
                this.#wrappedListeners.forEach(l => {
                    this.#eventSource.addEventListener(l.identity, l.wrappedCB);
                });
            }
        }, {
            onInvalidStatus: (event) => {
                this.#status = "tunnel-unhealthy";
                this.#statePresentation.update(this, {
                    enhanceBadgen: (suggested) => {
                        suggested.status = "unavailable";
                        suggested.elaborationText = `Ping URL ${this.esPingURL} is not available (click to hard-refresh)`;
                        suggested.elaborationHTML = `<a href="${this.esPingURL}">Ping URL</a> was not available.`;
                        suggested.actionable = () => { httpHardRefreshURL() }
                        return suggested;
                    }
                });
            }
        });

        // we return 'this' to allow convenient method chaining
        return this;
    }

    get identity() {
        return this.#identity;
    }

    get status() {
        return this.#status;
    }

    set status(value) {
        this.#status = value;
        this.#statePresentation.update(this);
    }

    get statusErrorEvent() {
        return this.#statusErrorEvent;
    }

    get statePresentation() {
        return this.#statePresentation;
    }

    addEventSourceEventListener(identity, callback, options) {
        const wrappedCB = (event) => {
            let encountered = this.#messageIdentitiesEncountered[identity];
            if (!encountered) {
                encountered = { count: 0 };
                this.#messageIdentitiesEncountered[identity] = encountered;
            }
            encountered.count++;

            const diagnose = options?.diagnose ?? false;
            if (diagnose) {
                console.info(`[TunnelState] message: ${identity}`, event, encountered);
            }
            callback(event);
        }
        // hang onto the listeners in case we need to reconnect with a new EventSource
        // or if the #eventSource is not ready yet.
        this.#wrappedListeners.push({ identity, wrappedCB, options });
        if (this.#eventSource) {
            // if the event source is available go ahead and assign the listener;
            // sometimes due to reconnection or other async requests it won't be
            // available, so the listener will be added when #eventSource becomes
            // available.
            this.#eventSource.addEventListener(identity, wrappedCB);
        }
        return this;
    }
}

export class Tunnels {
    // these are only valid after init() has been completed.
    #esTunnels = {};

    constructor(argsSupplier) {
        const { args } = governedArgs(argsSupplier, {
            defaultArgs: {
                baseURL: "/tunnel",
                statePresentation: new TunnelStatePresentation(),
            },
            hookableDomElemsAttrName: "tunnel-hook-args-supplier",
            hookableDomElems: [document.documentElement, document.head],
        });

        this.baseURL = args.baseURL;
        this.statePresentation = args.statePresentation;
    }

    init() {
        // for future extensions in case subclasses need to do special init;
        // always return 'this' to allow convenient method chaining
        return this;
    }

    registerEventSourceState(eventSourceTunnelStateArg) {
        const eventSourceTunnelState = typeof eventSourceTunnelStateArg === "function"
            ? eventSourceTunnelState(this)
            : eventSourceTunnelStateArg;
        eventSourceTunnelState.init();
        this.#esTunnels[eventSourceTunnelState.identity] = eventSourceTunnelState;
        return eventSourceTunnelState;
    }
}
