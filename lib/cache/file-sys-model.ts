import * as govn from "./governance.ts";

declare global {
  interface Window {
    // deno-lint-ignore no-explicit-any
    proxyableMemoryFirstModelsCache: Map<string, any>;
  }
}

if (!window.proxyableMemoryFirstModelsCache) {
  window.proxyableMemoryFirstModelsCache = new Map();
}

export function typicalProxyableFileSysModelArgs<
  Model,
  OriginContext,
>(
  args: Omit<
    govn.ProxyableFileSysModelLifecycle<Model, OriginContext>,
    "constructFromProxy"
  >,
): govn.ProxyableFileSysModelLifecycle<Model, OriginContext> {
  return {
    ...args,
    constructFromProxy: async (pfsr) => {
      return JSON.parse(
        await Deno.readTextFile(pfsr.proxyStrategyResult.proxyFilePathAndName),
      );
    },
  };
}

export function proxyableFileSysModel<Model, OriginContext>(
  args: govn.ProxyableFileSysModelArguments<Model, OriginContext>,
): govn.ProxyableModel<Model> {
  return async () => {
    const fsrpsr = await args.proxyStrategy(args.proxyFilePathAndName);
    if (fsrpsr.isConstructFromOrigin) {
      try {
        const ctx = await args.isOriginAvailable(fsrpsr);
        if (ctx) {
          const model = await args.constructFromOrigin(ctx, fsrpsr);
          return await args.persistProxied(model, fsrpsr, ctx);
        } else {
          if (fsrpsr.proxyFileInfo) {
            // origin was not available, use the proxy
            return await args.constructFromProxy({
              proxyStrategyResult: fsrpsr,
            });
          }
          // origin was not available, and proxy is not available
          return await args.constructFromError({
            originNotAvailable: true,
            proxyStrategyResult: fsrpsr,
          });
        }
      } catch (proxyOriginError) {
        // origin was not accessible, and proxy is not available
        return await args.constructFromError({
          proxyStrategyResult: fsrpsr,
          originNotAvailable: false,
          proxyOriginError,
        });
      }
    } else {
      // fsrpsr.isConstructFromOrigin is false
      return await args.constructFromProxy({ proxyStrategyResult: fsrpsr });
    }
  };
}

export function proxyableMemoryFirstFileSysModel<Model, OriginContext>(
  args: govn.ProxyableFileSysModelArguments<Model, OriginContext>,
): govn.ProxyableModel<Model> {
  const proxyableModel = proxyableFileSysModel<Model, OriginContext>(args);
  return async () => {
    let model = window.proxyableMemoryFirstModelsCache.get(
      args.proxyFilePathAndName,
    ) as Model;
    if (model) return model;
    model = await proxyableModel();
    window.proxyableMemoryFirstModelsCache.set(
      args.proxyFilePathAndName,
      model,
    );
    return model;
  };
}
