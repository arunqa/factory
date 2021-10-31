import {
  colors,
  fs,
  govnSvcHealth as health,
  govnSvcMetrics as gsm,
  govnSvcTelemetry as telem,
  log,
  path,
  safety,
} from "../../deps.ts";
import * as rfGovn from "../../governance/mod.ts";
import * as rfStd from "../../core/std/mod.ts";

import * as conf from "../../lib/conf/mod.ts";
import * as fsA from "../../lib/fs/fs-analytics.ts";
import * as fsT from "../../lib/fs/fs-tree.ts";
import * as fsLink from "../../lib/fs/link.ts";
import * as git from "../../lib/git/mod.ts";
import * as notif from "../../lib/notification/mod.ts";

import * as fsg from "../../core/originate/file-sys-globs.ts";
import * as tfsg from "../../core/originate/typical-file-sys-globs.ts";

import * as html from "../../core/render/html/mod.ts";
import * as jrs from "../../core/render/json.ts";
import * as tfr from "../../core/render/text.ts";
import * as dtr from "../../core/render/delimited-text.ts";
import * as mdr from "../../core/render/markdown/mod.ts";

import * as diagC from "../../core/content/diagnostic/mod.ts";
import * as redirectC from "../../core/content/redirects.rf.ts";

import * as sqlObsC from "../../lib/db/observability.rf.ts";
import * as cpC from "../../core/content/control-panel.ts";

export const assetMetricsWalkOptions: fs.WalkOptions = {
  skip: [/\.git/],
};

export interface Preferences<OperationalContext> {
  readonly operationalCtx?: OperationalContext;
  readonly contentRootPath: fsg.FileSysPathText;
  readonly destRootPath: fsg.FileSysPathText;
  readonly appName: string;
  readonly envVarNamesPrefix: string;
  readonly persistClientCargo: html.HtmlLayoutClientCargoPersister;
  readonly mGitResolvers: git.ManagedGitResolvers<string>;
  readonly routeGitRemoteResolver: rfGovn.RouteGitRemoteResolver<
    html.GitRemoteAnchor
  >;
  readonly routeLocationResolver?: rfStd.RouteLocationResolver;
  readonly rewriteMarkdownLink?: mdr.MarkdownLinkUrlRewriter;
  readonly assetsMetricsWalkers?: (
    config: Configuration<OperationalContext>,
  ) => fsT.FileSysAssetWalker[];
}

