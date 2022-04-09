import * as govn from "../../../governance/mod.ts";
import * as nature from "../../../core/std/nature.ts";
import * as fsrf from "../../originate/file-sys-globs.ts";
import * as route from "../../../core/std/route.ts";
import * as extn from "../../../lib/module/mod.ts";

export interface FileSysJsonResourceConstructor {
  (
    we: fsrf.FileSysGlobWalkEntry<govn.StructuredDataInstanceSupplier>,
    options: route.FileSysRouteOptions,
    imported: extn.ExtensionModule,
  ): Promise<govn.StructuredDataInstanceSupplier>;
}

export interface FileSysJsonResourcesConstructor {
  (
    we: fsrf.FileSysGlobWalkEntry<govn.StructuredDataInstanceSupplier>,
    options: route.FileSysRouteOptions,
    imported: extn.ExtensionModule,
  ): Promise<
    & govn.StructuredDataInstanceSupplier
    & govn.ChildResourcesFactoriesSupplier<govn.StructuredDataInstanceSupplier>
  >;
}

export function jsonFileSysResourceFactory(
  refine?: govn.ResourceRefinery<govn.StructuredDataInstanceSupplier>,
): fsrf.FileSysGlobWalkEntryFactory<govn.StructuredDataInstanceSupplier> {
  return {
    construct: async (we, options) => {
      const imported = await options.extensionsManager.importModule(we.path);
      const issue = (diagnostics: string, ...args: unknown[]) => {
        options.log.error(diagnostics, ...args);
        const structuredDataInstance = diagnostics;
        const result:
          & govn.ModuleResource
          & govn.PersistableStructuredDataResource
          & govn.RouteSupplier = {
            imported,
            nature: nature.jsonContentNature,
            route: { ...we.route, nature: nature.jsonContentNature },
            structuredDataInstance,
            serializedData: structuredDataInstance,
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
            & govn.StructuredDataInstanceSupplier
            & govn.NatureSupplier<
              govn.MediaTypeNature<govn.SerializedDataSupplier>
            >
            & govn.RouteSupplier = {
              imported,
              nature: nature.jsonContentNature,
              route:
                route.isRouteSupplier(exports) && route.isRoute(exports.route)
                  ? exports.route
                  : { ...we.route, nature: nature.jsonContentNature },
              structuredDataInstance: defaultValue,
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
