import { fs } from "../../deps.ts";
import * as govn from "../../../governance/mod.ts";
import * as c from "../../../core/std/content.ts";
import * as fsrf from "../../originate/file-sys-globs.ts";
import * as route from "../../../core/std/route.ts";
import * as nature from "../../../core/std/nature.ts";
import * as p from "../../../core/std/persist.ts";
import * as safety from "../../../lib/safety/mod.ts";
import * as extn from "../../../lib/module/mod.ts";

export interface FileSysResourceBundleConstructor<State> {
  (
    we: fsrf.FileSysGlobWalkEntry<BundleResource>,
    options: route.FileSysRouteOptions,
    imported: extn.ExtensionModule,
    state: State,
  ): Promise<BundleResource>;
}

export interface BundleResource
  extends
    govn.TextSupplier,
    govn.TextSyncSupplier,
    govn.NatureSupplier<
      & govn.MediaTypeNature<govn.TextSupplier & govn.TextSyncSupplier>
      & govn.FileSysPersistenceSupplier<BundleResource>
    >,
    govn.RouteSupplier,
    Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>>,
    Partial<govn.DiagnosticsSupplier> {
  readonly isClientJavascriptBundle?: boolean;
}

export const isBundleResourceType = safety.typeGuard<BundleResource>(
  "nature",
  "text",
  "textSync",
  "isClientJavascriptBundle",
);

export function isBundleResource(o: unknown): o is BundleResource {
  if (isBundleResourceType(o)) {
    return o.isClientJavascriptBundle ? true : false;
  }
  return false;
}

export const bundleMediaTypeNature: govn.MediaTypeNature<BundleResource> = {
  mediaType: "text/javascript",
  guard: (o: unknown): o is BundleResource => {
    if (
      nature.isNatureSupplier(o) && nature.isMediaTypeNature(o.nature) &&
      o.nature.mediaType === bundleMediaTypeNature.mediaType &&
      (c.isTextSupplier(o) && c.isTextSyncSupplier(o))
    ) {
      return true;
    }
    return false;
  },
};

export const bundleContentNature:
  & govn.MediaTypeNature<govn.TextResource>
  & govn.TextSuppliersFactory
  & govn.FileSysPersistenceSupplier<BundleResource>
  & govn.RenderTargetsSupplier<govn.MediaTypeNature<govn.TextResource>> = {
    mediaType: bundleMediaTypeNature.mediaType,
    guard: bundleMediaTypeNature.guard,
    prepareText: nature.prepareText,
    renderTargets: [bundleMediaTypeNature],
    persistFileSysRefinery: (rootPath, namingStrategy, eventsEmitter) => {
      return async (resource) => {
        if (c.isTextSupplier(resource)) {
          await p.persistResourceFile(
            resource,
            resource,
            namingStrategy(resource, rootPath),
            { ensureDirSync: fs.ensureDirSync, eventsEmitter },
          );
        }
        return resource;
      };
    },
    persistFileSys: async (
      resource,
      rootPath,
      namingStrategy,
      eventsEmitter,
    ) => {
      if (c.isTextSupplier(resource)) {
        await p.persistResourceFile(
          resource,
          resource,
          namingStrategy(resource, rootPath),
          { ensureDirSync: fs.ensureDirSync, eventsEmitter },
        );
      }
    },
  };

export function bundleFileSysResourceFactory(
  isClientJavascriptBundle: boolean,
  refine?: govn.ResourceRefinery<BundleResource>,
): fsrf.FileSysGlobWalkEntryFactory<BundleResource> {
  return {
    construct: async (origination, options) => {
      // doing this will make PCII available at the server side
      const imported = await options.extensionsManager.importModule(
        origination.path,
      );
      let content = "// bundler did not run?";
      if (imported.isValid) {
        try {
          const { files, diagnostics } = await Deno.emit(origination.path, {
            bundle: "classic",
            compilerOptions: {
              lib: ["deno.unstable", "deno.window"],
            },
          });
          if (diagnostics.length) {
            content = Deno.formatDiagnostics(diagnostics);
          } else {
            content = files["deno:///bundle.js"];
          }
        } catch (e) {
          content = `// Error emitting ${origination.path}: ${e}`;
        }
      } else {
        content =
          `// Invalid Module ${origination.path}: ${imported.importError}`;
      }
      const nature = bundleContentNature;
      const result:
        & BundleResource
        & govn.RouteSupplier = {
          isClientJavascriptBundle,
          nature,
          route: {
            ...origination.route,
            nature,
          },
          // deno-lint-ignore require-await
          text: async () => content,
          textSync: () => content,
        };
      return result;
    },
    refine,
  };
}
