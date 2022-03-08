// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const jsTokenEvalRE = /^[a-zA-Z0-9_]+$/;
function jsTokenEvalResult(identity, discover, isTokenValid, onInvalidToken, onFailedDiscovery) {
    let result;
    if (identity.match(jsTokenEvalRE)) {
        try {
            if (Array.isArray(discover)) {
                for (const te of discover){
                    result = te(identity);
                    if (result) break;
                }
            } else {
                result = discover(identity);
            }
            if (result && isTokenValid) result = isTokenValid(result, identity);
        } catch (error) {
            result = onFailedDiscovery?.(error, identity);
        }
    } else {
        result = onInvalidToken?.(identity);
    }
    return result;
}
const jsTokenEvalResults = {};
function cacheableJsTokenEvalResult(name1, discover = eval, onInvalidToken, onFailedDiscovery) {
    if (name1 in jsTokenEvalResults) return jsTokenEvalResults[name1];
    return jsTokenEvalResult(name1, discover, (value, name)=>{
        jsTokenEvalResults[name] = value;
        return value;
    }, onInvalidToken, onFailedDiscovery);
}
function* walkHooks(targets, hookNameSuppliers, discover, prepareWalkEntry) {
    const suppliers = Array.isArray(hookNameSuppliers) ? hookNameSuppliers : [
        hookNameSuppliers
    ];
    for (const target of targets){
        for (const hookNameSupplier of suppliers){
            const hookName = hookNameSupplier(target);
            if (hookName) {
                const hookDiscovered = jsTokenEvalResult(hookName, discover, (value)=>value
                , (name)=>{
                    console.log(`[discoverDomElemHook] '${name}' is not a token in current scope for`, target);
                    return undefined;
                });
                let hookExecArgs = {
                    target,
                    hookDiscovered,
                    hookName,
                    hookNameSupplier
                };
                if (prepareWalkEntry) {
                    const prepared = prepareWalkEntry(hookExecArgs);
                    if (!prepared) continue;
                    hookExecArgs = prepared;
                }
                const hookExecResult = hookDiscovered && typeof hookDiscovered === "function" ? hookDiscovered(hookExecArgs) : undefined;
                yield hookExecResult ?? hookExecArgs;
            }
        }
    }
}
function flexibleArgs(argsSupplier, rulesSupplier) {
    const rules = rulesSupplier ? typeof rulesSupplier === "function" ? rulesSupplier(argsSupplier) : rulesSupplier : undefined;
    const defaultArgsSupplier = rules?.defaultArgs ?? {};
    const defaultArgs = typeof defaultArgsSupplier === "function" ? defaultArgsSupplier(argsSupplier, rules) : defaultArgsSupplier;
    let args = typeof argsSupplier === "function" ? argsSupplier(defaultArgs, rules) : argsSupplier ? {
        ...defaultArgs,
        ...argsSupplier
    } : defaultArgs;
    if (rules?.argsGuard) {
        if (!rules?.argsGuard.guard(args)) {
            args = rules.argsGuard.onFailure(args, rules);
        }
    }
    let result = {
        args,
        rules
    };
    if (rules?.finalizeResult) {
        result = rules.finalizeResult(result);
    }
    return result;
}
function governedArgs(argsSupplier, rulesSupplier) {
    const result = flexibleArgs(argsSupplier, rulesSupplier);
    return result;
}
export { jsTokenEvalResult as jsTokenEvalResult };
export { cacheableJsTokenEvalResult as cacheableJsTokenEvalResult };
export { walkHooks as walkHooks };
export { flexibleArgs as flexibleArgs };
export { governedArgs as governedArgs };
var ReconnectionState;
(function(ReconnectionState1) {
    ReconnectionState1["UNKNOWN"] = "unknown";
    ReconnectionState1["WAITING"] = "waiting";
    ReconnectionState1["TRYING"] = "trying";
    ReconnectionState1["COMPLETED"] = "completed";
    ReconnectionState1["ABORTED"] = "aborted";
})(ReconnectionState || (ReconnectionState = {}));
class ReconnectionStrategy {
    connect;
    maxAttempts;
    intervalMillecs;
    onStateChange;
    #state = ReconnectionState.UNKNOWN;
    #attempt = 0;
    #interval;
    constructor(connect, options){
        this.connect = connect;
        this.maxAttempts = options?.maxAttempts ?? 15;
        this.intervalMillecs = options?.intervalMillecs ?? 1000;
        this.onStateChange = options?.onStateChange;
    }
    get attempt() {
        return this.#attempt;
    }
    get state() {
        return this.#state;
    }
    set state(value) {
        const previousStatus = this.#state;
        this.#state = value;
        this.onStateChange?.(this.#state, previousStatus, this);
    }
    reconnect() {
        this.state = ReconnectionState.WAITING;
        this.#interval = setInterval(()=>{
            this.#attempt++;
            if (this.#attempt > this.maxAttempts) {
                this.completed(ReconnectionState.ABORTED);
            } else {
                this.state = ReconnectionState.TRYING;
                this.connect(this);
            }
        }, this.intervalMillecs);
        return this;
    }
    completed(status = ReconnectionState.COMPLETED) {
        this.state = status;
        if (this.#interval) {
            clearInterval(this.#interval);
            this.#interval = undefined;
        }
        return this;
    }
}
function typeGuard(...requireKeysInSingleT) {
    return (o)=>{
        if (o && typeof o === "object") {
            return !requireKeysInSingleT.find((p)=>!(p in o)
            );
        }
        return false;
    };
}
const isEventSourceConnectionHealthy = typeGuard("isHealthy", "connEstablishedOn");
const isEventSourceConnectionUnhealthy = typeGuard("isHealthy", "connFailedOn");
const isEventSourceReconnecting = typeGuard("isHealthy", "connFailedOn", "reconnectStrategy");
const isEventSourceError = typeGuard("isEventSourceError", "errorEvent");
const isEventSourceEndpointUnavailable = typeGuard("isEndpointUnavailable", "endpointURL");
class EventSourceTunnel {
    esURL;
    esPingURL;
    observerUniversalScopeID = "universal";
    eventSourceFactory;
    onConnStateChange;
    onReconnStateChange;
    #connectionState = {
        isConnectionState: true
    };
    constructor(init){
        this.esURL = init.esURL;
        this.esPingURL = init.esPingURL;
        this.eventSourceFactory = init.eventSourceFactory;
        this.onConnStateChange = init.options?.onConnStateChange;
        this.onReconnStateChange = init.options?.onReconnStateChange;
    }
    init(reconnector1) {
        fetch(this.esPingURL, {
            method: "HEAD"
        }).then((resp)=>{
            if (resp.ok) {
                const eventSource = this.eventSourceFactory.construct(this.esURL);
                const coercedES = eventSource;
                coercedES.onopen = ()=>{
                    const connState = {
                        isConnectionState: true,
                        isHealthy: true,
                        connEstablishedOn: new Date(),
                        endpointURL: this.esURL,
                        pingURL: this.esPingURL
                    };
                    this.connectionState = connState;
                    if (reconnector1) reconnector1.completed();
                    this.eventSourceFactory.connected?.(eventSource);
                };
                coercedES.onerror = (event)=>{
                    coercedES.close();
                    const connState = {
                        isConnectionState: true,
                        isHealthy: false,
                        connFailedOn: new Date(),
                        isEventSourceError: true,
                        errorEvent: event,
                        reconnectStrategy: new ReconnectionStrategy((reconnector)=>{
                            this.init(reconnector);
                        }, {
                            onStateChange: this.onReconnStateChange ? (active, previous, rs)=>{
                                this.onReconnStateChange?.(active, previous, rs, this);
                            } : undefined
                        }).reconnect()
                    };
                    this.connectionState = connState;
                };
            } else {
                const connState = {
                    isConnectionState: true,
                    isHealthy: false,
                    connFailedOn: new Date(),
                    isEndpointUnavailable: true,
                    endpointURL: this.esURL,
                    pingURL: this.esPingURL,
                    httpStatus: resp.status,
                    httpStatusText: resp.statusText
                };
                this.connectionState = connState;
            }
        }).catch((connectionError)=>{
            const connState = {
                isConnectionState: true,
                isHealthy: false,
                connFailedOn: new Date(),
                pingURL: this.esPingURL,
                connectionError,
                isEndpointUnavailable: true,
                endpointURL: this.esPingURL
            };
            this.connectionState = connState;
        });
        return this;
    }
    get connectionState() {
        return this.#connectionState;
    }
    set connectionState(value) {
        const previousConnState = this.#connectionState;
        this.#connectionState = value;
        this.onConnStateChange?.(this.#connectionState, previousConnState, this);
    }
}
function eventSourceConnNarrative(tunnel, reconn) {
    const sseState = tunnel.connectionState;
    if (!reconn && isEventSourceReconnecting(sseState)) {
        reconn = sseState.reconnectStrategy;
    }
    let reconnected = false;
    if (reconn) {
        switch(reconn.state){
            case ReconnectionState.WAITING:
            case ReconnectionState.TRYING:
                return {
                    summary: `reconnecting ${reconn.attempt}/${reconn.maxAttempts}`,
                    color: "orange",
                    isHealthy: false,
                    summaryHint: `Trying to reconnect to ${tunnel.esURL}, reconnecting every ${reconn.intervalMillecs} milliseconds`
                };
            case ReconnectionState.ABORTED:
                return {
                    summary: `failed`,
                    color: "red",
                    isHealthy: false,
                    summaryHint: `Unable to reconnect to ${tunnel.esURL} after ${reconn.maxAttempts} attempts, giving up`
                };
            case ReconnectionState.COMPLETED:
                reconnected = true;
                break;
        }
    }
    if (isEventSourceConnectionHealthy(sseState)) {
        return {
            summary: reconnected ? "reconnected" : "connected",
            color: "green",
            isHealthy: true,
            summaryHint: `Connection to ${sseState.endpointURL} verified using ${sseState.pingURL} on ${sseState.connEstablishedOn}`
        };
    }
    let summary = "unknown";
    let color = "purple";
    let summaryHint = `the tunnel is not healthy, but not sure why`;
    if (isEventSourceConnectionUnhealthy(sseState)) {
        if (isEventSourceEndpointUnavailable(sseState)) {
            summary = "unavailable";
            summaryHint = `${sseState.endpointURL} not available`;
            if (sseState.httpStatus) {
                summary = `unavailable (${sseState.httpStatus})`;
                summaryHint += ` (HTTP status: ${sseState.httpStatus}, ${sseState.httpStatusText})`;
                color = "red";
            }
        } else {
            if (isEventSourceError(sseState)) {
                summary = "error";
                summaryHint = JSON.stringify(sseState.errorEvent);
                color = "red";
            }
        }
    }
    return {
        isHealthy: false,
        summary,
        summaryHint,
        color
    };
}
export { isEventSourceConnectionHealthy as isEventSourceConnectionHealthy };
export { isEventSourceConnectionUnhealthy as isEventSourceConnectionUnhealthy };
export { isEventSourceReconnecting as isEventSourceReconnecting };
export { isEventSourceError as isEventSourceError };
export { isEventSourceEndpointUnavailable as isEventSourceEndpointUnavailable };
export { EventSourceTunnel as EventSourceTunnel };
export { eventSourceConnNarrative as eventSourceConnNarrative };
const isIdentifiablePayload = typeGuard("payloadIdentity");
function serviceBusArguments(options) {
    const universalScopeID = "universal";
    return {
        eventNameStrategy: {
            universalScopeID,
            fetch: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `fetch-${identity}`;
                const universalName = `fetch`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            fetchResponse: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `fetch-response-${identity}`;
                const universalName = `fetch-response`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            fetchError: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `fetch-error-${identity}`;
                const universalName = `fetch-error`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            eventSource: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `event-source-${identity}`;
                const universalName = `event-source`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            eventSourceError: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `event-source-error-${identity}`;
                const universalName = `event-source-error`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            eventSourceInvalidPayload: ()=>{
                const universalName = `event-source-invalid-payload`;
                return {
                    payloadSpecificName: undefined,
                    universalName,
                    selectedName: universalName
                };
            }
        },
        ...options
    };
}
class ServiceBus extends EventTarget {
    args;
    tunnels = [];
    eventListenersLog = [];
    constructor(args){
        super();
        this.args = args;
        if (args.esTunnels) this.registerEventSourceTunnels(args.esTunnels);
    }
    registerEventSourceTunnels(ests) {
        for (const tunnel of ests((event)=>{
            const eventSrcPayload = JSON.parse(event.data);
            const esDetail = {
                eventSrcPayload
            };
            this.dispatchNamingStrategyEvent(eventSrcPayload, isIdentifiablePayload(eventSrcPayload) ? this.args.eventNameStrategy.eventSource : this.args.eventNameStrategy.eventSourceInvalidPayload, esDetail);
        })){
            this.tunnels.push(tunnel);
        }
    }
    dispatchNamingStrategyEvent(id, strategy, detail) {
        const names = strategy(id);
        if (names.payloadSpecificName) {
            this.dispatchEvent(new CustomEvent(names.payloadSpecificName, {
                detail
            }));
        }
        this.dispatchEvent(new CustomEvent(names.universalName, {
            detail
        }));
    }
    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
        this.eventListenersLog.push({
            name: type,
            hook: listener
        });
    }
    fetch(uase, suggestedCtx) {
        const transactionID = "TODO:UUIDv5?";
        const clientProvenance = "ServiceBus.fetch";
        const ctx = {
            ...suggestedCtx,
            transactionID,
            clientProvenance
        };
        const fetchPayload = uase.prepareFetchPayload(ctx, this);
        const fetchInit = uase.prepareFetch(this.args.fetchBaseURL, fetchPayload, ctx, this);
        const fetchDetail = {
            ...fetchInit,
            fetchPayload,
            context: ctx,
            fetchStrategy: this
        };
        this.dispatchNamingStrategyEvent(fetchPayload, this.args.eventNameStrategy.fetch, fetchDetail);
        fetch(fetchInit.endpoint, fetchInit.requestInit).then((resp)=>{
            if (resp.ok) {
                resp.json().then((fetchRespRawJSON)=>{
                    const fetchRespPayload = uase.prepareFetchResponsePayload(fetchPayload, fetchRespRawJSON, ctx, this);
                    const fetchRespDetail = {
                        fetchPayload,
                        fetchRespPayload,
                        context: ctx,
                        fetchStrategy: this
                    };
                    this.dispatchNamingStrategyEvent(fetchPayload, this.args.eventNameStrategy.fetchResponse, fetchRespDetail);
                });
            } else {
                const fetchErrorDetail = {
                    ...fetchInit,
                    fetchPayload,
                    context: ctx,
                    error: new Error(`${fetchInit.endpoint} invalid HTTP status ${resp.status} (${resp.statusText})`),
                    fetchStrategy: this
                };
                this.dispatchNamingStrategyEvent(fetchPayload, this.args.eventNameStrategy.fetchError, fetchErrorDetail);
            }
        }).catch((error)=>{
            const fetchErrorDetail = {
                ...fetchInit,
                fetchPayload,
                context: ctx,
                error,
                fetchStrategy: this
            };
            this.dispatchNamingStrategyEvent(fetchPayload, this.args.eventNameStrategy.fetchError, fetchErrorDetail);
            console.error(`${fetchInit.endpoint} POST error`, error, fetchInit);
        });
    }
    observeFetchEvent(observer, fetchPayloadID) {
        const names = this.args.eventNameStrategy.fetch(fetchPayloadID ?? this.args.eventNameStrategy.universalScopeID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , requestInit , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(fetchPayload, requestInit, context, fetchStrategy);
        });
    }
    observeFetchEventResponse(observer, fetchRespPayloadID) {
        const names = this.args.eventNameStrategy.fetchResponse(fetchRespPayloadID ?? this.args.eventNameStrategy.universalScopeID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , fetchRespPayload , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(fetchRespPayload, fetchPayload, context, fetchStrategy);
        });
    }
    observeFetchEventError(observer, fetchPayloadID) {
        const names = this.args.eventNameStrategy.fetchError(fetchPayloadID ?? this.args.eventNameStrategy.universalScopeID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , error , requestInit , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(error, requestInit, fetchPayload, context, fetchStrategy);
        });
    }
    observeEventSource(observer, payloadID) {
        const names = this.args.eventNameStrategy.eventSource(payloadID ?? this.args.eventNameStrategy.universalScopeID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { eventSrcPayload  } = typedCustomEvent.detail;
            observer(eventSrcPayload, this);
        });
    }
    observeEventSourceError(observer, payloadID) {
        const names = this.args.eventNameStrategy.eventSourceError(payloadID ?? this.args.eventNameStrategy.universalScopeID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { eventSrcPayload , error  } = typedCustomEvent.detail;
            observer(error, eventSrcPayload, this);
        });
    }
}
export { serviceBusArguments as serviceBusArguments };
export { ServiceBus as ServiceBus };
const pingPayloadIdentity = "ping";
function isPingPayload(o) {
    if (isIdentifiablePayload(o)) {
        if (o.payloadIdentity == pingPayloadIdentity) {
            return true;
        }
    }
    return false;
}
function pingPayload() {
    return {
        payloadIdentity: pingPayloadIdentity
    };
}
function pingService(endpointSupplier) {
    const proxy = {
        fetch: (fetchStrategy, ctx)=>{
            fetchStrategy.fetch(proxy, ctx);
        },
        prepareContext: (ctx)=>ctx
        ,
        prepareFetchPayload: (ctx)=>{
            return {
                payloadIdentity: pingPayloadIdentity,
                ...ctx
            };
        },
        prepareFetchResponsePayload: (fetchPayload, fetchRespRawJSON)=>{
            return {
                payloadIdentity: fetchPayload.payloadIdentity,
                fetchPayload,
                fetchRespRawJSON
            };
        },
        isEventSourcePayload: (_rawJSON)=>{
            return true;
        },
        prepareEventSourcePayload: (rawJSON)=>{
            return rawJSON;
        },
        prepareFetch: (baseURL, payload)=>{
            return {
                endpoint: endpointSupplier(baseURL),
                requestInit: {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            };
        },
        observeFetch: (fetchStrategy, observer)=>{
            fetchStrategy.observeFetchEvent(observer, pingPayloadIdentity);
        },
        observeFetchResponse: (fetchStrategy, observer)=>{
            fetchStrategy.observeFetchEventResponse(observer, pingPayloadIdentity);
        },
        observeFetchRespError: (fetchStrategy, observer)=>{
            fetchStrategy.observeFetchEventError(observer, pingPayloadIdentity);
        },
        observeEventSource: (eventSrcStrategy, observer)=>{
            eventSrcStrategy.observeEventSource((payload, ess)=>{
                observer(proxy.prepareEventSourcePayload(payload), ess);
            }, pingPayloadIdentity);
        },
        observeEventSourceError: (eventSrcStrategy, observer)=>{
            eventSrcStrategy.observeEventSourceError(observer, pingPayloadIdentity);
        }
    };
    return proxy;
}
export { pingPayloadIdentity as pingPayloadIdentity };
export { isPingPayload as isPingPayload };
export { pingPayload as pingPayload };
export { pingService as pingService };
function binaryStateService(endpointSupplier, identitySupplier, stateSupplier) {
    const proxy = {
        fetch: (fetchStrategy, ctx)=>{
            fetchStrategy.fetch(proxy, ctx);
        },
        prepareContext: (ctx)=>ctx
        ,
        prepareFetchPayload: (ctx)=>{
            return {
                payloadIdentity: identitySupplier(),
                state: stateSupplier(),
                ...ctx
            };
        },
        prepareFetchResponsePayload: (fetchPayload, fetchRespRawJSON)=>{
            return {
                payloadIdentity: fetchPayload.payloadIdentity,
                fetchPayload,
                fetchRespRawJSON
            };
        },
        isEventSourcePayload: (_rawJSON)=>{
            return true;
        },
        prepareEventSourcePayload: (rawJSON)=>{
            return rawJSON;
        },
        prepareFetch: (baseURL, payload)=>{
            return {
                endpoint: endpointSupplier(baseURL),
                requestInit: {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            };
        },
        observeFetch: (fetchStrategy, observer)=>{
            fetchStrategy.observeFetchEvent(observer, identitySupplier());
        },
        observeFetchResponse: (fetchStrategy, observer)=>{
            fetchStrategy.observeFetchEventResponse(observer, identitySupplier());
        },
        observeFetchRespError: (fetchStrategy, observer)=>{
            fetchStrategy.observeFetchEventError(observer, identitySupplier());
        },
        observeEventSource: (eventSrcStrategy, observer)=>{
            eventSrcStrategy.observeEventSource(observer, identitySupplier());
        },
        observeEventSourceError: (eventSrcStrategy, observer)=>{
            eventSrcStrategy.observeEventSourceError(observer, identitySupplier());
        }
    };
    return proxy;
}
export { binaryStateService as binaryStateService };
function esmModuleSupplier() {
    return {
        import: async (dependency, actuate)=>{
            const module = await import(dependency);
            return actuate ? actuate(module) : module;
        }
    };
}
function badgenBlock(init = {}) {
    const { remoteBaseURL ="https://badgen.net/badge" , moduleSupplier =esmModuleSupplier() , tryBadgenLib =true ,  } = init;
    const state = {
        isBadgenLibLoadAttempted: false,
        isBadgenLibLoaded: false
    };
    const block = {
        moduleSupplier,
        remoteBaseURL,
        autoHTML: (content)=>{
            if (state.isBadgenLibLoaded) {
                if (window.badgen) {
                    return block.decorateHTML(window.badgen(content), content);
                }
                console.warn(`[badgenBlock] isBadgenLibLoaded is true but window.badgen not found, resorting to ${remoteBaseURL}`);
            }
            return block.remoteImageURL(content);
        },
        init: async ()=>{
            if (tryBadgenLib && !state.isBadgenLibLoadAttempted) {
                await moduleSupplier.import("https://unpkg.com/badgen", async ()=>{
                    state.isBadgenLibLoaded = true;
                });
                state.isBadgenLibLoadAttempted = true;
            }
            return block;
        },
        remoteURL: (content)=>`${block.remoteBaseURL}/${content.label}/${content.status}/${content.color}`
        ,
        remoteImageURL: (content)=>block.decorateHTML(`<img src="${block.remoteURL(content)}">`, content)
        ,
        decorateHTML: (html, content)=>{
            if (content.title) {
                html = `<span title="${content.title}">${html}</span>`;
            }
            if (content.action) {
                html = `<a onclick="${content.action}">${html}</a>`;
            }
            return html;
        },
        isUsingRemote: ()=>state.isBadgenLibLoaded && window.badgen ? false : true
    };
    return block;
}
function badgenLiveBlock(lbInit) {
    const { badgenBlockSupplier , badgeElementSupplier , renderBadgeEventSupplier , init ,  } = lbInit;
    let badgenBlock1 = undefined;
    const { eventTarget , eventName  } = renderBadgeEventSupplier(lbInit);
    eventTarget.addEventListener(eventName, (event)=>{
        const { badgeElement , content , display  } = event.detail;
        if (badgenBlock1) {
            badgeElement.innerHTML = badgenBlock1.autoHTML(content);
        } else {}
        if (display) block.display(display);
    });
    let content1 = {
        status: "Unspecified"
    };
    const block = {
        init: async ()=>{
            badgenBlock1 = await badgenBlockSupplier(lbInit);
            return init ? await init?.(block) : block;
        },
        content: (set, display)=>{
            if (set) {
                content1 = set;
                if (eventTarget) {
                    const badgeElement = badgeElementSupplier(lbInit);
                    if (badgeElement) {
                        eventTarget.dispatchEvent(new CustomEvent(eventName, {
                            detail: {
                                badgeElement,
                                content: content1,
                                display
                            }
                        }));
                    }
                } else {
                    console.warn(`[badgenLiveBlock] content could not be updated: badgeElement was not found.`);
                }
            }
            return content1;
        },
        display: (state)=>{
            const badgeElement = badgeElementSupplier(lbInit);
            if (badgeElement) {
                badgeElement.style.display = state ? "block" : "none";
            } else {
                console.warn(`[badgenLiveBlock] content could not be display'd: badgeElement was not found.`);
            }
        }
    };
    return block;
}
export { esmModuleSupplier as esmModuleSupplier };
export { badgenBlock as badgenBlock };
export { badgenLiveBlock as badgenLiveBlock };
