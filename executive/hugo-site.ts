import { path, safety } from "../deps.ts";
import * as govn from "../governance/mod.ts";
import * as r from "../core/std/resource.ts";
import * as n from "../core/std/nature.ts";
import * as m from "../core/std/model.ts";
import * as render from "../core/std/render.ts";
import * as fsg from "../core/originate/file-sys-globs.ts";
import * as publ from "./publication.ts";
import * as mdDS from "../core/render/markdown/mod.ts";
import * as rt from "../core/std/route.ts";
import * as fm from "../core/std/frontmatter.ts";
import * as md from "../core/resource/markdown.ts";
import * as c from "../core/std/content.ts";
import * as lds from "../core/design-system/lightning/mod.ts";
import * as tfsg from "../core/originate/typical-file-sys-globs.ts";
import * as obsC from "../core/content/observability.ts";
import * as ldsObsC from "../core/design-system/lightning/content/observability.r.ts";
import * as sqlObsC from "../lib/db/observability.r.ts";

export interface HugoWeightSupplier {
  readonly weight: number;
}

/**
 * Hugo-style page weight sorting comparator
 * @param a The left tree node
 * @param b The right tree node
 * @returns 0 if weights are equal, +1 or -1 for sort order
 */
const orderByWeight: (
  a: govn.RouteTreeNode & Partial<HugoWeightSupplier>,
  b: govn.RouteTreeNode & Partial<HugoWeightSupplier>,
) => number = (a, b) => {
  const weightA = a.weight;
  const weightB = b.weight;

  if (weightA && weightB) return weightA - weightB;
  if (weightA && !weightB) return -1;
  if (!weightA && weightB) return 1;
  return 0; // order doesn't matter if no weight
};

export interface HugoUnderscoreIndex extends govn.RouteUnit {
  readonly isHugoUnderscoreIndex: true;
}

/**
 * Parses hugo-style '_index.*' routes and defaults unit to 'index'.
 * @param base the underlying parser to use
 * @returns
 */
export function hugoRouteParser(
  base: rt.FileSysRouteParser,
): rt.FileSysRouteParser {
  return (fsp, ca) => {
    const hfpfsr = base(fsp, ca);
    const isHugoUnderscoreIndex = hfpfsr.parsedPath.name === "_index";
    if (isHugoUnderscoreIndex) {
      const parentName = path.basename(hfpfsr.parsedPath.dir);
      const routeUnit: HugoUnderscoreIndex = {
        unit: "index",
        label: parentName && parentName.length > 0
          ? c.humanFriendlyPhrase(parentName)
          : "Index",
        isHugoUnderscoreIndex,
      };
      return {
        parsedPath: hfpfsr.parsedPath,
        routeUnit,
      };
    }
    return hfpfsr;
  };
}

export const isHugoUnderscoreIndex = safety.typeGuard<HugoUnderscoreIndex>(
  "isHugoUnderscoreIndex",
);

/**
 * Originate Hugo style markdown files that are just like normal Markdown except
 * _index.md is treated special using hugoRouteParser().
 * @param mdrs The Markdown rendering strategy that will convert *.md to HTML
 * @returns single glob object that can be fed to orignators
 */
export function hugoMarkdownFileSysGlob(
  mdrs: mdDS.MarkdownRenderStrategy,
): fsg.FileSysPathGlob<md.MarkdownResource> {
  return {
    glob: "**/*.md",
    routeParser: hugoRouteParser(
      rt.humanFriendlyFileSysRouteParser,
    ),
    factory: md.markdownFileSysResourceFactory(
      // deno-lint-ignore no-explicit-any
      r.pipelineUnitsRefinerySync<any>(
        fm.prepareFrontmatterSync(fm.yamlMarkdownFrontmatterRE),
        mdrs.rendererSync(),
      ),
    ),
  };
}

/**
 * Originate Hugo style markdown files from content path.
 * @param mdrs The Markdown rendering strategy that will convert *.md to HTML
 * @returns multiple file system paths object that can be fed to orignators
 */
