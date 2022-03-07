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
        this.onStateChange?.(this.#state, previousStatus);
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
function eventSourceError(errorEvent) {
    return {
        isHealthy: false,
        isEventSourceError: true,
        errorEvent
    };
}
function endpointUnavailable(state) {
    return {
        isHealthy: false,
        isEventSourceEndpointUnvailable: true,
        ...state
    };
}
class EventSourceTunnel {
    esURL;
    esPingURL;
    observers = new EventTarget();
    observerUniversalScopeID = "universal";
    eventSourceFactory;
    eventSourceListeners = [];
    #connectionState;
    constructor(init){
        this.esURL = init.esURL;
        this.esPingURL = init.esPingURL;
        this.eventSourceFactory = init.eventSourceFactory;
    }
    init(reconnector1) {
        fetch(this.esPingURL, {
            method: "HEAD"
        }).then((resp)=>{
            if (resp.ok) {
                const eventSource = this.eventSourceFactory.construct(this.esURL);
                eventSource.onopen = ()=>{
                    this.connectionState = {
                        isHealthy: true
                    };
                    if (reconnector1) reconnector1.completed();
                    this.eventSourceFactory.connected?.(eventSource);
                };
                eventSource.onerror = (event)=>{
                    eventSource.close();
                    this.connectionState = eventSourceError(event);
                    new ReconnectionStrategy((reconnector)=>{
                        this.init(reconnector);
                    }, {
                        onStateChange: (active, previous)=>{
                            this.observers.dispatchEvent(new CustomEvent("reconnection-state", {
                                detail: {
                                    connState: this.connectionState,
                                    previousReconnState: previous,
                                    activeReconnState: active,
                                    esState: this
                                }
                            }));
                        }
                    }).reconnect();
                };
                this.eventSourceListeners.forEach((l)=>{
                    eventSource.addEventListener(l.identity, l.observableListener, l.options);
                });
            } else {
                this.connectionState = endpointUnavailable({
                    httpStatus: resp.status,
                    httpStatusText: resp.statusText
                });
            }
        }).catch((connectionError)=>{
            this.connectionState = endpointUnavailable({
                connectionError
            });
        });
        return this;
    }
    get connectionState() {
        return this.#connectionState;
    }
    set connectionState(value) {
        const statusEventDetail = {
            previousConnState: this.#connectionState,
            activeConnState: value,
            esState: this
        };
        this.#connectionState = value;
        this.observers.dispatchEvent(new CustomEvent("connection-state", {
            detail: statusEventDetail
        }));
    }
}
export { EventSourceTunnel as EventSourceTunnel };
function serviceBusArguments(options) {
    const universalScopeID = "universal";
    return {
        eventNameStrategy: {
            universalScopeID,
            fetch: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                return identity == universalScopeID ? `fetch` : `fetch-${identity}`;
            },
            fetchResponse: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                return identity == universalScopeID ? `fetch-response` : `fetch-response-${identity}`;
            },
            fetchError: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                return identity == universalScopeID ? `fetch-error` : `fetch-error-${identity}`;
            },
            eventSource: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                return identity == universalScopeID ? `event-source` : `event-source-${identity}`;
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
            console.log("[registerEventSourceTunnels]", "eventSrcPayload", eventSrcPayload);
            const esDetail = {
                eventSrcPayload
            };
            this.dispatchNamingStrategyEvent(eventSrcPayload, this.args.eventNameStrategy.eventSource, esDetail);
        })){
            this.tunnels.push(tunnel);
        }
    }
    dispatchNamingStrategyEvent(id, strategy, detail) {
        this.dispatchEvent(new CustomEvent(strategy(id), {
            detail
        }));
        this.dispatchEvent(new CustomEvent(strategy(this.args.eventNameStrategy.universalScopeID), {
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
        fetch(fetchInit.endpoint, fetchInit.requestInit).then((res)=>res.json()
        ).then((fetchRespRawJSON)=>{
            const fetchRespPayload = uase.prepareFetchResponsePayload(fetchPayload, fetchRespRawJSON, ctx, this);
            const fetchRespDetail = {
                fetchPayload,
                fetchRespPayload,
                context: ctx,
                fetchStrategy: this
            };
            this.dispatchNamingStrategyEvent(fetchPayload, this.args.eventNameStrategy.fetchResponse, fetchRespDetail);
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
        this.addEventListener(this.args.eventNameStrategy.fetch(fetchPayloadID ?? this.args.eventNameStrategy.universalScopeID), (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , requestInit , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(fetchPayload, requestInit, context, fetchStrategy);
        });
    }
    observeFetchEventResponse(observer, fetchRespPayloadID) {
        this.addEventListener(this.args.eventNameStrategy.fetchResponse(fetchRespPayloadID ?? this.args.eventNameStrategy.universalScopeID), (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , fetchRespPayload , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(fetchRespPayload, fetchPayload, context, fetchStrategy);
        });
    }
    observeFetchEventError(observer, fetchPayloadID) {
        this.addEventListener(this.args.eventNameStrategy.fetchError(fetchPayloadID ?? this.args.eventNameStrategy.universalScopeID), (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , error , requestInit , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(error, requestInit, fetchPayload, context, fetchStrategy);
        });
    }
    observeEventSource(observer, payloadID) {
        this.addEventListener(this.args.eventNameStrategy.eventSource(payloadID ?? this.args.eventNameStrategy.universalScopeID), (event)=>{
            const typedCustomEvent = event;
            const { eventSrcPayload  } = typedCustomEvent.detail;
            observer(eventSrcPayload, this);
        });
    }
}
function pingServerProxy(endpointSupplier) {
    const payloadIdentity = "ping";
    const proxy = {
        fetch: (fetchStrategy, ctx)=>{
            fetchStrategy.fetch(proxy, ctx);
        },
        prepareContext: (ctx)=>ctx
        ,
        prepareFetchPayload: (ctx)=>{
            return {
                payloadIdentity,
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
            fetchStrategy.observeFetchEvent(observer, payloadIdentity);
        },
        observeFetchResponse: (fetchStrategy, observer)=>{
            fetchStrategy.observeFetchEventResponse(observer, payloadIdentity);
        },
        observeFetchRespError: (fetchStrategy, observer)=>{
            fetchStrategy.observeFetchEventError(observer, payloadIdentity);
        },
        observeEventSource: (eventSrcStrategy, observer)=>{
            eventSrcStrategy.observeEventSource(observer, payloadIdentity);
        }
    };
    return proxy;
}
export { serviceBusArguments as serviceBusArguments };
export { ServiceBus as ServiceBus };
export { pingServerProxy as pingServerProxy };
function binaryStateServerProxy(endpointSupplier, identitySupplier, stateSupplier) {
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
        }
    };
    return proxy;
}
export { binaryStateServerProxy as binaryStateServerProxy };
