export const fetchFxCache = new Map(); // Map<string, {fetchedValue: unknown; accessCount: number; expired?: (cacheEntry) => boolean}>
export const fetchFxSuccessEventName = "fetchFx";
export const fetchFxFailEventName = "fetchFxFail";

export const fetchRespJsonValue = async (resp, _fetchFxCtx) => await resp.json();
export const fetchRespTextValue = async (resp, _fetchFxCtx) => await resp.text();

/**
 * Since deps.js.ts contains "https://raw.githubusercontent.com/douglascrockford/JSON-js/master/cycle.js",
 * fetchRespRetrocycledJsonValue forces a call to JSON.retrocycle to allow
 * complex JSON values which might have circular references.
 * @param {*} resp the HTTP fetch response object instance
 * @param {*} fetchFxCtx the fetchFx context which needs the value
 * @returns the JSON value, forcefully retrocycled
 */
export const fetchRespRetrocycledJsonValue = async (resp, _fetchFxCtx) => JSON.retrocycle(await resp.json());

/**
 * fetchRespAutoHeadersValue returns the content based on response headers;
 * "RF_SRSCRIPT_RESP_STRATEGY" is created by executive/publ/server/middleware/server-runtime-script-proxy.ts
 * @param {*} resp
 * @param {*} fetchFxCtx
 * @returns
 */
export const fetchRfSrcScriptRespHeadersValue = async (resp, fetchFxCtx) => {
    const strategy = resp.headers.get("rf-srscript-resp-strategy");
    const optionsJSON = resp.headers.get("rf-srscript-resp-strategy-options");
    const options = optionsJSON ? JSON.parse(optionsJSON) : undefined;
    if (strategy && strategy === "Deno.inspect") return await fetchRespTextValue(resp, fetchFxCtx);
    // if we get to here the strategy is "JSON"
    if (options?.decycle) return await fetchRespRetrocycledJsonValue(resp, fetchFxCtx);
    return await fetchRespJsonValue(resp, fetchFxCtx);
};

let fetchFxIdentity = 0;

/**
 * fetchFx is our specialized user agent (UA or client-side) resumability bus.
 * Whenever any content/value (e.g JSON, CSV, HTML) server fetch is required
 * by the page, use this so elements can listen in and react to resumability in
 * case they need it. Don't use custom fetches because those cannot be easily
 * observed by others. This is the central UA "resumability service bus" (RSB).
 *
 * This function makes calls to servers and returns arbitrary content/values but
 * also, by default (which can be disabled), dispatch a DOM event when fetch
 * completes (so that components can observe the events for their own needs such
 * as filling out a table, updating the DOM, etc.). Fetched values are cached by
 * default (which can be disabled) and the cache access also generate events
 * with expiration history so that observers know if it's an actual fetch vs.
 * cache hit. Cache entries can also be (optionally) expired or replaced before
 * access using custom functions.
 * @param {*} params
 * @returns fetched (or cached) JSON
 */
