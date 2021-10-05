import * as govn from "../../../governance/mod.ts";
import * as nature from "../../../core/std/nature.ts";
import * as fsrf from "../../originate/file-sys-globs.ts";
import * as route from "../../../core/std/route.ts";

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
