import * as govn from "../../../../governance/mod.ts";
import * as rModule from "../../../resource/module/module.ts";
import * as routes from "./routes.ts";
import * as renderers from "./renderers.ts";

/**
 * Use observabilityResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function observabilityResources(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  // deno-lint-ignore no-explicit-any
): govn.ResourcesFactoriesSupplier<any> {
  return {
    resourcesFactories: async function* () {
      yield routes.routesHtmlFactorySupplier(parentRoute, rf);
      yield routes.routesJsonFactorySupplier(parentRoute, rf);
      yield renderers.renderersHtmlFactorySupplier(parentRoute, rf);
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
 *   import * as o from "../../../core/design-system/lightning/content/observability.rf.ts";
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
export const fileSysModuleConstructor:
  // deno-lint-ignore require-await
  rModule.FileSysResourceModuleConstructor = async (
    we,
    options,
    imported,
  ) => {
    return {
      imported,
      isChildResourcesFactoriesSupplier: true,
      yieldParentWithChildren: false,
      ...observabilityResources(we.route, options.fsRouteFactory),
    };
  };
