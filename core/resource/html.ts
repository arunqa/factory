import * as govn from "../../governance/mod.ts";
import * as c from "../../core/std/content.ts";
import * as fm from "../../core/std/frontmatter.ts";
import * as route from "../../core/std/route.ts";
import * as nature from "../../core/std/nature.ts";
import * as fsrf from "../originate/file-sys-globs.ts";

export interface StaticHtmlResource
  extends
    govn.HtmlSupplier,
    govn.NatureSupplier<
      & govn.MediaTypeNature<govn.HtmlSupplier>
      & govn.FileSysPersistenceSupplier<govn.HtmlResource>
    >,
    govn.RouteSupplier,
    Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>>,
    Partial<govn.DiagnosticsSupplier> {
}

export const constructResourceSync: (
  we: fsrf.FileSysGlobWalkEntry<StaticHtmlResource>,
  options: route.FileSysRouteOptions,
) => StaticHtmlResource = (origination, options) => {
  const result:
    & StaticHtmlResource
    & govn.FrontmatterConsumer<govn.UntypedFrontmatter>
    & govn.RouteSupplier
    & govn.ParsedRouteConsumer = {
      nature: nature.htmlContentNature,
      frontmatter: {},
      route: { ...origination.route, nature: nature.htmlContentNature },
      consumeParsedFrontmatter: (parsed) => {
        if (!parsed.error) {
          // we're going to mutate this object directly and not make a copy
          if (typeof result.html !== "string") {
            c.mutateFlexibleContent(result.html, parsed.content);
          }

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
      consumeParsedRoute: (rs) => {
        if (route.isParsedRouteConsumer(origination)) {
          // give the originator the first shot
          return origination.consumeParsedRoute(rs);
        } else {
          // we already have a route so try to mutate it based on the given
          // instructions because the originator doesn't care
          return result.route.consumeParsedRoute(rs);
        }
      },
      html: {
        // deno-lint-ignore require-await
        text: async () => Deno.readTextFile(origination.path),
        textSync: () => Deno.readTextFileSync(origination.path),
      },
    };
  return result;
};

export function staticHtmlFileSysResourceFactory(
  refine?: govn.ResourceRefinery<StaticHtmlResource>,
): fsrf.FileSysGlobWalkEntryFactory<StaticHtmlResource> {
  return {
    // deno-lint-ignore require-await
    construct: async (we, options) => constructResourceSync(we, options),
    refine,
  };
}
