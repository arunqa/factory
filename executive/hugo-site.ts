import { path } from "../deps.ts";
import * as govn from "../governance/mod.ts";
import * as r from "../core/std/resource.ts";
import * as n from "../core/std/nature.ts";
import * as m from "../core/std/model.ts";
import * as rtree from "../core/std/route-tree.ts";
import * as render from "../core/std/render.ts";
import * as fsg from "../core/factory/file-sys-globs.ts";
import * as persist from "../core/std/persist.ts";
import * as publ from "./publication.ts";
import * as mdDS from "../core/render/markdown/mod.ts";
import * as route from "../core/std/route.ts";
import * as fm from "../core/std/frontmatter.ts";
import * as md from "../core/resource/markdown.ts";
import * as c from "../core/std/content.ts";
import * as lds from "../core/design-system/lightning/mod.ts";
import * as ldsDirec from "../core/design-system/lightning/directive/mod.ts";
import * as jrs from "../core/render/json.ts";
import * as tfsg from "../core/factory/typical-file-sys-globs.ts";
import * as obsC from "../core/content/observability.ts";
import * as ldsObsC from "../core/design-system/lightning/content/observability.r.ts";
import * as redirectC from "../core/design-system/lightning/content/redirects.r.ts";
import * as sqlObsC from "../lib/db/observability.r.ts";

const orderByWeight: (a: govn.RouteTreeNode, b: govn.RouteTreeNode) => number =
  (a, b) => {
    // deno-lint-ignore no-explicit-any
    const weightA = (a as any).weight;
    // deno-lint-ignore no-explicit-any
    const weightB = (b as any).weight;

    if (weightA && weightB) return weightA - weightB;
    if (weightA && !weightB) return -1;
    if (!weightA && weightB) return 1;
    return 0; // order doesn't matter if no weight
  };

/**
 * Parses hugo-style '_index.*' routes and defaults unit to 'index'.
 * @param base the underlying parser to use
 * @returns
 */
export function hugoRouteParser(
  base: route.FileSysRouteParser,
): route.FileSysRouteParser {
  return (fsp, ca) => {
    const hfpfsr = base(fsp, ca);
    const isUnderscoreIndex = hfpfsr.parsedPath.name === "_index";
    if (isUnderscoreIndex) {
      const parentName = path.basename(hfpfsr.parsedPath.dir);
      return {
        parsedPath: hfpfsr.parsedPath,
        routeUnit: {
          unit: "index",
          label: parentName && parentName.length > 0
            ? c.humanFriendlyPhrase(parentName)
            : "Index",
          isUnderscoreIndex,
        },
      };
    }
    return hfpfsr;
  };
}

export const contextBarLevel = 1;

export function hugoMarkdownFileSysGlob(
  mdrs: mdDS.MarkdownRenderStrategy,
): fsg.FileSysPathGlob<md.MarkdownResource> {
  return {
    glob: "**/*.md",
    routeParser: hugoRouteParser(
      route.humanFriendlyFileSysRouteParser,
    ),
    factory: md.markdownFileSysResourceFactory(
      // deno-lint-ignore no-explicit-any
      r.pipelineUnitsRefinerySync<any>(
        fm.prepareFrontmatterSync(fm.yamlMarkdownFrontmatterRE),
        (resource) => {
          const mdr = resource as md.MarkdownResource;
          if (mdr.route.terminal) {
            // deno-lint-ignore no-explicit-any
            const terminal = mdr.route.terminal as any;

            if (mdr.frontmatter?.title) {
              // Hugo pages have title as their page labels
              terminal.label = mdr.frontmatter.title;
            }
            // deno-lint-ignore no-explicit-any
            const menu = mdr.frontmatter?.menu as any;
            terminal.weight = mdr.frontmatter?.weight || menu?.main?.weight;
            if (terminal.level == contextBarLevel && menu?.main?.name) {
              terminal.isContextBarRouteNode = menu.main.name;
            }

            // underscoreIndexRouteParser adds .isUnderscoreIndex
            if (terminal.isUnderscoreIndex) {
              // in Hugo, an _index.md controls the parent of the current node
              // so let's mimic that behavior
              const unitsLen = mdr.route.units.length;
              if (unitsLen > 1) {
                // deno-lint-ignore no-explicit-any
                const parent = mdr.route.units[unitsLen - 2] as any;
                parent.label = mdr.route.terminal.label;
                parent.weight = terminal.weight;
              }
            }
          }
          return resource;
        },
        mdrs.rendererSync(),
      ),
    ),
  };
}

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

export class HugoSite implements publ.Publication {
  readonly consumedFileSysWalkPaths = new Set<string>();
  constructor(readonly config: publ.Configuration) {
  }

