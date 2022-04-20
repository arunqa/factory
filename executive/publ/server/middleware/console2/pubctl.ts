import { path } from "../../../../../core/deps.ts";
import * as rfGovn from "../../../../../governance/mod.ts";
import * as rfStd from "../../../../../core/std/mod.ts";
import * as publ from "../../../mod.ts";

import * as safety from "../../../../../lib/safety/mod.ts";
import * as module from "../../../../../lib/module/mod.ts";

import * as ds from "../../../../../core/render/html/mod.ts";
import * as lds from "../../../../../core/design-system/lightning/mod.ts";

// deno-lint-ignore no-empty-interface
export interface SiteOperationalContext
  extends publ.PublicationOperationalContext {
}

const pubCtlHome = path.dirname(import.meta.url).substring("file://".length);
const pubCtlSupplier = publ.typicalPublicationCtlSupplier<
  publ.PublicationOperationalContext
>(
  (relative, abs) =>
    abs
      ? path.join(Deno.cwd(), relative)
      : path.join(path.relative(Deno.cwd(), pubCtlHome), relative),
  (oc) => oc, // we're not enhancing, just adding type-safety,
);
const pubCtl = await pubCtlSupplier();

export class SiteConfiguration
  extends publ.Configuration<publ.PublicationOperationalContext> {
  constructor(operationalCtx: publ.PublicationOperationalContext) {
    super({
      operationalCtx,
      contentRootPath: pubCtl.modulePath("content"),
      destRootPath: pubCtl.modulePath("public"),
      extensionsManager: new module.ReloadableCachedExtensions(),
    });
  }
}

export interface VisualCuesFrontmatter {
  readonly "syntax-highlight": "highlight.js";
}

export const isVisualCuesFrontmatter = safety.typeGuard<VisualCuesFrontmatter>(
  "syntax-highlight",
);

export const isVisualCuesFrontmatterSupplier = safety.typeGuard<
  { "visual-cues": VisualCuesFrontmatter }
>("visual-cues");

export class SiteDesignSystem implements lds.LightningDesignSystemFactory {
  readonly designSystem: lds.LightingDesignSystem<lds.LightningLayout>;
  readonly contentStrategy: lds.LightingDesignSystemContentStrategy;

  constructor(
    config: publ.Configuration<SiteOperationalContext>,
    routes: publ.PublicationRoutes,
  ) {
    this.designSystem = new lds.LightingDesignSystem(
      config.extensionsManager,
      "/universal-cc",
    );
    this.contentStrategy = {
      git: config.contentGit,
      layoutText: new lds.LightingDesignSystemText(),
      navigation: new lds.LightingDesignSystemNavigation(
        true,
        routes.navigationTree,
      ),
      assets: this.designSystem.assets(),
      branding: {
        contextBarSubject: config.appName,
        contextBarSubjectImageSrc: (assets) =>
          assets.image("/asset/image/brand/logo-icon-100x100.png"),
      },
      mGitResolvers: config.mGitResolvers,
      routeGitRemoteResolver: config.routeGitRemoteResolver,
      renderedAt: new Date(),
      wsEditorResolver: config.wsEditorResolver,
      wsEditorRouteResolver: config.wsEditorResolver
        ? rfStd.defaultRouteWorkspaceEditorResolver(
          config.wsEditorResolver,
        )
        : undefined,
      initContributions: (layout) => {
        const suggested = layout.designSystem.contributions();
        if (layout.frontmatter) {
          return this.frontmatterInitContribs(layout, suggested);
        }
        suggested.scripts.aft
          `<script src="/script/social-proof-wc/social-proof.js"></script>`;
        return suggested;
      },
      termsManager: config.termsManager,
      operationalCtxClientCargo: {
        acquireFromURL: "/operational-context/index.json",
        assetsBaseAbsURL: "/operational-context",
      },
    };
  }

  frontmatterInitContribs(
    layout: Omit<lds.LightningLayout, "contributions">,
    suggested: ds.HtmlLayoutContributions,
  ): ds.HtmlLayoutContributions {
    if (layout.frontmatter) {
      if (isVisualCuesFrontmatterSupplier(layout.frontmatter)) {
        const visualCues = layout.frontmatter?.["visual-cues"];
        if (isVisualCuesFrontmatter(visualCues)) {
          const highlighter = visualCues["syntax-highlight"];
          switch (highlighter) {
            case "highlight.js":
              suggested.stylesheets.aft
                `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/default.min.css">`;
              suggested.scripts.aft
                `<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/highlight.min.js"></script>`;
              suggested.body.aft`<script>hljs.highlightAll();</script>`;
              break;
            default:
              // TODO: report as lint diagnostic or some other way
              console.error(
                `Frontmatter "visual-cues"."syntax-highlighter" is invalid type: "${highlighter}" in ${layout
                  .activeRoute?.terminal?.qualifiedPath}`,
              );
          }
        }
      }
    }
    return suggested;
  }
}

export class GpmResourcesTree extends publ.ResourcesTree {
}

export class GpmRoutes extends publ.PublicationRoutes {
  constructor(
    readonly config: SiteConfiguration,
    readonly routeFactory: rfGovn.RouteFactory,
    readonly contextBarLevel = 1,
  ) {
    super(routeFactory, new GpmResourcesTree(routeFactory));
  }

  prepareNavigationTree() {
    this.resourcesTree.consumeAliases();
    this.navigationTree.consumeTree(
      this.resourcesTree,
      (node) => {
        if (
          lds.isNavigationTreeContextBarNode(node) && node.isContextBarRouteNode
        ) {
          return true;
        }
        if (node.level < this.contextBarLevel) return false;
        return rfStd.isRenderableMediaTypeResource(
            node.route,
            rfStd.htmlMediaTypeNature.mediaType,
          )
          ? true
          : false;
      },
    );
  }
}

export class Site extends publ.TypicalPublication<SiteOperationalContext> {
  constructor(config: SiteConfiguration, readonly contextBarLevel = 1) {
    super(
      config,
      new GpmRoutes(config, config.fsRouteFactory, contextBarLevel),
    );
  }

  constructDesignSystem(
    config: publ.Configuration<SiteOperationalContext>,
    routes: publ.PublicationRoutes,
  ) {
    return new SiteDesignSystem(config, routes);
  }
}

export class SiteExecutive extends publ.Executive<SiteOperationalContext> {
  constructor() {
    super(pubCtl, [new Site(new SiteConfiguration(pubCtl.operationalCtx))]);
  }
}

const executive = new SiteExecutive();
await executive.publish();
executive.cleanup();