export const fetchFx = async (params, extraCtx) => {
    const defaultFetchID = ++fetchFxIdentity;
    const successEventName = params.fetchFxSuccessEventName ?? fetchFxSuccessEventName;
    const failEventName = params.fetchFxFailEventName ?? fetchFxFailEventName;
    const {
        fetchURL, // always required
        identity = defaultFetchID,
        requestInit = undefined, // if defined, provide (params, fetchFxCtx) => RequestInit function or RequestInit object
        fetchValue = fetchRespJsonValue, // could be replaced with HTML, CSV, or other value
        cache = fetchFxCache, // options, with defaults
        // onFetched, onAccess, and onCacheAccess have signataure (json, fetchFxCtx) => void
        // onAccess is always called on success, while onFetched is only called if true fetch, onCacheAccess only if cached access
        onFetched = undefined, onAccess = undefined, onInvalidFetch = undefined, onFetchError = undefined,
        // pass false (NOT undefined) to disable event because the spread will default it
        constructSuccessEvent = (fetchedValue, fetchFxCtx) => new CustomEvent(successEventName, { detail: { fetchedValue, fetchFxCtx } }),
        // pass false (NOT undefined) to disable event because the spread will default it
        constructFailEvent = (fetchFxCtx, fetchedValue) => new CustomEvent(failEventName, { detail: { fetchFxCtx, fetchedValue } }),
        // pass false (NOT undefined) to disable event because the spread will default it
        dispatchSuccessEvent = (fetchedValue, fetchFxCtx) => {
            const event = typeof constructSuccessEvent === "function" ? constructSuccessEvent(fetchedValue, fetchFxCtx) : undefined;
            if (event) window.dispatchEvent(event);
        },
        // pass false (NOT undefined) to disable event because the spread will default it
        dispatchFailEvent = (fetchFxCtx, fetchedValue) => {
            const event = typeof constructFailEvent === "function" ? constructFailEvent(fetchFxCtx, fetchedValue) : undefined;
            if (event) window.dispatchEvent(event);
        },
        defaultCacheExpiredSupplier = undefined, // can be (cacheEntry, fetchFxCtx) => boolean; return true if expired, false if valid
        defaultCacheAccessCallback = undefined, // can be (cacheEntry, fetchFxCtx) => CacheEntry; MUST return cacheEntry to be valid
        defaultCacheExpiredCallback = undefined, // can be (cacheEntry, fetchFxCtx) => CacheEntry; MUST return cacheEntry to be valid
        constructCacheEntry = (fetchedValue, _fetchFxCtx) => ({
            // don't store fetchFxCtx as-is, it's ephemeral and may cause memory leaks
            fetchedValue, accessCount: 0, expired: defaultCacheExpiredSupplier,
            onCacheAccess: defaultCacheAccessCallback, onCacheExpired: defaultCacheExpiredCallback
        }),
        diagnose = false // optional diagnostics
    } = params;
    if (!fetchURL) throw new Error(`No fetchURL in fetchFx(${JSON.stringify(params)})`);
    const defaultContext = { identity, params, cache, ...extraCtx };

    const reportSuccess = (fetchedValue, fetchFxCtx) => {
        if (diagnose && typeof fetchedValue === "object")
            fetchedValue.jsonFetchDiagnostics = diagnostics(fetchFxCtx);
        if (typeof onAccess == "function") onAccess(fetchedValue, fetchFxCtx);
        if (typeof dispatchSuccessEvent === "function") {
            dispatchSuccessEvent(fetchedValue, fetchFxCtx);
        }
    }

    const reportFailure = (fetchFxCtx, fetchedValue) => {
        if (diagnose && typeof fetchedValue === "object")
            fetchedValue.jsonFetchDiagnostics = diagnostics(fetchFxCtx);
        if (typeof dispatchFailEvent === "function") {
            dispatchFailEvent(fetchFxCtx, fetchedValue);
        }
    }

    const diagnostics = (fetchFxCtx) => ({
        ...fetchFxCtx,
        cacheState: cache ? Object.fromEntries(cache) : false, // we want the state of the cache at this moment
    })

    let expiredCacheEntries = undefined;
    let isCacheEntryExpired = undefined; // can be "natural" or "forced"
    if (cache && cache.has(fetchURL)) {
        const cacheEntry = cache.get(fetchURL);

        // allow the cache supplier to replace or mutate the cache entry
        if (cacheEntry.onCacheAccess) cacheEntry = cacheEntry.onCacheAccess?.(cacheEntry, defaultContext);

        // if the cache entry was invalidated forcefully, don't return it
        // and treat it like an expired entry
        if (cacheEntry) {
            // if cacheEntry.expired is a function and returns true, the cache entry
            // has expired and we should go back and do the fetch
            if (typeof cacheEntry.expired !== "function" || !cacheEntry.expired(cacheEntry, defaultContext)) {
                cacheEntry.accessCount = cacheEntry.accessCount + 1;
                const { fetchedValue } = cacheEntry;
                reportSuccess(fetchedValue, { ...defaultContext, cacheEntry });
                return fetchedValue;
            } else {
                isCacheEntryExpired = "natural";
                cacheEntry.onCacheExpired?.(cacheEntry, { ...defaultContext, expiredCacheEntries, isCacheEntryExpired });
            }
        } else {
            isCacheEntryExpired = "forced";
        }

        // maintain a stack of expired entries in case it's necessary
        expiredCacheEntries = expiredCacheEntries ? [...expiredCacheEntries, cacheEntry] : cacheEntry;
    }

    // initialize the fetch with either a function or object or undefined if no special methods/body
    let fetchInit;
    let resp;
    let fetchError;
    try {
        fetchInit = requestInit
            ? (typeof requestInit === "function"
                ? requestInit(params)
                : requestInit)
            : undefined;
        resp = await fetch(fetchURL, fetchInit);
    } catch (error) {
        fetchError = error;
        if (diagnose) console.error(error);
    }

    const fetchFxCtx = { ...defaultContext, fetchInit, resp, fetchError, isCacheEntryExpired, expiredCacheEntries };
    let fetchedValue = undefined;
    let constructedCacheEntry = undefined;
    if (fetchError) {
        fetchedValue = onFetchError?.(fetchFxCtx) ?? diagnostics(fetchFxCtx);
        reportFailure(fetchFxCtx, fetchedValue);
    } else if (!resp.ok) {
        fetchedValue = onInvalidFetch?.(fetchFxCtx) ?? diagnostics(fetchFxCtx);
        reportFailure(fetchFxCtx, fetchedValue);
    } else {
        fetchedValue = await fetchValue(resp, fetchFxCtx);
        if (typeof onFetched == "function") onFetched(fetchedValue, fetchFxCtx);
        if (cache && typeof constructCacheEntry === "function") {
            constructedCacheEntry = constructCacheEntry(fetchedValue, fetchFxCtx)
            cache.set(fetchURL, constructedCacheEntry);
        }
        reportSuccess(fetchedValue, fetchFxCtx);
    }
    return fetchedValue;
}