  async mirrorUnconsumedAssets() {
    await Promise.all([
      this.config.lightningDS.symlinkAssets(this.config.destRootPath),
      persist.symlinkAssets(
        this.config.contentRootPath,
        this.config.destRootPath,
        {
          glob: "**/*",
          options: { exclude: ["**/*.ts"] },
          include: (we) =>
            we.isFile && !this.consumedFileSysWalkPaths.has(we.path),
        },
      ),
      persist.symlinkDirectoryChildren(
        path.join(this.config.staticAssetsRootPath),
        path.join(this.config.destRootPath),
      ),
    ]);
  }

  directiveExpectationsSupplier():
    | govn.DirectiveExpectationsSupplier<
      // deno-lint-ignore no-explicit-any
      govn.DirectiveExpectation<any, string | undefined>
    >
    | undefined {
    return {
      allowedDirectives: () => [new ldsDirec.ToDoDirective()],
    };
  }

  markdownRenderers(): mdDS.MarkdownRenderStrategy {
    return new mdDS.MarkdownRenderStrategy(
      new mdDS.MarkdownLayouts({
        directiveExpectations: this.directiveExpectationsSupplier(),
        // TODO: replace all Hugo URL link-* shortcodes with this
        // rewriteURL: (parsedURL, renderEnv) => {
        //   console.log(parsedURL, Object.keys(renderEnv));
        //   return parsedURL;
        // },
      }),
    );
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

  async produce() {
    const allRoutes = new rtree.TypicalRouteTree();
    const navigation = new lds.LightingDesignSystemNavigation(
      true,
      new rtree.TypicalRouteTree(),
    );
    const assets = this.config.lightningDS.assets();
    const branding: lds.LightningBranding = {
      contextBarSubject: this.config.appName,
      contextBarSubjectImageSrc: (assets) =>
        assets.image("/assets/images/brand/logo-icon-100x100.png"),
    };

    // deno-lint-ignore no-explicit-any
    const urWatcher = new r.UniversalRefineryEventEmitter<any>();
    // deno-lint-ignore require-await
    urWatcher.on("beforeProduce", async () => {
      // After the navigation tree is built, mutate it to organize to only
      // accept HTML renderable pages sorted by Hugo page weights (each child
      // will be sorted by weight given in frontmatter).
      allRoutes.consumeAliases();
      navigation.routeTree.consumeTree(
        allRoutes,
        (node) => {
          if (node.level < contextBarLevel) return false;
          if (node.level == contextBarLevel && node.route?.terminal) {
            if (lds.isContextBarRouteNode(node.route.terminal)) {
              if (node.route.terminal.isContextBarRouteNode) return true;
            }
            if (
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
    });
    const creator = new r.UniversalRefinery(this.originators(), {
      construct: {
        // As each markdown or other resource/file is read and a
        // MarkdownResource or *Resource is constructed, track it for navigation
        // or other design system purposes. allRoutes is basically our sitemap.
        resourceRefinerySync: allRoutes.routeConsumerSync((rs, node) => {
          if (node && route.isRouteSupplier(node) && m.isModelSupplier(rs)) {
            // as we consume the routes, see if a model was produced; if it was,
            // put that model into the route so it can be used for navigation
            // and other design system needs; we don't want the design system to
            // focus on the content, but the behavior of the content structure
            m.referenceModel(rs, node.route);
          }
        }),
      },
      // These factories run during after initial construction of each resource
      // and beforeProduce event has been emitted. This allows resources that
      // only be known after initial construction is completed to be originated.
      preProductionOriginators: [redirectC.redirectResources(allRoutes)],
      produce: {
        // This resourceRefinery will be "executed" after all resources are
        // constructed so we render HTML using design system page renderer
        // and then persist each file to the file system.
        resourceRefinery: r.pipelineUnitsRefineryUntyped(
          this.config.lightningDS.prettyUrlsHtmlProducer(
            this.config.destRootPath,
            navigation,
            assets,
            branding,
          ),
          jrs.jsonProducer(this.config.destRootPath, { routeTree: allRoutes }),
        ),
      },
      eventEmitter: () => urWatcher,
    });

    // The above steps were all setup; nothing has actually been "executed" yet
    // but the creator.products() method now does all the work. First, all the
    // resources are constructed using the construct.resourceRefinerySync
    // and then preProductionOriginators will generate resources and then
    // produce.resourceRefinery will be executed for each constructed resource.
    // deno-lint-ignore no-empty
    for await (const _ of creator.products()) {
    }

    // any files that were not consumed should "mirrored" to the destination
    this.mirrorUnconsumedAssets();
  }
}
