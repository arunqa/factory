import { fs } from "../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as c from "../../core/std/content.ts";
import * as n from "../../core/std/nature.ts";
import * as p from "../../core/std/persist.ts";
import * as fm from "../../core/std/frontmatter.ts";
import * as route from "../../core/std/route.ts";
import * as nature from "../../core/std/nature.ts";
import * as fsrf from "../originate/file-sys-globs.ts";
import * as extn from "../../lib/module/mod.ts";

export interface MarkdownModel extends govn.ContentModel {
  readonly isMarkdownModel: true;
}

export interface MarkdownResource<Model extends MarkdownModel = MarkdownModel>
  extends
    govn.TextSupplier,
    govn.TextSyncSupplier,
    govn.NatureSupplier<
      & govn.MediaTypeNature<govn.TextSupplier & govn.TextSyncSupplier>
      & govn.FileSysPersistenceSupplier<MarkdownResource>
    >,
    govn.RouteSupplier,
    govn.ModelSupplier<Model>,
    Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>>,
    Partial<govn.DiagnosticsSupplier> {
}

export const markdownMediaTypeNature: govn.MediaTypeNature<MarkdownResource> = {
  mediaType: "text/markdown",
  guard: (o: unknown): o is MarkdownResource => {
    if (
      nature.isNatureSupplier(o) && nature.isMediaTypeNature(o.nature) &&
      o.nature.mediaType === markdownMediaTypeNature.mediaType &&
      (c.isTextSupplier(o) && c.isTextSyncSupplier(o))
    ) {
      return true;
    }
    return false;
  },
};

export const markdownContentNature:
  & govn.MediaTypeNature<MarkdownResource>
  & govn.TextSuppliersFactory
  & govn.HtmlSuppliersFactory
  & govn.FileSysPersistenceSupplier<MarkdownResource>
  & govn.RenderTargetsSupplier<govn.MediaTypeNature<govn.HtmlResource>> = {
    mediaType: markdownMediaTypeNature.mediaType,
    guard: markdownMediaTypeNature.guard,
    prepareText: nature.prepareText,
    prepareHTML: nature.prepareHTML,
    renderTargets: [n.htmlContentNature],
    persistFileSysRefinery: (rootPath, namingStrategy, eventsEmitter) => {
      return async (resource) => {
        if (c.isHtmlSupplier(resource)) {
          await p.persistResourceFile(
            resource,
            resource.html,
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
      if (c.isHtmlSupplier(resource)) {
        await p.persistResourceFile(
          resource,
          resource.html,
          namingStrategy(resource, rootPath),
          { ensureDirSync: fs.ensureDirSync, eventsEmitter },
        );
      }
    },
  };

export const constructStaticMarkdownResourceSync: (
  we: fsrf.FileSysGlobWalkEntry<MarkdownResource>,
  options: route.FileSysRouteOptions,
) => MarkdownResource = (origination, options) => {
  const nature = markdownContentNature;
  const result:
    & MarkdownResource
    & govn.FrontmatterConsumer<govn.UntypedFrontmatter>
    & govn.RouteSupplier
    & govn.ParsedRouteConsumer = {
      nature,
      frontmatter: {},
      route: {
        ...origination.route,
        nature,
      },
      model: {
        isContentModel: true,
        isContentAvailable: true,
        isMarkdownModel: true,
      },
      consumeParsedFrontmatter: (parsed) => {
        if (!parsed.error) {
          // Assume frontmatter is the content's header, which has been parsed
          // so the text after the frontmatter needs to become our new content.
          // We're going to mutate this object directly and not make a copy.
          c.mutateFlexibleContent(result, parsed.content);

          // if the originator wants to override anything, give them a chance
          const frontmatter = fm.isFrontmatterConsumer(origination)
            ? origination.consumeParsedFrontmatter(parsed)
            : parsed.frontmatter;
          if (frontmatter) {
            // deno-lint-ignore no-explicit-any
            (result as any).frontmatter = frontmatter;
            result.consumeParsedRoute(frontmatter);
          }
        } else {
          const diagnostics =
            `Frontmatter parse error in ${origination.ownerFileSysPath} (${origination.glob.glob}) ${origination.path}: ${parsed.error}`;
          // deno-lint-ignore no-explicit-any
          (result as any).diagnostics = diagnostics;
          options.log.error(diagnostics, { origination, parsed });
        }
        return parsed.frontmatter;
      },
      consumeParsedRoute: (pr) => {
        return result.route.consumeParsedRoute(pr);
      },
      // deno-lint-ignore require-await
      text: async () => Deno.readTextFile(origination.path),
      textSync: () => Deno.readTextFileSync(origination.path),
    };
  return result;
};

export function staticMarkdownFileSysResourceFactory(
  refine?: govn.ResourceRefinery<MarkdownResource>,
): fsrf.FileSysGlobWalkEntryFactory<MarkdownResource> {
  return {
    // deno-lint-ignore require-await
    construct: async (we, log) => constructStaticMarkdownResourceSync(we, log),
    refine,
  };
}

export const constructMarkdownModuleResourceSync: (
  we: fsrf.FileSysGlobWalkEntry<MarkdownResource>,
  content: string,
  frontmatter: extn.UntypedExports,
  options: route.FileSysRouteOptions,
) => MarkdownResource = (origination, content, frontmatter) => {
  const nature = markdownContentNature;
  const result:
    & MarkdownResource
    & govn.RouteSupplier = {
      nature,
      frontmatter,
      route: {
        ...origination.route,
        nature,
      },
      model: {
        isContentModel: true,
        isContentAvailable: true,
        isMarkdownModel: true,
      },
      // deno-lint-ignore require-await
      text: async () => content,
      textSync: () => content,
    };
  return result;
};

export function markdownModuleFileSysResourceFactory(
  refine?: govn.ResourceRefinery<MarkdownResource>,
): fsrf.FileSysGlobWalkEntryFactory<MarkdownResource> {
  return {
    construct: async (we, options) => {
      const nature = markdownContentNature;
      const model: MarkdownModel = {
        isContentModel: true,
        isContentAvailable: true,
        isMarkdownModel: true,
      };
      const imported = await options.extensionsManager.importModule(we.path);
      const issue = (diagnostics: string, ...args: unknown[]) => {
        options.log.error(diagnostics, ...args);
        const result:
          & govn.ModuleResource
          & MarkdownResource
          & govn.RouteSupplier = {
            imported,
            nature,
            route: { ...we.route, nature },
            model,
            // deno-lint-ignore require-await
            text: async () => diagnostics,
            textSync: () => diagnostics,
          };
        return result;
      };

      if (imported.isValid) {
        // deno-lint-ignore no-explicit-any
        const defaultValue = (imported.module as any).default;
        if (defaultValue) {
          const frontmatter = imported.exports();
          const result:
            & govn.ModuleResource
            & MarkdownResource
            & govn.RouteSupplier = {
              imported,
              frontmatter,
              nature,
              route: route.isRouteSupplier(frontmatter) &&
                  route.isRoute(frontmatter.route)
                ? frontmatter.route
                : { ...we.route, nature },
              model: {
                isContentModel: true,
                isContentAvailable: true,
                isMarkdownModel: true,
              },
              // deno-lint-ignore require-await
              text: async () => defaultValue,
              textSync: () => defaultValue,
            };
          return result;
        } else {
          return issue("Markdown module has no default value");
        }
      } else {
        return issue(
          "Invalid Markdown Module " + imported.importError,
          imported.importError,
        );
      }
    },
    refine,
  };
}
