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
    let proxyConfigState: govn.ProxyConfigurationState | undefined;
    const fsrpsr = await args.proxyStrategy(args.proxyFilePathAndName);
    if (args.configState) {
      // if this proxy needs to be "configured" (e.g. coming from a database or
      // an API which requires secrets) and the configuration is not provided
      // then just try to construct from proxy without trying to originate.
      proxyConfigState = await args.configState();
      if (!proxyConfigState.isConfigured) {
        return args.constructNotConfigured
          ? await args.constructNotConfigured()
          : await args.constructFromProxy({
            proxyConfigState,
            proxyStrategyResult: fsrpsr,
          });
      }
    }

    if (fsrpsr.isConstructFromOrigin) {
      try {
        const ctx = await args.isOriginAvailable(fsrpsr);
        if (ctx) {
          const model = await args.constructFromOrigin(ctx, fsrpsr);
          return await args.cacheProxied(model, fsrpsr, ctx);
        } else {
          if (fsrpsr.proxyFileInfo) {
            // origin was not available, use the proxy
            return await args.constructFromProxy({
              proxyStrategyResult: fsrpsr,
              proxyConfigState,
            });
          }
          // origin was not available, and proxy is not available
          return await args.constructFromError({
            originNotAvailable: true,
            proxyStrategyResult: fsrpsr,
            proxyConfigState,
          });
        }
      } catch (proxyOriginError) {
        // origin was not accessible, and proxy is not available
        return await args.constructFromError({
          proxyStrategyResult: fsrpsr,
          originNotAvailable: false,
          proxyOriginError,
          proxyConfigState,
        });
      }
    } else {
      // fsrpsr.isConstructFromOrigin is false
      return await args.constructFromProxy({
        proxyStrategyResult: fsrpsr,
        proxyConfigState,
      });
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
