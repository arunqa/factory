// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class EventEmitter {
    _events_ = new Map();
    on(event, listener) {
        if (!this._events_.has(event)) this._events_.set(event, new Set());
        this._events_.get(event).add(listener);
        return this;
    }
    once(event, listener) {
        const l = listener;
        l.__once__ = true;
        return this.on(event, l);
    }
    off(event, listener) {
        if ((event === undefined || event === null) && listener) throw new Error("Why is there a listener defined here?");
        else if ((event === undefined || event === null) && !listener) this._events_.clear();
        else if (event && !listener) this._events_.delete(event);
        else if (event && listener && this._events_.has(event)) {
            const _ = this._events_.get(event);
            _.delete(listener);
            if (_.size === 0) this._events_.delete(event);
        } else ;
        return this;
    }
    emitSync(event, ...args) {
        if (!this._events_.has(event)) return this;
        const _ = this._events_.get(event);
        for (let [, listener] of _.entries()){
            const r = listener(...args);
            if (r instanceof Promise) r.catch(console.error);
            if (listener.__once__) {
                delete listener.__once__;
                _.delete(listener);
            }
        }
        if (_.size === 0) this._events_.delete(event);
        return this;
    }
    async emit(event, ...args) {
        if (!this._events_.has(event)) return this;
        const _ = this._events_.get(event);
        for (let [, listener] of _.entries()){
            try {
                await listener(...args);
                if (listener.__once__) {
                    delete listener.__once__;
                    _.delete(listener);
                }
            } catch (error) {
                console.error(error);
            }
        }
        if (_.size === 0) this._events_.delete(event);
        return this;
    }
    queue(event, ...args) {
        (async ()=>await this.emit(event, ...args)
        )().catch(console.error);
        return this;
    }
    pull(event, timeout) {
        return new Promise(async (resolve, reject)=>{
            let timeoutId;
            let listener = (...args)=>{
                if (timeoutId !== null) clearTimeout(timeoutId);
                resolve(args);
            };
            timeoutId = typeof timeout !== "number" ? null : setTimeout(()=>(this.off(event, listener), reject(new Error("Timed out!")))
            );
            this.once(event, listener);
        });
    }
    clone(cloneListeners = true) {
        const emitter = new EventEmitter();
        if (cloneListeners) {
            for (const [key, set] of this._events_)emitter._events_.set(key, new Set([
                ...set
            ]));
        }
        return emitter;
    }
}
export { EventEmitter as EventEmitter };
function humanFriendlyBytes(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }
    const units = si ? [
        "kB",
        "MB",
        "GB",
        "TB",
        "PB",
        "EB",
        "ZB",
        "YB"
    ] : [
        "KiB",
        "MiB",
        "GiB",
        "TiB",
        "PiB",
        "EiB",
        "ZiB",
        "YiB"
    ];
    let u = -1;
    const r = 10 ** dp;
    do {
        bytes /= thresh;
        ++u;
    }while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)
    return bytes.toFixed(dp) + " " + units[u];
}
function humanFriendlyPhrase(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s\s+/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, (letter)=>letter.toUpperCase()
    );
}
const humanPath = (original, maxLength = 50, formatBasename)=>{
    const tokens = original.split("/");
    const basename = tokens[tokens.length - 1];
    tokens.splice(0, 1);
    tokens.splice(tokens.length - 1, 1);
    if (original.length < maxLength) {
        return (tokens.length > 0 ? tokens.join("/") + "/" : "") + (formatBasename ? formatBasename(basename) : basename);
    }
    const remLen = maxLength - basename.length - 4;
    if (remLen > 0) {
        const path = tokens.join("/");
        const lenA = Math.ceil(remLen / 2);
        const lenB = Math.floor(remLen / 2);
        const pathA = path.substring(0, lenA);
        const pathB = path.substring(path.length - lenB);
        return pathA + "..." + pathB + "/" + (formatBasename ? formatBasename(basename) : basename);
    }
    return formatBasename ? formatBasename(basename) : basename;
};
export { humanFriendlyBytes as humanFriendlyBytes };
export { humanFriendlyPhrase as humanFriendlyPhrase };
export { humanPath as humanPath };
function minWhitespaceIndent(text) {
    const match = text.match(/^[ \t]*(?=\S)/gm);
    return match ? match.reduce((r, a)=>Math.min(r, a.length)
    , Infinity) : 0;
}
function unindentWhitespace(text, removeInitialNewLine = true) {
    const indent = minWhitespaceIndent(text);
    const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");
    const result = text.replace(regex, "");
    return removeInitialNewLine ? result.replace(/^\n/, "") : result;
}
function singleLineTrim(text) {
    return text.replace(/(\r\n|\n|\r)/gm, "").replace(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, " ").trim();
}
export { minWhitespaceIndent as minWhitespaceIndent };
export { unindentWhitespace as unindentWhitespace };
export { singleLineTrim as singleLineTrim };
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
const posixPathRE = /^((\/?)(?:[^\/]*\/)*)((\.{1,2}|[^\/]+?|)(\.[^.\/]*|))[\/]*$/;
function detectFileSysStyleRoute(text) {
    const components = posixPathRE.exec(text)?.slice(1);
    if (!components || components.length !== 5) return undefined;
    const modifiers = [];
    const parsedPath = {
        root: components[1],
        dir: components[0].slice(0, -1),
        base: components[2],
        ext: components[4],
        name: components[3],
        modifiers
    };
    const modifierIndex = parsedPath.name.lastIndexOf(".");
    if (modifierIndex > 0) {
        let ppn = parsedPath.name;
        let modifier = ppn.substring(modifierIndex);
        while(modifier && modifier.length > 0){
            modifiers.push(modifier);
            ppn = ppn.substring(0, ppn.length - modifier.length);
            const modifierIndex = ppn.lastIndexOf(".");
            modifier = modifierIndex > 0 ? ppn.substring(modifierIndex) : undefined;
        }
        parsedPath.name = ppn;
    }
    return parsedPath;
}
export { detectFileSysStyleRoute as detectFileSysStyleRoute };
function typeGuard(...requireKeysInSingleT) {
    return (o)=>{
        if (o && typeof o === "object") {
            return !requireKeysInSingleT.find((p)=>!(p in o)
            );
        }
        return false;
    };
}
const isIdentifiablePayload = typeGuard("payloadIdentity");
const ValidatedPayload = typeGuard("isValidatedPayload", "isValidPayload");
function isEventSourceService(o) {
    const isType = typeGuard("isEventSourcePayload", "prepareEventSourcePayload");
    return isType(o);
}
function isFetchService(o) {
    const isType = typeGuard("fetch", "prepareFetchContext", "prepareFetchPayload", "prepareFetch", "prepareFetchResponsePayload");
    return isType(o);
}
function isWebSocketSendService(o) {
    const isType = typeGuard("webSocketSend", "prepareWebSocketSendPayload", "prepareWebSocketSend");
    return isType(o);
}
function isWebSocketReceiveService(o) {
    const isType = typeGuard("isWebSocketReceivePayload", "prepareWebSocketReceivePayload");
    return isType(o);
}
export { isIdentifiablePayload as isIdentifiablePayload };
export { ValidatedPayload as ValidatedPayload };
export { isEventSourceService as isEventSourceService };
export { isFetchService as isFetchService };
export { isWebSocketSendService as isWebSocketSendService };
export { isWebSocketReceiveService as isWebSocketReceiveService };
function typicalConnectionValidator(pingURL) {
    return {
        validationEndpointURL: pingURL,
        validate: ()=>{
            return fetch(pingURL, {
                method: "HEAD"
            });
        }
    };
}
var ReconnectionState;
(function(ReconnectionState1) {
    ReconnectionState1["IDLE"] = "idle";
    ReconnectionState1["TRYING"] = "trying";
    ReconnectionState1["COMPLETED"] = "completed";
    ReconnectionState1["ABORTED"] = "aborted";
})(ReconnectionState || (ReconnectionState = {}));
class ReconnectionStrategy {
    maxAttempts;
    intervalMillecs;
    onStateChange;
    #state = ReconnectionState.IDLE;
    #attempt = 0;
    constructor(options){
        this.maxAttempts = options?.maxAttempts ?? 15;
        this.intervalMillecs = options?.intervalMillecs ?? 1000;
        this.onStateChange = options?.onStateChange;
    }
    get isTrying() {
        return this.#state == ReconnectionState.TRYING;
    }
    get isAborted() {
        return this.#state == ReconnectionState.ABORTED;
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
        this.#attempt++;
        if (this.#attempt > this.maxAttempts) {
            this.completed(ReconnectionState.ABORTED);
        } else {
            this.state = ReconnectionState.TRYING;
        }
        return this;
    }
    completed(status = ReconnectionState.COMPLETED) {
        this.state = status;
        return this;
    }
}
export { typicalConnectionValidator as typicalConnectionValidator };
export { ReconnectionState as ReconnectionState };
export { ReconnectionStrategy as ReconnectionStrategy };
const isEventSourceConnectionHealthy = typeGuard("isHealthy", "connEstablishedOn");
const isEventSourceConnectionUnhealthy = typeGuard("isHealthy", "connFailedOn");
const isEventSourceReconnecting = typeGuard("isHealthy", "connFailedOn", "reconnectStrategy");
const isEventSourceError = typeGuard("isEventSourceError", "errorEvent");
const isEventSourceEndpointUnavailable = typeGuard("isEndpointUnavailable", "endpointURL");
class EventSourceTunnel {
    esURL;
    esEndpointValidator;
    observerUniversalScopeID = "universal";
    eventSourceFactory;
    onConnStateChange;
    onReconnStateChange;
    #connectionState = {
        isConnectionState: true
    };
    #reconnStrategy;
    constructor(init){
        this.esURL = init.esURL;
        this.esEndpointValidator = init.esEndpointValidator;
        this.eventSourceFactory = init.eventSourceFactory;
        this.onConnStateChange = init.options?.onConnStateChange;
        this.onReconnStateChange = init.options?.onReconnStateChange;
    }
    isReconnecting() {
        return this.#reconnStrategy ? this.#reconnStrategy : false;
    }
    isReconnectAborted() {
        return this.#reconnStrategy && this.#reconnStrategy.isAborted ? true : false;
    }
    connected(es, connState) {
        if (this.#reconnStrategy) this.#reconnStrategy.completed();
        this.eventSourceFactory.connected?.(es);
        this.connectionState = connState;
        this.#reconnStrategy = undefined;
    }
    prepareReconnect(connState) {
        this.#reconnStrategy = this.#reconnStrategy ?? new ReconnectionStrategy({
            onStateChange: this.onReconnStateChange ? (active, previous, rs)=>{
                this.onReconnStateChange?.(active, previous, rs, this);
            } : undefined
        });
        connState = {
            ...connState,
            reconnectStrategy: this.#reconnStrategy
        };
        this.connectionState = connState;
        return this.#reconnStrategy.reconnect();
    }
    init() {
        if (this.isReconnectAborted()) return;
        this.esEndpointValidator.validate(this.#reconnStrategy).then((resp)=>{
            if (resp.ok) {
                const eventSource = this.eventSourceFactory.construct(this.esURL);
                const coercedES = eventSource;
                coercedES.onopen = ()=>{
                    this.connected(eventSource, {
                        isConnectionState: true,
                        isHealthy: true,
                        connEstablishedOn: new Date(),
                        endpointURL: this.esURL,
                        pingURL: this.esEndpointValidator.validationEndpointURL.toString()
                    });
                };
                coercedES.onerror = (event)=>{
                    coercedES.close();
                    const connState = {
                        isConnectionState: true,
                        isHealthy: false,
                        connFailedOn: new Date(),
                        isEventSourceError: true,
                        errorEvent: event
                    };
                    const reconnectStrategy = this.prepareReconnect(connState);
                    setTimeout(()=>this.init()
                    , reconnectStrategy.intervalMillecs);
                };
            } else {
                const connState = {
                    isConnectionState: true,
                    isHealthy: false,
                    connFailedOn: new Date(),
                    isEndpointUnavailable: true,
                    endpointURL: this.esURL,
                    pingURL: this.esEndpointValidator.validationEndpointURL.toString(),
                    httpStatus: resp.status,
                    httpStatusText: resp.statusText
                };
                const reconnectStrategy = this.prepareReconnect(connState);
                setTimeout(()=>this.init()
                , reconnectStrategy.intervalMillecs);
            }
        }).catch((connectionError)=>{
            const connState = {
                isConnectionState: true,
                isHealthy: false,
                connFailedOn: new Date(),
                pingURL: this.esEndpointValidator.validationEndpointURL.toString(),
                connectionError,
                isEndpointUnavailable: true,
                endpointURL: this.esURL
            };
            const reconnectStrategy = this.prepareReconnect(connState);
            setTimeout(()=>this.init()
            , reconnectStrategy.intervalMillecs);
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
function eventSourceConnNarrative(tunnel) {
    const sseState = tunnel.connectionState;
    const reconn = tunnel.isReconnecting();
    let reconnected = false;
    if (reconn) {
        switch(reconn.state){
            case ReconnectionState.TRYING:
                return {
                    summary: `reconnecting ${reconn.attempt}/${reconn.maxAttempts}`,
                    color: "orange",
                    isHealthy: false,
                    summaryHint: `Trying to reconnect to ${tunnel.esURL} (ES), reconnecting every ${reconn.intervalMillecs} milliseconds`
                };
            case ReconnectionState.ABORTED:
                return {
                    summary: `ABORTED`,
                    color: "red",
                    isHealthy: false,
                    summaryHint: `Unable to reconnect to ${tunnel.esURL} (ES) after ${reconn.maxAttempts} attempts, giving up`
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
            summaryHint: `Connection to ${sseState.endpointURL} (ES) verified using ${sseState.pingURL} on ${sseState.connEstablishedOn}`
        };
    }
    let summary = "unknown";
    let color = "purple";
    let summaryHint = `the EventSource tunnel is not healthy, but not sure why`;
    if (isEventSourceConnectionUnhealthy(sseState)) {
        if (isEventSourceEndpointUnavailable(sseState)) {
            summary = "ES unavailable";
            summaryHint = `${sseState.endpointURL} (ES) not available`;
            if (sseState.httpStatus) {
                summary = `ES unavailable (${sseState.httpStatus})`;
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
            },
            webSocket: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `web-socket-${identity}`;
                const universalName = `web-socket`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            webSocketError: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `web-socket-error-${identity}`;
                const universalName = `web-socket-error`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            webSocketInvalidPayload: ()=>{
                const universalName = `web-socket-invalid-payload`;
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
    esTunnels;
    wsTunnels;
    eventListenersLog;
    constructor(args){
        super();
        this.args = args;
        this.esTunnels = [];
        this.wsTunnels = [];
        this.eventListenersLog = [];
        if (args.esTunnels) this.registerEventSourceTunnels(args.esTunnels);
        if (args.wsTunnels) this.registerWebSocketTunnels(args.wsTunnels);
    }
    registerEventSourceTunnels(ests) {
        for (const tunnel of ests((event)=>{
            const eventSrcPayload = JSON.parse(event.data);
            const esDetail = {
                event,
                eventSrcPayload
            };
            this.dispatchNamingStrategyEvent(eventSrcPayload, isIdentifiablePayload(eventSrcPayload) ? this.args.eventNameStrategy.eventSource : this.args.eventNameStrategy.eventSourceInvalidPayload, esDetail);
        })){
            this.esTunnels.push(tunnel);
        }
    }
    registerWebSocketTunnels(ests) {
        for (const tunnel of ests((event)=>{
            if (typeof event.data === "string") {
                const payload = JSON.parse(event.data);
                const wsDetail = {
                    event,
                    payload,
                    webSocketStrategy: this
                };
                this.dispatchNamingStrategyEvent(payload, isIdentifiablePayload(payload) ? this.args.eventNameStrategy.webSocket : this.args.eventNameStrategy.webSocketInvalidPayload, wsDetail);
            } else {
                const payload = event.data;
                if (isIdentifiablePayload(payload)) {
                    const wsDetail = {
                        event,
                        payload,
                        webSocketStrategy: this
                    };
                    this.dispatchNamingStrategyEvent(payload, this.args.eventNameStrategy.webSocket, wsDetail);
                } else {
                    this.dispatchNamingStrategyEvent(event.data, this.args.eventNameStrategy.webSocketInvalidPayload, {
                        event,
                        webSocketStrategy: this
                    });
                }
            }
        })){
            this.wsTunnels.push(tunnel);
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
    observeUnsolicitedPayload(observer, payloadIdSupplier) {
        this.observeEventSource((payload)=>{
            observer(payload, this);
        }, payloadIdSupplier);
        this.observeWebSocketReceiveEvent((payload)=>{
            observer(payload, this);
        }, payloadIdSupplier);
    }
    observeReceivedPayload(observer, payloadIdSupplier) {
        this.observeEventSource((payload)=>{
            observer(payload, this);
        }, payloadIdSupplier);
        this.observeWebSocketReceiveEvent((payload)=>{
            observer(payload, this);
        }, payloadIdSupplier);
        this.observeFetchEventResponse((_fetched, received)=>{
            observer(received, this);
        }, payloadIdSupplier);
    }
    observeSolicitedPayload(observer, payloadIdSupplier) {
        this.observeFetchEventResponse((payload, responsePayload, ctx)=>{
            observer(payload, responsePayload, ctx, this);
        }, payloadIdSupplier);
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
    observeFetchEvent(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.fetch(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , requestInit , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(fetchPayload, requestInit, context, fetchStrategy);
        });
    }
    observeFetchEventResponse(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.fetchResponse(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , fetchRespPayload , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(fetchRespPayload, fetchPayload, context, fetchStrategy);
        });
    }
    observeFetchEventError(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.fetchError(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , error , requestInit , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(error, requestInit, fetchPayload, context, fetchStrategy);
        });
    }
    observeEventSource(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.eventSource(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            let { eventSrcPayload  } = typedCustomEvent.detail;
            if (isEventSourceService(payloadIdSupplier)) {
                if (payloadIdSupplier.isEventSourcePayload(eventSrcPayload)) {
                    eventSrcPayload = payloadIdSupplier.prepareEventSourcePayload(eventSrcPayload);
                    eventSrcPayload.isValidatedPayload = true;
                }
            }
            observer(eventSrcPayload, this);
        });
    }
    observeEventSourceError(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.eventSourceError(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { eventSrcPayload , error  } = typedCustomEvent.detail;
            observer(error, eventSrcPayload, this);
        });
    }
    webSocketSend(context, wss) {
        for (const ws of this.wsTunnels){
            ws.activeSocket?.send(wss.prepareWebSocketSend(wss.prepareWebSocketSendPayload(context, this), this));
        }
    }
    prepareWebSocketReceivePayload(webSocketReceiveRaw) {
        if (typeof webSocketReceiveRaw !== "string") {
            throw Error(`webSocketReceiveRaw must be text; TODO: allow binary?`);
        }
        return JSON.parse(webSocketReceiveRaw);
    }
    observeWebSocketSendEvent(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.webSocket(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { context , payload , webSocketStrategy  } = typedCustomEvent.detail;
            observer(payload, context, webSocketStrategy);
        });
    }
    observeWebSocketReceiveEvent(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.webSocket(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            let { payload  } = typedCustomEvent.detail;
            if (isEventSourceService(payloadIdSupplier)) {
                if (payloadIdSupplier.isEventSourcePayload(payload)) {
                    payload = payloadIdSupplier.prepareEventSourcePayload(payload);
                    payload.isValidatedPayload = true;
                }
            }
            observer(payload, this);
        });
    }
    observeWebSocketErrorEvent(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.webSocketError(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { error  } = typedCustomEvent.detail;
            observer(error, undefined, this);
        });
    }
    args;
}
export { serviceBusArguments as serviceBusArguments };
export { ServiceBus as ServiceBus };
const isWebSocketConnectionHealthy = typeGuard("isHealthy", "connEstablishedOn");
const isWebSocketConnectionUnhealthy = typeGuard("isHealthy", "connFailedOn");
const isWebSocketReconnecting = typeGuard("isHealthy", "connFailedOn", "reconnectStrategy");
const isWebSocketErrorEventSupplier = typeGuard("isEventSourceError", "errorEvent");
const isWebSocketCloseEventSupplier = typeGuard("isCloseEvent", "closeEvent");
const isWebSocketEndpointUnavailable = typeGuard("isEndpointUnavailable", "endpointURL");
class WebSocketTunnel {
    wsURL;
    wsEndpointValidator;
    observerUniversalScopeID = "universal";
    webSocketFactory;
    onConnStateChange;
    onReconnStateChange;
    allowClose;
    #activeSocket;
    #connectionState = {
        isConnectionState: true
    };
    #reconnStrategy;
    constructor(init){
        this.wsURL = init.wsURL;
        this.wsEndpointValidator = init.wsEndpointValidator;
        this.webSocketFactory = init.webSocketFactory;
        this.onConnStateChange = init.options?.onConnStateChange;
        this.onReconnStateChange = init.options?.onReconnStateChange;
        this.allowClose = init.options?.allowClose;
    }
    isReconnecting() {
        return this.#reconnStrategy ? this.#reconnStrategy : false;
    }
    isReconnectAborted() {
        return this.#reconnStrategy && this.#reconnStrategy.isAborted ? true : false;
    }
    connected(ws, connState) {
        if (this.#reconnStrategy) this.#reconnStrategy.completed();
        this.webSocketFactory.connected?.(ws);
        this.connectionState = connState;
        this.#reconnStrategy = undefined;
    }
    prepareReconnect(connState) {
        this.#reconnStrategy = this.#reconnStrategy ?? new ReconnectionStrategy({
            onStateChange: this.onReconnStateChange ? (active, previous, rs)=>{
                this.onReconnStateChange?.(active, previous, rs, this);
            } : undefined
        });
        connState = {
            ...connState,
            reconnectStrategy: this.#reconnStrategy
        };
        this.connectionState = connState;
        return this.#reconnStrategy.reconnect();
    }
    init() {
        if (this.isReconnectAborted()) return;
        this.wsEndpointValidator.validate(this.#reconnStrategy).then((resp)=>{
            if (resp.ok) {
                if (this.#activeSocket) this.#activeSocket.close();
                this.#activeSocket = undefined;
                const ws = this.#activeSocket = this.webSocketFactory.construct(this.wsURL);
                ws.onopen = ()=>{
                    this.connected(ws, {
                        isConnectionState: true,
                        isHealthy: true,
                        connEstablishedOn: new Date(),
                        endpointURL: this.wsURL,
                        pingURL: this.wsEndpointValidator.validationEndpointURL.toString()
                    });
                };
                ws.onclose = (event)=>{
                    const allowClose = this.allowClose?.(event, this) ?? false;
                    if (!allowClose) {
                        const connState = {
                            isConnectionState: true,
                            isHealthy: false,
                            connFailedOn: new Date(),
                            isCloseEvent: true,
                            closeEvent: event
                        };
                        const reconnectStrategy = this.prepareReconnect(connState);
                        setTimeout(()=>this.init()
                        , reconnectStrategy.intervalMillecs);
                    }
                };
                ws.onerror = (event)=>{
                    ws.close();
                    const connState = {
                        isConnectionState: true,
                        isHealthy: false,
                        connFailedOn: new Date(),
                        isEventSourceError: true,
                        errorEvent: event
                    };
                    const reconnectStrategy = this.prepareReconnect(connState);
                    setTimeout(()=>this.init()
                    , reconnectStrategy.intervalMillecs);
                };
            } else {
                const connState = {
                    isConnectionState: true,
                    isHealthy: false,
                    connFailedOn: new Date(),
                    isEndpointUnavailable: true,
                    endpointURL: this.wsURL,
                    pingURL: this.wsEndpointValidator.validationEndpointURL.toString(),
                    httpStatus: resp.status,
                    httpStatusText: resp.statusText
                };
                const reconnectStrategy = this.prepareReconnect(connState);
                setTimeout(()=>this.init()
                , reconnectStrategy.intervalMillecs);
            }
        }).catch((connectionError)=>{
            const connState = {
                isConnectionState: true,
                isHealthy: false,
                connFailedOn: new Date(),
                pingURL: this.wsEndpointValidator.validationEndpointURL.toString(),
                connectionError,
                isEndpointUnavailable: true,
                endpointURL: this.wsURL
            };
            const reconnectStrategy = this.prepareReconnect(connState);
            setTimeout(()=>this.init()
            , reconnectStrategy.intervalMillecs);
        });
        return this;
    }
    get activeSocket() {
        return this.#activeSocket;
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
function webSocketConnNarrative(tunnel, reconn) {
    const ws = tunnel.connectionState;
    if (!reconn && isWebSocketReconnecting(ws)) {
        reconn = ws.reconnectStrategy;
    }
    let reconnected = false;
    if (reconn) {
        switch(reconn.state){
            case ReconnectionState.TRYING:
                return {
                    summary: `reconnecting ${reconn.attempt}/${reconn.maxAttempts}`,
                    color: "orange",
                    isHealthy: false,
                    summaryHint: `Trying to reconnect to ${tunnel.wsURL} (WS), reconnecting every ${reconn.intervalMillecs} milliseconds`
                };
            case ReconnectionState.ABORTED:
                return {
                    summary: `failed`,
                    color: "red",
                    isHealthy: false,
                    summaryHint: `Unable to reconnect to ${tunnel.wsURL} (WS) after ${reconn.maxAttempts} attempts, giving up`
                };
            case ReconnectionState.COMPLETED:
                reconnected = true;
                break;
        }
    }
    if (isWebSocketConnectionHealthy(ws)) {
        return {
            summary: reconnected ? "reconnected" : "connected",
            color: "green",
            isHealthy: true,
            summaryHint: `Connection to ${ws.endpointURL} (WS) verified using ${ws.pingURL} on ${ws.connEstablishedOn}`
        };
    }
    let summary = "unknown";
    let color = "purple";
    let summaryHint = `the WebSocket tunnel is not healthy, but not sure why`;
    if (isWebSocketConnectionUnhealthy(ws)) {
        if (isWebSocketEndpointUnavailable(ws)) {
            summary = "WS unavailable";
            summaryHint = `${ws.endpointURL} not available`;
            if (ws.httpStatus) {
                summary = `WS unavailable (${ws.httpStatus})`;
                summaryHint += ` (HTTP status: ${ws.httpStatus}, ${ws.httpStatusText})`;
                color = "red";
            }
        } else {
            if (isWebSocketErrorEventSupplier(ws)) {
                summary = "error";
                summaryHint = JSON.stringify(ws.errorEvent);
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
export { isWebSocketConnectionHealthy as isWebSocketConnectionHealthy };
export { isWebSocketConnectionUnhealthy as isWebSocketConnectionUnhealthy };
export { isWebSocketReconnecting as isWebSocketReconnecting };
export { isWebSocketErrorEventSupplier as isWebSocketErrorEventSupplier };
export { isWebSocketCloseEventSupplier as isWebSocketCloseEventSupplier };
export { isWebSocketEndpointUnavailable as isWebSocketEndpointUnavailable };
export { WebSocketTunnel as WebSocketTunnel };
export { webSocketConnNarrative as webSocketConnNarrative };
function markdownItTransformer() {
    return {
        dependencies: undefined,
        acquireDependencies: async (transformer)=>{
            const { default: markdownIt  } = await import("https://jspm.dev/markdown-it@12.2.0");
            return {
                markdownIt,
                plugins: await transformer.plugins()
            };
        },
        construct: async (transformer)=>{
            if (!transformer.dependencies) {
                transformer.dependencies = await transformer.acquireDependencies(transformer);
            }
            const markdownIt = transformer.dependencies.markdownIt({
                html: true,
                linkify: true,
                typographer: true
            });
            transformer.customize(markdownIt, transformer);
            return markdownIt;
        },
        customize: (markdownIt, transformer)=>{
            const plugins = transformer.dependencies.plugins;
            markdownIt.use(plugins.footnote);
            return transformer;
        },
        unindentWhitespace: (text, removeInitialNewLine = true)=>{
            const whitespace = text.match(/^[ \t]*(?=\S)/gm);
            const indentCount = whitespace ? whitespace.reduce((r, a)=>Math.min(r, a.length)
            , Infinity) : 0;
            const regex = new RegExp(`^[ \\t]{${indentCount}}`, "gm");
            const result = text.replace(regex, "");
            return removeInitialNewLine ? result.replace(/^\n/, "") : result;
        },
        plugins: async ()=>{
            const { default: footnote  } = await import("https://jspm.dev/markdown-it-footnote@3.0.3");
            return {
                footnote,
                adjustHeadingLevel: (md, options)=>{
                    function getHeadingLevel(tagName) {
                        if (tagName[0].toLowerCase() === 'h') {
                            tagName = tagName.slice(1);
                        }
                        return parseInt(tagName, 10);
                    }
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
                    md.core.ruler.push("adjust-heading-levels", function(state) {
                        const tokens = state.tokens;
                        for(let i = 0; i < tokens.length; i++){
                            if (tokens[i].type !== "heading_close") {
                                continue;
                            }
                            const headingOpen = tokens[i - 2];
                            const headingClose = tokens[i];
                            const currentLevel = getHeadingLevel(headingOpen.tag);
                            const tagName = 'h' + Math.min(currentLevel + levelOffset, 6);
                            headingOpen.tag = tagName;
                            headingClose.tag = tagName;
                        }
                    });
                }
            };
        }
    };
}
async function renderMarkdown(strategies, mditt = markdownItTransformer()) {
    const markdownIt = await mditt.construct(mditt);
    for await (const strategy of strategies(mditt)){
        const markdown = mditt.unindentWhitespace(await strategy.markdownText(mditt));
        strategy.renderHTML(markdownIt.render(markdown), mditt);
    }
}
function importMarkdownContent(input, select, inject) {
    fetch(input).then((resp)=>{
        resp.text().then((html)=>{
            const parser = new DOMParser();
            const foreignDoc = parser.parseFromString(html, "text/html");
            const selected = select(foreignDoc);
            if (Array.isArray(selected)) {
                for (const s of selected){
                    const importedNode = document.adoptNode(s);
                    inject(importedNode, input, html);
                }
            } else if (selected) {
                const importedNode = document.adoptNode(selected);
                inject(importedNode, input, html);
            }
        });
    });
}
async function transformMarkdownElemsCustom(srcElems, finalizeElemFn, mditt = markdownItTransformer()) {
    await renderMarkdown(function*() {
        for (const elem of srcElems){
            yield {
                markdownText: async ()=>{
                    if (elem.dataset.transformableSrc) {
                        const response = await fetch(elem.dataset.transformableSrc);
                        if (!response.ok) {
                            return `Error fetching ${elem.dataset.transformableSrc}: ${response.status}`;
                        }
                        return await response.text();
                    } else {
                        return elem.innerText;
                    }
                },
                renderHTML: async (html)=>{
                    try {
                        const formatted = document.createElement("div");
                        formatted.innerHTML = html;
                        elem.parentElement.replaceChild(formatted, elem);
                        if (finalizeElemFn) finalizeElemFn(formatted, elem);
                    } catch (error) {
                        console.error("Undiagnosable error in renderHTML()", error);
                    }
                }
            };
        }
    }, mditt);
}
async function transformMarkdownElems(firstHeadingLevel = 2) {
    const mdittDefaults = markdownItTransformer();
    await transformMarkdownElemsCustom(document.querySelectorAll(`[data-transformable="markdown"]`), (mdHtmlElem, mdSrcElem)=>{
        mdHtmlElem.dataset.transformedFrom = "markdown";
        if (mdSrcElem.className) mdHtmlElem.className = mdSrcElem.className;
        document.dispatchEvent(new CustomEvent("transformed-markdown", {
            detail: {
                mdHtmlElem,
                mdSrcElem
            }
        }));
    }, {
        ...mdittDefaults,
        customize: (markdownIt, transformer)=>{
            mdittDefaults.customize(markdownIt, transformer);
            markdownIt.use(transformer.dependencies.plugins.adjustHeadingLevel, {
                firstLevel: firstHeadingLevel
            });
        }
    });
}
export { markdownItTransformer as markdownItTransformer };
export { renderMarkdown as renderMarkdown };
export { importMarkdownContent as importMarkdownContent };
export { transformMarkdownElemsCustom as transformMarkdownElemsCustom };
export { transformMarkdownElems as transformMarkdownElems };