export function hugoMarkdownFileSysGlobs(
  originRootPath: fsg.FileSysPathText,
  mdrs: mdDS.MarkdownRenderStrategy,
): fsg.FileSysPaths<md.MarkdownResource> {
  return {
    humanFriendlyName: "Hugo Markdown Content",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `Hugo Markdown Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [hugoMarkdownFileSysGlob(mdrs)],
    }],
  };
}

export class HugoRoutes extends publ.PublicationRoutes {
  constructor(readonly contextBarLevel = 1) {
    super();
  }

  /**
   * Inject Hugo-style page weights, menu attributes into routes and handle
   * special _index.md handling.
   * @param resource The Markdown or any other potential Frontmatter Supplier
   * @param rs The route supplier whose route will be mutated
   */
  mutateRoute<Resource>(resource: Resource, rs: govn.RouteSupplier): void {
    const terminal = rs.route.terminal;
    if (terminal && fm.isFrontmatterSupplier(resource)) {
      // deno-lint-ignore no-explicit-any
      const terminalUntyped = terminal as any;
      const fmUntyped = resource.frontmatter;
      // deno-lint-ignore no-explicit-any
      const menu = fmUntyped.menu as any;
      const terminalWeight = fmUntyped.weight || menu?.main?.weight;
      terminalUntyped.weight = terminalWeight;
      if (terminal.level == this.contextBarLevel && menu?.main?.name) {
        terminalUntyped.isContextBarRouteNode = menu.main.name;
      }

      if (isHugoUnderscoreIndex(terminalUntyped)) {
        const route = rs.route;
        // in Hugo, an _index.md controls the parent of the current node so
        // let's mimic that behavior
        const unitsLen = route.units.length;
        if (unitsLen > 1) {
          // deno-lint-ignore no-explicit-any
          const parent = route.units[unitsLen - 2] as any;
          parent.label = terminal.label;
          parent.weight = terminalWeight;
        }

        // console.log(
        //   terminal.qualifiedPath,
        //   rtree.isRouteTreeNode(rs),
        //   c.isContentModelSupplier(rs),
        //   (rs as any).model?.isContentAvailable,
        //   (rs as any).parent?.children?.length,
        // );
        // if (
        //   rtree.isRouteTreeNode(rs) && c.isContentModelSupplier(rs) &&
        //   !rs.model.isContentAvailable && rs.parent &&
        //   rs.parent.children.length > 0
        // ) {
        //   // if we're setting up the route tree (which is normal) and there is
        //   // no content for this route, location should refer to the first child
        //   // with content not the empty _index route
        //   // deno-lint-ignore no-explicit-any
        //   (terminalUntyped as any).location = (
        //     baseOrOptions?: string | govn.RouteLocationOptions,
        //   ) => rt.routeNodeLocation(rs.parent!.children[0], baseOrOptions);
        //   console.log(
        //     "redirect",
        //     rs.qualifiedPath,
        //     "to",
        //     rs.parent.children[0].qualifiedPath,
        //   );
        // }
      }
    }
  }

  routeConsumerSync(): govn.ResourceRefinerySync<
    govn.RouteSupplier<govn.RouteNode>
  > {
    return (resource) => {
      if (rt.isRouteSupplier(resource)) {
        const node = this.allRoutes.consumeRoute(resource);
        if (node) {
          const terminal = node.route?.terminal;
          if (terminal) {
            if (
              fm.isFrontmatterSupplier(resource) && resource.frontmatter.title
            ) {
              // deno-lint-ignore no-explicit-any
              (terminal as any).label = resource.frontmatter.title;
            }
          }
          if (m.isModelSupplier(resource)) {
            m.referenceModel(resource, node);
            if (rt.isRouteSupplier(node)) {
              m.referenceModel(resource, node.route);
              this.mutateRoute(resource, node);
            }
          }
        }
      }
      return resource;
    };
  }

  prepareNavigation() {
    this.allRoutes.consumeAliases();
    this.navigationTree.consumeTree(
      this.allRoutes,
      (node) => {
        if (node.level < this.contextBarLevel) return false;
        if (node.level == this.contextBarLevel && node.route?.terminal) {
          // this.mutateRoute adds .isContextBarRouteNode to node.route
          if (lds.isContextBarRouteNode(node.route.terminal)) {
            if (node.route.terminal.isContextBarRouteNode) return true;
          }
          if (
            // TODO: this should only "appear" (uncloaked) when running in
            // non-production environment so add ability to check at runtime
            // in ClientCargo for hostname (e.g. devl.* or *.experimental*)
            // and only show this if context is valid (otherwise it should be
            // cloaked)
            ["Observability", "Control Panel"].find((label) =>
              node.route?.terminal?.label == label
            )
          ) {
            return true;
          }
          return false;
        }
        return render.isRenderableMediaTypeResource(
            node.route,
            n.htmlMediaTypeNature.mediaType,
          )
          ? true
          : false;
      },
      orderByWeight,
    );
  }
}

export class HugoSite extends publ.TypicalPublication {
  constructor(config: publ.Configuration) {
    super(config, new HugoRoutes());
  }

  // deno-lint-ignore no-explicit-any
  originators(): govn.ResourcesFactoriesSupplier<any>[] {
    const fsgoWatcher = new fsg.FileSysGlobsOriginatorEventEmitter();
    // deno-lint-ignore require-await
    fsgoWatcher.on("beforeYieldWalkEntry", async (we) => {
      // if we "consumed" (handled) the resource it means we do not want it to
      // go to the destination directory so let's track it
      this.consumedFileSysWalkPaths.add(we.path);
    });
    return [
      // deno-lint-ignore no-explicit-any
      new fsg.FileSysGlobsOriginator<any>(
        [
          // process modules first so that if there are any proxies or other
          // generated content, it can be processed but the remaining originators
          tfsg.moduleFileSysGlobs(this.config.contentRootPath),
          hugoMarkdownFileSysGlobs(
            this.config.contentRootPath,
            this.markdownRenderers(),
          ),
          tfsg.htmlFileSysGlobs(this.config.contentRootPath),
        ],
        this.config.extensionsManager,
        {
          eventEmitter: () => fsgoWatcher,
        },
      ),
      ldsObsC.observabilityResources(obsC.observabilityRoute),
      sqlObsC.observabilityResources(obsC.observabilityRoute),
    ];
  }
}
