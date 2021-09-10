import * as govn from "../../../governance/mod.ts";
import * as fsrf from "../../factory/file-sys-globs.ts";
import * as route from "../../../core/std/route.ts";

export interface FileSysResourceHtmlModuleConstructor {
  (
    we: fsrf.FileSysGlobWalkEntry<govn.ModuleResource>,
    options: route.FileSysRouteOptions,
    imported: govn.ExtensionModule,
  ): Promise<
    & govn.ModuleResource
    & govn.HtmlResource
    & Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>>
  >;
}

export interface FileSysResourceHtmlModulesConstructor {
  (
    we: fsrf.FileSysGlobWalkEntry<govn.ModuleResource>,
    options: route.FileSysRouteOptions,
    imported: govn.ExtensionModule,
  ): Promise<
    & govn.ModuleResource
    & govn.ChildResourcesFactoriesSupplier<govn.HtmlResource>
  >;
}
