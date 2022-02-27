import * as govn from "../../../governance/mod.ts";
import * as dGovn from "./governance.ts";
import * as rModule from "../../resource/module/module.ts";
import * as nature from "../../std/nature.ts";
import * as m from "./metrics.ts";

/**
 * Use observabilityResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function observabilityPreProduceResources<
  State extends dGovn.PreProduceObservabilityState,
>(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  state: State,
  // deno-lint-ignore no-explicit-any
): govn.ResourcesFactoriesSupplier<any> {
  return {
    resourcesFactories: async function* () {
      if (state.metrics) {
        yield m.metricsHtmlFactorySupplier(parentRoute, rf, state);
      }
    },
  };
}

/**
 * Use observabilityPostProduceResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function observabilityPostProduceResources<
  State extends dGovn.PostProduceObservabilityState,
>(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  state: State,
  // deno-lint-ignore no-explicit-any
): govn.ResourcesFactoriesSupplier<any> {
  return {
    resourcesFactories: async function* () {
      yield* m.metricsFactorySuppliers(parentRoute, rf, state);
      if (state.renderHealth) {
        yield {
          resourceFactory: async () => {
            const health = await state.observability.serviceHealth(
              {
                includeEnv: state.envVars.renderInHealth,
                envVarFilter: state.envVars.filter,
              },
            );
            const healthJSON = JSON.stringify(health, undefined, "  ");
            const resource:
              & govn.PersistableStructuredDataResource
              & govn.RouteSupplier = {
                nature: nature.jsonContentNature,
                route: {
                  ...rf.childRoute(
                    { unit: "health", label: "Health JSON" },
                    parentRoute,
                    false,
                  ),
                  nature: nature.jsonContentNature,
                },
                structuredDataInstance: () => health,
                serializedData: {
                  text: healthJSON,
                  textSync: healthJSON,
                },
              };
            return resource;
          },
        };
      }
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
 *   import * as o from "../../../core/design-system/lightning/content/diagnostic/mod.ts";
 *   export default o.obsFileSysModuleConstructor;
 *
 * The above would allow you move the resources anywhere just by setting up the right
 * files.
 *
 * @param we The walk entry where the resources should be generated
 * @param options Configuration preferences
 * @param imported The module thats imported (e.g. index.r.ts)
 * @returns
 */
export const obsPreProduceFileSysModuleConstructor:
  rModule.FileSysResourceModuleConstructor<
    dGovn.PreProduceObservabilityState
  > =
  // deno-lint-ignore require-await
  async (we, options, imported, state) => {
    return {
      imported,
      isChildResourcesFactoriesSupplier: true,
      yieldParentWithChildren: false,
      ...observabilityPreProduceResources(
        we.route,
        options.fsRouteFactory,
        state,
      ),
    };
  };

export const obsPostProduceFileSysModuleConstructor:
  rModule.FileSysResourceModuleConstructor<
    dGovn.PostProduceObservabilityState
  > =
  // deno-lint-ignore require-await
  async (we, options, imported, state) => {
    return {
      imported,
      isChildResourcesFactoriesSupplier: true,
      yieldParentWithChildren: false,
      ...observabilityPostProduceResources(
        we.route,
        options.fsRouteFactory,
        state,
      ),
    };
  };
