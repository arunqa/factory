import { fs } from "../../deps.ts";
import * as govn from "../../../governance/mod.ts";
import * as nature from "../../../core/std/nature.ts";
import * as fsrf from "../../originate/file-sys-globs.ts";
import * as cache from "../../../lib/cache/mod.ts";
import * as route from "../../../core/std/route.ts";
import * as persist from "../../../core/std/persist.ts";

export interface FileSysJsonResourceConstructor {
  (
    we: fsrf.FileSysGlobWalkEntry<govn.JsonInstanceSupplier>,
    options: route.FileSysRouteOptions,
    imported: govn.ExtensionModule,
  ): Promise<govn.JsonInstanceSupplier>;
}

export interface FileSysJsonResourcesConstructor {
  (
    we: fsrf.FileSysGlobWalkEntry<govn.JsonInstanceSupplier>,
    options: route.FileSysRouteOptions,
    imported: govn.ExtensionModule,
  ): Promise<
    & govn.JsonInstanceSupplier
    & govn.ChildResourcesFactoriesSupplier<govn.JsonInstanceSupplier>
  >;
}

export class FileSysJsonResourceProxyFactory<OriginContext>
  extends cache.ProxyableFileSysResource<govn.JsonTextSupplier, OriginContext> {
  constructor(
    proxyFilePathAndName: string,
    proxyStrategy: cache.FileSysResourceProxyStrategy,
    readonly origin: cache.ProxyableFileSysOriginSupplier<
      govn.JsonTextSupplier,
      OriginContext
    >,
    readonly proxy: (
      suggested: govn.JsonTextSupplier & cache.ProxiedFileSysResource,
    ) => Promise<govn.JsonTextSupplier & cache.ProxiedFileSysResource>,
    fsrpEE?: cache.FileSysResourceProxyEventsEmitter,
  ) {
    super(proxyFilePathAndName, proxyStrategy, fsrpEE);
  }

  isOriginAvailable(
    fsrpsr: cache.FileSysResourceProxyStrategyResult,
  ): Promise<OriginContext | false> {
    return this.origin.isOriginAvailable(fsrpsr);
  }

  constructFromOrigin(ctx: OriginContext): Promise<govn.JsonTextSupplier> {
    return this.origin.acquireOrigin(ctx);
  }

  async constructFromProxy(
    pfsr: cache.ProxiedFileSysResource,
  ): Promise<govn.JsonTextSupplier & cache.ProxiedFileSysResource> {
    return await this.proxy({
      jsonText: {
        text: () =>
          Deno.readTextFile(pfsr.proxyStrategyResult.proxyFilePathAndName),
        textSync: () =>
          Deno.readTextFileSync(pfsr.proxyStrategyResult.proxyFilePathAndName),
      },
      ...pfsr,
    });
  }

  // deno-lint-ignore require-await
  async constructErrorProxy(
    pfsr:
      & Omit<cache.ProxiedFileSysResource, "proxiedFileInfo">
      & cache.ProxiedResourceNotAvailable,
  ): Promise<govn.JsonTextSupplier> {
    console.warn(
      `FileSysJsonResourceProxyFactory issue: ${JSON.stringify(pfsr)}`,
    );
    return {
      jsonText: {
        // deno-lint-ignore require-await
        text: async () =>
          `FileSysJsonResourceProxyFactory issue: ${JSON.stringify(pfsr)}`,
        textSync: () =>
          `FileSysJsonResourceProxyFactory issue: ${JSON.stringify(pfsr)}`,
      },
      ...pfsr,
    };
  }

  async persistProxy(
    resource: govn.JsonTextSupplier,
    destFile: string,
  ): Promise<govn.JsonTextSupplier> {
    await persist.persistFlexibleFileCustom(resource.jsonText, destFile, {
      ensureDirSync: fs.ensureDirSync,
    });
    return resource;
  }
}

export function jsonFileSysResourceFactory(
  refine?: govn.ResourceRefinery<govn.JsonInstanceSupplier>,
): fsrf.FileSysGlobWalkEntryFactory<govn.JsonInstanceSupplier> {
  return {
    construct: async (we, options) => {
      const imported = await options.extensionsManager.importModule(we.path);
      const issue = (diagnostics: string, ...args: unknown[]) => {
        options.log.error(diagnostics, ...args);
        const jsonInstance = diagnostics;
        const result:
          & govn.ModuleResource
          & govn.PersistableJsonResource
          & govn.RouteSupplier = {
            imported,
            nature: nature.jsonContentNature,
            route: { ...we.route, nature: nature.jsonContentNature },
            jsonInstance,
            jsonText: jsonInstance,
          };
        return result;
      };

      if (imported.isValid) {
        // deno-lint-ignore no-explicit-any
        const defaultValue = (imported.module as any).default;
        if (defaultValue) {
          const exports = imported.exports();
          const result:
            & govn.ModuleResource
            & govn.JsonInstanceSupplier
            & govn.NatureSupplier<govn.MediaTypeNature<govn.JsonTextSupplier>>
            & govn.RouteSupplier = {
              imported,
              nature: nature.jsonContentNature,
              route:
                route.isRouteSupplier(exports) && route.isRoute(exports.route)
                  ? exports.route
                  : { ...we.route, nature: nature.jsonContentNature },
              jsonInstance: defaultValue,
            };
          return result;
        } else {
          return issue("JSON Module has no default value");
        }
      } else {
        return issue(
          "Invalid JSON Module " + imported.importError,
          imported.importError,
        );
      }
    },
    refine,
  };
}