export class Configuration<OperationalContext>
  implements Omit<Preferences<OperationalContext>, "assetsMetricsWalkers"> {
  readonly operationalCtx?: OperationalContext;
  readonly telemetry: telem.Instrumentation = new telem.Telemetry();
  readonly metrics = new gsm.TypicalMetrics();
  readonly envVarNamesPrefix: string;
  readonly assetsMetricsWalkers: fsT.FileSysAssetWalker[];
  readonly git?: git.GitExecutive;
  readonly fsRouteFactory: rfStd.FileSysRouteFactory;
  readonly routeLocationResolver?: rfStd.RouteLocationResolver;
  readonly extensionsManager = new rfStd.CachedExtensions();
  readonly observabilityRoute: rfGovn.Route;
  readonly diagnosticsRoute: rfGovn.Route;
  readonly contentRootPath: fsg.FileSysPathText;
  readonly destRootPath: fsg.FileSysPathText;
  readonly appName: string;
  readonly logger: log.Logger;
  readonly mGitResolvers: git.ManagedGitResolvers<string>;
  readonly routeGitRemoteResolver: rfGovn.RouteGitRemoteResolver<
    html.GitRemoteAnchor
  >;
  readonly persistClientCargo: html.HtmlLayoutClientCargoPersister;
  readonly rewriteMarkdownLink?: mdr.MarkdownLinkUrlRewriter;

  constructor(prefs: Preferences<OperationalContext>) {
    this.operationalCtx = prefs.operationalCtx;
    this.mGitResolvers = prefs.mGitResolvers;
    this.git = git.discoverGitWorktreeExecutiveSync(
      prefs.contentRootPath,
      (gp) => new git.TypicalGit(gp, this.mGitResolvers),
    );
    this.contentRootPath = prefs.contentRootPath;
    this.persistClientCargo = prefs.persistClientCargo;
    this.destRootPath = prefs.destRootPath;
    this.appName = prefs.appName;
    this.logger = log.getLogger();
    this.routeGitRemoteResolver = prefs.routeGitRemoteResolver;
    this.routeLocationResolver = prefs.routeLocationResolver;
    this.fsRouteFactory = new rfStd.FileSysRouteFactory(
      this.routeLocationResolver || rfStd.defaultRouteLocationResolver(),
    );
    this.observabilityRoute = cpC.observabilityRoute(this.fsRouteFactory);
    this.diagnosticsRoute = cpC.diagnosticsRoute(this.fsRouteFactory);
    this.envVarNamesPrefix = prefs.envVarNamesPrefix;
    this.assetsMetricsWalkers = prefs.assetsMetricsWalkers
      ? prefs.assetsMetricsWalkers(this)
      : [{
        identity: "origin",
        root: this.contentRootPath,
        rootIsAbsolute: path.isAbsolute(this.contentRootPath),
        options: assetMetricsWalkOptions,
      }, {
        identity: "destination",
        root: this.destRootPath,
        rootIsAbsolute: path.isAbsolute(this.destRootPath),
        options: assetMetricsWalkOptions,
      }];
    this.rewriteMarkdownLink = prefs.rewriteMarkdownLink;
  }

  produceControlPanelContent(): boolean {
    return true;
  }

  mirrorUnconsumedAssets(): boolean {
    return true;
  }

  removeDestRootPath(): boolean {
    return true;
  }

  async initProduce() {
    // if we're running an experimental server, config will be subclassed and
    // might not want to remove dest root path on refresh
    if (this.removeDestRootPath()) {
      try {
        await Deno.remove(this.destRootPath, { recursive: true });
        console.warn(
          `Removed ${this.destRootPath} ${
            colors.gray("[Configuration.initProduce()]")
          }`,
        );
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    } else {
      console.warn(
        `Retained existing ${this.destRootPath} ${
          colors.gray("[Configuration.initProduce()]")
        }`,
      );
    }
  }
}

/**
 * Implement this interface in RouteUnit terminals when you want to do special
 * handling of routes when they are consumed and inserted into resourcesTree.
 */
export interface PublicationRouteEventsHandler<Context> {
  /**
   * Mutate the resource route before a route tree node is created. Context is
   * an arbitrary return value that can be used to pass into
   * prepareResourceTreeNode as necessary.
   * @param rs the resource, which has rs.route and all other resource content
   */
  readonly prepareResourceRoute?: (
    rs: rfGovn.RouteSupplier<rfGovn.RouteNode>,
  ) => Context;

  /**
   * Mutate the resource's route tree node after construction plus frontmatter
   * and model references have been added. When this event handler is called,
   * the route and route tree node are fully resolved. This event handler is
   * useful if the route tree node should be mutated based on the resource's
   * content, frontmatter, model, or any other business/presentation logic.
   * @param rs the resource
   * @param rtn the route tree node, if creation was successful
   * @param ctx if prepareResourceRoute was called before prepareResourceTreeNode, this is the Context
   */
  readonly prepareResourceTreeNode?: (
    rs: rfGovn.RouteSupplier<rfGovn.RouteNode>,
    rtn?: rfGovn.RouteTreeNode,
    ctx?: Context,
  ) => void;
}

export const isPublicationRouteEventsHandler = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  PublicationRouteEventsHandler<any>
>("prepareResourceRoute", "prepareResourceTreeNode");

export interface DiagnosticsOptionsSupplier {
  readonly metrics: { readonly assets: boolean };
  readonly renderers: boolean;
  readonly routes: boolean;
}

export const isDiagnosticsOptionsSupplier = safety.typeGuard<
  DiagnosticsOptionsSupplier
>("metrics", "renderers", "routes");

export interface PublicationState {
  readonly observability: rfStd.Observability;
  readonly resourcesTree: rfGovn.RouteTree;
  readonly resourcesIndex: rfStd.UniversalResourcesIndex<unknown>;
  readonly diagnostics: () => diagC.DiagnosticsResourcesState;
  assetsMetrics?: fsA.AssetsMetricsResult;
}

export class ResourcesTree extends rfStd.TypicalRouteTree {
  consumeRoute(
    rs: rfGovn.RouteSupplier | rfGovn.Route,
    options?: {
      readonly nodeExists?: rfStd.RouteTreeNodeExists;
      readonly copyOf?: rfGovn.RouteTreeNode;
    },
  ): rfGovn.RouteTreeNode | undefined {
    const result = super.consumeRoute(rs, options);
    if (rfStd.isFrontmatterSupplier(rs)) {
      rfStd.referenceFrontmatter(rs, result);
    }
    if (rfStd.isModelSupplier(rs)) {
      rfStd.referenceModel(rs, result);
      if (notif.isNotificationsSupplier(rs.model)) {
        notif.referenceNotifications(rs.model, result);
      }
    }
    return result;
  }
}

export class NavigationTree extends rfStd.TypicalRouteTree {
  consumeRoute(
    rs: rfGovn.RouteSupplier | rfGovn.Route,
    options?: {
      readonly nodeExists?: rfStd.RouteTreeNodeExists;
      readonly copyOf?: rfGovn.RouteTreeNode;
    },
  ): rfGovn.RouteTreeNode | undefined {
    const result = super.consumeRoute(rs, options);
    const copyOf = options?.copyOf;
    if (rfStd.isModelSupplier(copyOf)) {
      rfStd.referenceModel(copyOf, result);
      if (notif.isNotificationsSupplier(copyOf.model)) {
        notif.referenceNotifications(copyOf.model, result);
      }
    }
    return result;
  }
}

export const PublicationRoutesGitAssetUrlResolverID = "publication" as const;

export class PublicationRoutes {
  readonly gitAssetPublUrlResolver: git.GitWorkTreeAssetUrlResolver<string> = {
    identity: PublicationRoutesGitAssetUrlResolverID,
    gitAssetUrl: (asset, fallback) => {
      let node = this.resourcesTree.fileSysPaths.get(
        asset.assetPathRelToWorkTree,
      );
      if (!node) {
        node = this.resourcesTree.fileSysPaths.get(
          asset.paths.assetAbsWorkTreePath(asset),
        );
      }
      if (node) return node.location();
      return fallback ? fallback() : undefined;
    },
  };

  constructor(
    readonly routeFactory: rfGovn.RouteFactory,
    readonly resourcesTree = new ResourcesTree(routeFactory),
    readonly navigationTree = new NavigationTree(routeFactory),
  ) {
  }

  /**
   * Add the given route to this.resourcesTree. Subclasses can override this
   * method if the route should be reject for some reason.
   * @param rs The route supplier whose route will be consumed or rejected
   * @returns the newly create tree node or undefined if route is rejected
   */
  consumeResourceRoute(
    rs: rfGovn.RouteSupplier<rfGovn.RouteNode>,
  ): rfGovn.RouteTreeNode | undefined {
    let ctx: unknown;
    const terminal = rs?.route?.terminal;
    if (
      isPublicationRouteEventsHandler(terminal) && terminal.prepareResourceRoute
    ) {
      ctx = terminal.prepareResourceRoute(rs);
    }

    const result = this.resourcesTree.consumeRoute(rs);

    if (
      isPublicationRouteEventsHandler(terminal) &&
      terminal.prepareResourceTreeNode
    ) {
      terminal.prepareResourceTreeNode(rs, result, ctx);
    }

    return result;
  }

  /**
   * Supply a refinery which will observe each resource and, if it has a route,
   * will populate (consume/track) the route by creating a RouteTreeNode
   * instance tied to the resource. If the resource defines either frontmatter
   * or a model those objects are injected into the RouteTreeNode as well. The
   * job of the resourcesTreeConsumerSync refinery is to populate the
   * resourcesTree but not make any business logic or presentation logic
   * decisions. Presentation and business logic associated with routes should be
   * handled by prepareNavigationTree().
   * @returns resource refinery (sync)
   */
  resourcesTreePopulator(): rfGovn.ResourceRefinery<
    rfGovn.RouteSupplier<rfGovn.RouteNode>
  > {
    // deno-lint-ignore require-await
    return async (resource) => {
      if (rfStd.isRouteSupplier(resource)) {
        this.consumeResourceRoute(resource);
      }
      return resource;
    };
  }

  resourcesTreePopulatorSync(): rfGovn.ResourceRefinerySync<
    rfGovn.RouteSupplier<rfGovn.RouteNode>
  > {
    return (resource) => {
      if (rfStd.isRouteSupplier(resource)) {
        this.consumeResourceRoute(resource);
      }
      return resource;
    };
  }

  /**
   * Build a navigation tree that can be used for end-user UI/UX use. This
   * method is a companion to the resourcesTreePopulatorSync() refinery.
   * prepareNavigation assumes that this.resourcesTree has been populated with
   * all known resources and that the navigation tree is a navigable subset of
   * resourcesTree.
   */
  prepareNavigationTree() {
    this.navigationTree.consumeRoute(
      cpC.diagnosticsObsRedirectRoute(this.routeFactory),
    );
    this.resourcesTree.consumeAliases();
    this.navigationTree.consumeTree(
      this.resourcesTree,
      (node) =>
        rfStd.isRenderableMediaTypeResource(
            node.route,
            rfStd.htmlMediaTypeNature.mediaType,
          )
          ? true
          : false,
    );
  }

  /**
   * Create a resource factory which can generate redirect resources; redirect
   * resources represent content whose job it is to redirect to a different URL
   * either within the same site or to external resources.
   * @returns
   */
  redirectResources(): rfGovn.ResourcesFactoriesSupplier<rfGovn.HtmlResource> {
    return redirectC.redirectResources(this.resourcesTree);
  }
}

export interface Publication {
  readonly produce: () => Promise<void>;
  readonly state: PublicationState;
}

export abstract class TypicalPublication<OCState>
  implements Publication, rfGovn.ObservabilityHealthComponentStatusSupplier {
  readonly namespaceURIs = ["TypicalPublication<Resource>"];
  readonly state: PublicationState;
  readonly consumedFileSysWalkPaths = new Set<string>();
  readonly persistedDestFiles = new Map<
    string, // the filename written (e.g. public/**/*.html, etc.)
    rfGovn.FileSysAfterPersistEventElaboration<unknown>
  >();
  readonly fspEventsEmitter = new rfGovn.FileSysPersistenceEventsEmitter();
  readonly diagsOptions: DiagnosticsOptionsSupplier;
  // deno-lint-ignore no-explicit-any
  readonly ds: html.DesignSystemFactory<any, any, any, any>;

  constructor(
    readonly config: Configuration<OCState>,
    readonly routes = new PublicationRoutes(config.fsRouteFactory),
  ) {
    this.ds = this.constructDesignSystem(config, routes);
    const defaultDiagsOptions: DiagnosticsOptionsSupplier = {
      routes: true,
      metrics: { assets: true },
      renderers: true,
    };
    const diagsConfig = new conf.OmnibusEnvJsonArgConfiguration<
      DiagnosticsOptionsSupplier,
      never
    >(
      // export PUBCTL_DIAGNOSTICS=""
      `${this.config.envVarNamesPrefix}DIAGNOSTICS`,
      () => defaultDiagsOptions,
      isDiagnosticsOptionsSupplier,
      () => defaultDiagsOptions,
    );
    this.config.mGitResolvers.registerResolver(routes.gitAssetPublUrlResolver);
    this.diagsOptions = diagsConfig.configureSync();
    this.state = {
      observability: new rfStd.Observability(
        new rfGovn.ObservabilityEventsEmitter(),
      ),
      resourcesTree: routes.resourcesTree,
      resourcesIndex: new rfStd.UniversalResourcesIndex(),
      diagnostics: () => ({
        routes: {
          resourcesTree: routes.resourcesTree,
          emitResources: () => this.diagsOptions.routes,
        },
        renderers: {
          emitResources: () => this.diagsOptions.renderers,
        },
      }),
    };
    this.state.observability.events.emit("healthStatusSupplier", this);
    this.fspEventsEmitter.on(
      "afterPersistFlexibleFile",
      // deno-lint-ignore require-await
      async (destFileName, elaboration) => {
        // TODO: warn if file written more than once either here or directly in persist
        this.persistedDestFiles.set(destFileName, elaboration);
      },
    );
    this.fspEventsEmitter.on(
      "afterPersistFlexibleFileSync",
      (destFileName, elaboration) => {
        // TODO: warn if file written more than once either here or directly in persist
        this.persistedDestFiles.set(destFileName, elaboration);
      },
    );
  }

  abstract constructDesignSystem(
    config: Configuration<OCState>,
    routes: PublicationRoutes,
    // deno-lint-ignore no-explicit-any
  ): html.DesignSystemFactory<any, any, any, any>;

  *obsHealthStatus(): Generator<rfGovn.ObservabilityHealthComponentStatus> {
    const time = new Date();
    const status = health.healthyComponent({
      componentId: this.namespaceURIs.join(", "),
      componentType: "component",
      links: { "module": import.meta.url },
      time,
    });
    yield {
      category: "TypicalPublication",
      status,
    };
  }

  /**
   * For any files that were not "consumed" (transformed or rendered) we will
   * assume that they should be symlinked to the destination path in the same
   * directory structure as they exist in the source content path.
   */
  async mirrorUnconsumedAssets() {
    // if we're running an experimental server, we may not want to mirror
    // assets after a refresh so give config an opportunity to deny request
    if (!this.config.mirrorUnconsumedAssets()) return;
    await Promise.all([
      fsLink.linkAssets(
        this.config.contentRootPath,
        this.config.destRootPath,
        {
          destExistsHandler: (src, dest) => {
            // if we wrote the file ourselves, don't warn - otherwise, warn and skip
            if (!this.persistedDestFiles.has(dest)) {
              console.warn(
                colors.red(
                  `unable to symlink ${src.path} to ${dest}: cannot overwrite destination`,
                ),
              );
            }
          },
        },
        {
          glob: "**/*",
          options: { exclude: ["**/*.ts"] },
          include: (we) =>
            we.isFile && !this.consumedFileSysWalkPaths.has(we.path),
        },
      ),
      this.config.persistClientCargo(this.config.destRootPath),
    ]);
  }

  /**
   * Supply all valid directives that should be handled by Markdown engines.
   * @returns list of directives we will allow in Markdown
   */
  directiveExpectationsSupplier():
    | rfGovn.DirectiveExpectationsSupplier<
      // deno-lint-ignore no-explicit-any
      rfGovn.DirectiveExpectation<any, any>
    >
    | undefined {
    // by default we delegate directive expectations to the design system
    return this.ds.designSystem;
  }

  /**
   * Supply the markdown renderers that our Markdown resources can use to render
   * their content to HTML.
   * @returns list of Markdown layouts we will allow Markdown resources to use
   */
  markdownRenderers(): mdr.MarkdownRenderStrategy {
    return new mdr.MarkdownRenderStrategy(
      new mdr.MarkdownLayouts({
        directiveExpectations: this.directiveExpectationsSupplier(),
        rewriteURL: this.config.rewriteMarkdownLink,
      }),
    );
  }

  controlPanelOriginators() {
    // this is usually false for experimental server
    if (!this.config.produceControlPanelContent()) return [];

    const { fsRouteFactory, diagnosticsRoute, observabilityRoute } =
      this.config;
    const diagnostics = this.state.diagnostics();
    return [
      diagC.diagnosticsResources(
        diagnosticsRoute,
        fsRouteFactory,
        diagnostics,
      ),
      diagC.observabilityPreProduceResources(
        observabilityRoute,
        fsRouteFactory,
        {
          metrics: {
            assets: { emitResources: () => this.diagsOptions.metrics.assets },
          },
          observability: this.state.observability,
        },
      ),
      sqlObsC.observabilityResources(diagnosticsRoute, fsRouteFactory),
    ];
  }

  // deno-lint-ignore no-explicit-any
  originators(): rfGovn.ResourcesFactoriesSupplier<any>[] {
    const { contentRootPath, fsRouteFactory } = this.config;
    const watcher = new fsg.FileSysGlobsOriginatorEventEmitter();
    // deno-lint-ignore require-await
    watcher.on("beforeYieldWalkEntry", async (we) => {
      // if we "consumed" (handled) the resource it means we do not want it to
      // go to the destination directory so let's track it
      this.consumedFileSysWalkPaths.add(we.path);
    });
    const mdRenderers = this.markdownRenderers();
    return [
      // deno-lint-ignore no-explicit-any
      new fsg.FileSysGlobsOriginator<any>(
        [
          // process modules first so that if there are any proxies or other
          // generated content, it can be processed but the remaining originators
          tfsg.moduleFileSysGlobs<PublicationState>(
            contentRootPath,
            fsRouteFactory,
            mdRenderers,
            this.state,
          ),
          tfsg.markdownFileSysGlobs(
            contentRootPath,
            mdRenderers,
            fsRouteFactory,
          ),
          tfsg.htmlFileSysGlobs(contentRootPath, fsRouteFactory),
        ],
        this.config.extensionsManager,
        {
          eventEmitter: () => watcher,
        },
      ),
      ...this.controlPanelOriginators(),
    ];
  }

  originationRefinery() {
    return this.routes.resourcesTreePopulatorSync();
  }

  // deno-lint-ignore no-explicit-any
  inspectionRefinery(): rfGovn.ResourceRefinery<any> | undefined {
    return undefined;
  }

  // deno-lint-ignore no-explicit-any
  inspectionRefinerySync(): rfGovn.ResourceRefinerySync<any> | undefined {
    return undefined;
  }

  persistersRefinery() {
    const ees: rfGovn.FileSysPersistEventsEmitterSupplier = {
      fspEE: this.fspEventsEmitter,
    };
    return rfStd.pipelineUnitsRefineryUntyped(
      this.ds.designSystem.prettyUrlsHtmlProducer(
        this.config.destRootPath,
        this.ds.contentAdapter,
        ees,
      ),
      jrs.jsonTextProducer(this.config.destRootPath, {
        routeTree: this.routes.resourcesTree,
      }, ees),
      dtr.csvProducer<PublicationState>(
        this.config.destRootPath,
        this.state,
        ees,
      ),
      tfr.textFileProducer<PublicationState>(
        this.config.destRootPath,
        this.state,
        {
          eventsEmitter: ees,
        },
      ),
    );
  }

  async initProduce() {
    // this usually just removes the dest root but could do other things too
    await this.config.initProduce();

    // setup the cache and any other git-specific initialization
    if (this.ds.contentAdapter.git instanceof git.TypicalGit) {
      await this.ds.contentAdapter.git.init();
    }
  }

  async *originate<Resource>(
    supplier: rfGovn.ResourcesFactoriesSupplier<Resource>,
    // deno-lint-ignore no-explicit-any
    refine: rfGovn.ResourceRefinerySync<any>,
    _parent?: Resource,
  ): AsyncGenerator<Resource> {
    for await (const rf of supplier.resourcesFactories()) {
      const resource = refine(await rf.resourceFactory()) as Resource;
      let hasChildren = false;
      let yieldWithChildren = false;
      if (rfStd.isChildResourcesFactoriesSupplier<Resource>(resource)) {
        // our constructed resource wants to create its own resources so allow
        // it become a dynamic supplier of resource factories via recursion
        yield* this.originate(resource, refine, resource);
        hasChildren = true;
        yieldWithChildren = resource.yieldParentWithChildren ? true : false;
      }
      if (!hasChildren || (hasChildren && yieldWithChildren)) {
        yield resource;
      }
    }
  }

  async *resources<Resource>(refine: rfGovn.ResourceRefinerySync<Resource>) {
    for await (const originator of this.originators()) {
      if (rfStd.isObservabilityHealthComponentSupplier(originator)) {
        this.state.observability.events.emitSync(
          "healthStatusSupplier",
          originator,
        );
      }
      yield* this.originate(originator, refine);
    }
  }

  async produceMetrics() {
    const assetsTree = new fsT.FileSysAssetsTree();
    for (const walker of this.config.assetsMetricsWalkers) {
      await assetsTree.consumeAssets(walker);
    }
    this.state.assetsMetrics = await fsA.fileSysAnalytics({
      assetsTree,
      metrics: this.config.metrics,
      txID: "transactionID",
      txHost: Deno.hostname(),
    });

    const { fsRouteFactory, observabilityRoute } = this.config;
    const resourcesIndex = this.state.resourcesIndex;
    const originationRefinery = this.originationRefinery();
    const persist = this.persistersRefinery();
    for await (
      const resource of this.originate(
        diagC.observabilityPostProduceResources(
          observabilityRoute,
          fsRouteFactory,
          // before production assetsMetrics is undefined but by now it should
          // be constructed as part of urWatcher.on("afterProduce", ...) so we
          // do a type-assertion
          {
            health: { emitResources: () => true },
            metrics: {
              assets: {
                collected: this.state.assetsMetrics,
                emitResources: () => this.diagsOptions.metrics.assets,
              },
            },
            observability: this.state.observability,
          },
        ),
        originationRefinery,
      )
    ) {
      // we need to persist these ourselves because by the time produceMetrics()
      // is called, all other resources have already been persisted
      resourcesIndex.index(await persist(resource));
    }
  }

  async inspectResources(
    resourcesIndex: rfStd.UniversalResourcesIndex<unknown>,
  ): Promise<void> {
    const inspectSync = this.inspectionRefinerySync();
    if (inspectSync) {
      for (const resource of resourcesIndex.resources()) {
        inspectSync(resource);
      }
    }

    const inspect = this.inspectionRefinery();
    if (inspect) {
      for await (const resource of resourcesIndex.resources()) {
        inspect(resource);
      }
    }
  }

  async finalizePrePersist(
    originationRefinery: rfGovn.ResourceRefinerySync<
      rfGovn.RouteSupplier<rfGovn.RouteNode>
    >,
    resourcesIndex: rfStd.UniversalResourcesIndex<unknown>,
  ) {
    // the first found of all resources are now available, but haven't yet been
    // persisted so let's prepare the navigation trees before we persist
    this.routes.prepareNavigationTree();

    // the navigation tree may have generated redirect HTML pages (e.g. aliases)
    // so let's get those into the index too
    for await (
      const resource of this.originate(
        this.routes.redirectResources(),
        originationRefinery,
      )
    ) {
      resourcesIndex.index(resource);
    }
  }

  async finalizeProduce() {
    // any files that were not consumed should "mirrored" to the destination
    await this.mirrorUnconsumedAssets();

    // produce metrics after the assets are mirrored in case we're walking the
    // destination path
    await this.produceMetrics();
  }

  async produce() {
    // give opportunity for subclasses to intialize the production pipeline
    await this.initProduce();

    // we store all our resources in this index, as they are produced;
    // ultimately the index contains every generated resource
    const resourcesIndex = this.state.resourcesIndex;

    // find and construct every orginatable resource from file system and other
    // sources; as each resource is prepared, store it in the index -- each
    // resource create child resources recursively and this loop handles all
    // "fanned out" resources as well
    const originationRefinery = this.originationRefinery();
    for await (const resource of this.resources(originationRefinery)) {
      resourcesIndex.index(resource);
    }

    // the first found of all resources are now available, but haven't yet been
    // persisted so let's do any routes finalization, new resources construction
    // or any other pre-persist activities
    await this.finalizePrePersist(originationRefinery, resourcesIndex);

    // now all resources, child resources, redirect pages, etc. have been
    // created so we can persist all pages that are in our index
    const persist = this.persistersRefinery();
    for (const resource of resourcesIndex.resources()) {
      await persist(resource);
    }

    // give opportunity for subclasses to finalize the production pipeline
    await this.finalizeProduce();
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
