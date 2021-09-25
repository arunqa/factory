import { govnSvcFsAnalytics as fsA } from "../../../../deps.ts";
import * as govn from "../../../../../governance/mod.ts";
import * as rModule from "../../../../resource/module/module.ts";
import * as nature from "../../../../std/nature.ts";
import * as o from "../../../../std/observability.ts";
import * as m from "./metrics.ts";

export interface ObservabilityState {
  readonly assetsMetrics: fsA.AssetsMetricsResult;
  readonly observability: o.Observability;
}

/**
 * Use observabilityResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function observabilityPreProduceResources(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  // deno-lint-ignore no-explicit-any
): govn.ResourcesFactoriesSupplier<any> {
  return {
    resourcesFactories: async function* () {
      yield m.metricsHtmlFactorySupplier(parentRoute, rf);
    },
  };
}

/**
 * Use observabilityPostProduceResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function observabilityPostProduceResources<
  State extends ObservabilityState,
>(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  state: State,
  // deno-lint-ignore no-explicit-any
): govn.ResourcesFactoriesSupplier<any> {
  return {
    resourcesFactories: async function* () {
      for (const factory of m.metricsFactorySuppliers(parentRoute, rf, state)) {
        yield factory;
      }
      yield {
        // deno-lint-ignore require-await
        resourceFactory: async () => {
          const health = state.observability.serviceHealth();
          const healthJSON = JSON.stringify(health, undefined, "  ");
          const resource: govn.PersistableJsonResource & govn.RouteSupplier = {
            nature: nature.jsonContentNature,
            route: {
              ...rf.childRoute(
                { unit: "health", label: "Health JSON" },
                parentRoute,
                false,
              ),
              nature: nature.jsonContentNature,
            },
            jsonInstance: () => health,
            jsonText: {
              text: healthJSON,
              textSync: healthJSON,
            },
          };
          return resource;
        },
      };
    },
  };
}

/**
 * Use fileSysModuleConstructor to include these resources as part of a file
 * system origination source instead of directly as originators. For example,
 * you can create something like this:
 *
 * content/
 *   observability/
 *     index.rf.ts
 *
 * And in index.rf.ts you would have:
 *   import * as o from "../../../core/design-system/lightning/content/observability/mod.ts";
 *   export default o.fileSysModuleConstructor;
 *
 * The above would allow you move the resources anywhere just by setting up the right
 * files.
 *
 * @param we The walk entry where the resources should be generated
 * @param options Configuration preferences
 * @param imported The module thats imported (e.g. index.r.ts)
 * @returns
 */
export const fileSysModuleConstructor: rModule.FileSysResourceModuleConstructor<
  ObservabilityState
> =
  // deno-lint-ignore require-await
  async (we, options, imported) => {
    return {
      imported,
      isChildResourcesFactoriesSupplier: true,
      yieldParentWithChildren: false,
      ...observabilityPreProduceResources(
        we.route,
        options.fsRouteFactory,
      ),
    };
  };
