import { govnSvcTelemetry as telem, log, path } from "../deps.ts";
import * as govn from "../governance/mod.ts";
import * as e from "../core/std/extension.ts";
import * as obs from "../core/std/observability.ts";
import * as r from "../core/std/resource.ts";
import * as n from "../core/std/nature.ts";
import * as m from "../core/std/model.ts";
import * as route from "../core/std/route.ts";
import * as rtree from "../core/std/route-tree.ts";
import * as fsg from "../core/originate/file-sys-globs.ts";
import * as tfsg from "../core/originate/typical-file-sys-globs.ts";
import * as lds from "../core/design-system/lightning/mod.ts";
import * as ldsDirec from "../core/design-system/lightning/directive/mod.ts";
import * as jrs from "../core/render/json.ts";
import * as persist from "../core/std/persist.ts";
import * as render from "../core/std/render.ts";
import * as obsC from "../core/content/observability.ts";
import * as redirectC from "../core/design-system/lightning/content/redirects.r.ts";
import * as ldsObsC from "../core/design-system/lightning/content/observability.r.ts";
import * as mdr from "../core/render/markdown/mod.ts";

export interface Preferences {
  readonly contentRootPath: fsg.FileSysPathText;
  readonly staticAssetsRootPath: fsg.FileSysPathText;
  readonly destRootPath: fsg.FileSysPathText;
  readonly appName: string;
}

export class Configuration implements Preferences {
  readonly telemetry: telem.Instrumentation = new telem.Telemetry();
  readonly extensionsManager = new e.CachedExtensions();
  readonly observability: obs.Observability;
  readonly lightningDS = new lds.LightingDesignSystem();
  readonly contentRootPath: fsg.FileSysPathText;
  readonly staticAssetsRootPath: fsg.FileSysPathText;
  readonly destRootPath: fsg.FileSysPathText;
  readonly appName: string;
  readonly logger: log.Logger;

  constructor(prefs: Preferences) {
    this.observability = new obs.Observability(
      new govn.ObservabilityEventsEmitter(),
    );
    this.contentRootPath = prefs.contentRootPath;
    this.staticAssetsRootPath = prefs.staticAssetsRootPath;
    this.destRootPath = prefs.destRootPath;
    this.appName = prefs.appName;
    this.logger = log.getLogger();
  }
}

export interface Publication {
  readonly produce: () => Promise<void>;
}

export class TypicalPublication implements Publication {
  readonly consumedFileSysWalkPaths = new Set<string>();
  constructor(readonly config: Configuration) {
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

  markdownRenderers(): mdr.MarkdownRenderStrategy {
    return new mdr.MarkdownRenderStrategy(
      new mdr.MarkdownLayouts({
        directiveExpectations: this.directiveExpectationsSupplier(),
      }),
    );
  }

  // deno-lint-ignore no-explicit-any
  originators(): govn.ResourcesFactoriesSupplier<any>[] {
    const originRootPath = this.config.contentRootPath;
    const watcher = new fsg.FileSysGlobsOriginatorEventEmitter();
    // deno-lint-ignore require-await
    watcher.on("beforeYieldWalkEntry", async (we) => {
      this.consumedFileSysWalkPaths.add(we.path);
    });
    return [
      // deno-lint-ignore no-explicit-any
      new fsg.FileSysGlobsOriginator<any>(
        [
          // process modules first so that if there are any proxies or other
          // generated content, it can be processed but the remaining originators
          tfsg.moduleFileSysGlobs(originRootPath),
          tfsg.markdownFileSysGlobs(originRootPath, this.markdownRenderers()),
          tfsg.htmlFileSysGlobs(originRootPath),
        ],
        this.config.extensionsManager,
        {
          eventEmitter: () => watcher,
        },
      ),
      ldsObsC.observabilityResources(obsC.observabilityRoute),
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
        assets.image("/images/brand/logo-icon-101x101.png"),
    };
    // deno-lint-ignore no-explicit-any
    const urWatcher = new r.UniversalRefineryEventEmitter<any>();
    // deno-lint-ignore require-await
    urWatcher.on("beforeProduce", async () => {
      // After the navigation tree is built, mutate it to organize by Hugo page
      // weights (each child will be sorted by weight given in frontmatter).
      allRoutes.consumeAliases();
      navigation.routeTree.consumeTree(
        allRoutes,
        (node) =>
          render.isRenderableMediaTypeResource(
              node.route,
              n.htmlMediaTypeNature.mediaType,
            )
            ? true
            : false,
      );
    });

    const creator = new r.UniversalRefinery(this.originators(), {
      // These refineries run during construction of each resource including
      // any child resources (navigation is captured here before applying any
      // rendering strategies).
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
      // These refineries run after construction is concluded and we want to
      // "produce" products ("rendering")
      produce: {
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

    // The UnversalRefinery will first construct all resources and child
    // resources recursively, then apply design system rendering and persist
    // resources as necessary.
    // deno-lint-ignore no-empty
    for await (const _ of creator.products()) {
    }

    // any files that were not consumed should "mirrored" to the destination
    this.mirrorUnconsumedAssets();
  }
}

export class Executive {
  constructor(readonly publications: Publication[]) {
  }

  async execute() {
    await Promise.all(
      this.publications.map((p) => p.produce()),
    );
  }
}
