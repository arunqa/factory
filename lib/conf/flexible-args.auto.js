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
