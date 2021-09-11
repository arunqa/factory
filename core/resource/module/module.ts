import { safety } from "../../deps.ts";
import * as govn from "../../../governance/mod.ts";
import * as nature from "../../../core/std/nature.ts";
import * as fsrf from "../../originate/file-sys-globs.ts";
import * as route from "../../../core/std/route.ts";

export interface IssueHtmlResource
  extends
    govn.HtmlResource,
    govn.RouteSupplier,
    Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>>,
    Partial<govn.DiagnosticsSupplier> {
}

export const isModuleResource = safety.typeGuard<govn.ModuleResource>(
  "imported",
);

export interface FileSysResourceModuleConstructor {
  (
    we: fsrf.FileSysGlobWalkEntry<govn.ModuleResource>,
    options: route.FileSysRouteOptions,
    imported: govn.ExtensionModule,
  ): Promise<govn.ModuleResource>;
}

export function isModuleConstructor(
  o: unknown,
): o is FileSysResourceModuleConstructor {
  if (typeof o === "function") return true;
  return false;
}

export function moduleFileSysResourceFactory(
  refine?: govn.ResourceRefinery<govn.ModuleResource>,
): fsrf.FileSysGlobWalkEntryFactory<govn.ModuleResource> {
  return {
    construct: async (we, options) => {
      const imported = await options.extensionsManager.importModule(we.path);
      const issue = (diagnostics: string) => {
        const result: govn.ModuleResource & IssueHtmlResource = {
          route: { ...we.route, nature: nature.htmlContentNature },
          nature: nature.htmlContentNature,
          frontmatter: {},
          diagnostics,
          imported,
          html: {
            // deno-lint-ignore require-await
            text: async () => Deno.readTextFile(we.path),
            textSync: () => Deno.readTextFileSync(we.path),
          },
        };
        options.log.error(diagnostics, imported.importError);
        return result;
      };

      if (imported.isValid) {
        // deno-lint-ignore no-explicit-any
        const constructor = (imported.module as any).default;
        if (isModuleConstructor(constructor)) {
          const instance = await constructor(we, options, imported);
          if (isModuleResource(instance)) {
            return instance;
          } else {
            return issue(
              `Valid module with default function that does not construct a resource which passes isModuleResource(instance) guard`,
            );
          }
        } else {
          return issue(
            `Valid module with invalid default (must be a function not ${typeof constructor})`,
          );
        }
      } else {
        return issue("Invalid Module: " + imported.importError);
      }
    },
    refine,
  };
}
