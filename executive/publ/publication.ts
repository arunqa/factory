import { colors, fs, log, path } from "../../core/deps.ts";
import * as rfGovn from "../../governance/mod.ts";
import * as rfStd from "../../core/std/mod.ts";

import * as safety from "../../lib/safety/mod.ts";
import * as metrics from "../../lib/metrics/mod.ts";
import * as telem from "../../lib/telemetry/mod.ts";
import * as health from "../../lib/health/mod.ts";
import * as conf from "../../lib/conf/mod.ts";
import * as k from "../../lib/knowledge/mod.ts";
import * as fsA from "../../lib/fs/fs-analytics.ts";
import * as fsT from "../../lib/fs/fs-tree.ts";
import * as fsLink from "../../lib/fs/link.ts";
import * as fsInspect from "../../lib/fs/inspect.ts";
import * as git from "../../lib/git/mod.ts";
import * as notif from "../../lib/notification/mod.ts";
import * as ws from "../../lib/workspace/mod.ts";
import * as gi from "../../lib/structure/govn-index.ts";
import * as m from "../../lib/metrics/mod.ts";

import * as fsg from "../../core/originate/file-sys-globs.ts";
import * as tfsg from "../../core/originate/typical-file-sys-globs.ts";

import * as html from "../../core/render/html/mod.ts";
import * as jrs from "../../core/render/json.ts";
import * as tfr from "../../core/render/text.ts";
import * as br from "../../core/render/bundle.ts";
import * as dtr from "../../core/render/delimited-text.ts";
import * as mdr from "../../core/render/markdown/mod.ts";

import * as diagC from "../../core/content/diagnostic/mod.ts";
import * as redirectC from "../../core/content/redirects.rf.ts";

import * as ocC from "../../core/content/operational-context.ts";
import * as psDB from "./publication-db.ts";

export const assetMetricsWalkOptions: fs.WalkOptions = {
  skip: [/\.git/],
};

export interface PublicationMeasures {
  readonly initProduceStartMS: number;
  readonly originateStartMS: number;
  readonly finalizePrePersistStartMS: number;
  readonly persistStartMS: number;
  readonly finalizeProduceStartMS: number;
}

export class PublicationResourcesIndex<Resource>
  extends gi.UniversalIndex<Resource> {
  readonly memoizedProducers = new Map<
    rfGovn.RouteLocation,
    {
      readonly unit: rfStd.FileSysRouteNode;
      readonly isReloadRequired: () => boolean;
      // deno-lint-ignore no-explicit-any
      readonly replay: () => Promise<any>;
    }
  >();
  readonly constructionDurationStats = new m.RankedStatistics<
    { resource: unknown; statistic: number; provenance: string }
  >();

  onConstructResource<Resource>(
    resource: Resource,
    lcMetrics: fsg.FileSysGlobWalkEntryLifecycleMetrics<Resource>,
  ): void {
    const duration = lcMetrics.originateDurationMS;
    if (duration) {
      this.constructionDurationStats.rank({
        resource,
        statistic: duration,
        provenance: lcMetrics.fsgwe.path,
      });
    }
  }

  memoizeProducer<Resource>(
    // deno-lint-ignore no-explicit-any
    ds: html.DesignSystemFactory<any, any, any, any>,
    resource: Resource,
    producer: (resource: Resource) => Promise<Resource>,
  ) {
    if (rfStd.isRouteSupplier(resource)) {
      if (resource.route.terminal) {
        if (rfStd.isFileSysRouteUnit(resource.route.terminal)) {
          const unit = resource.route.terminal;
          if (unit.lastModifiedAt) {
            if (fsg.isFileSysGlobWalkEntrySupplier(resource)) {
              this.memoizedProducers.set(
                ds.contentStrategy.navigation.location(unit),
                {
                  unit,
                  isReloadRequired: () => unit.isModifiedInFileSys(),
                  replay: async () => {
                    const cloned = await resource.fileSysGlobWalkProvenance
                      .resourceFactory();
                    return producer(cloned);
                  },
                },
              );
            }
          } else {
            // deno-fmt-ignore
            console.warn(colors.red(`Memoizing a resource producer without lastModifiedAt will not work`));
            console.warn(colors.brightRed(Deno.inspect(unit)));
          }
        }
      } else {
        // deno-fmt-ignore
        console.warn(colors.red(`Memoizing a resource producer without terminal route will not work`));
        console.warn(colors.brightRed(Deno.inspect(resource.route)));
      }
    } else {
      // deno-fmt-ignore
      console.warn(colors.red(`Memoizing a resource producer without a route will not work`));
      console.warn(resource);
    }
  }

  async replayMemoizedProducer<Resource>(
    qualifiedPath: rfGovn.RouteLocation,
  ): Promise<false | Resource> {
    const producer = this.memoizedProducers.get(qualifiedPath);
    if (producer) {
      if (producer.isReloadRequired()) {
        return await producer.replay();
      }
    }
    return false;
  }

  // deno-lint-ignore no-explicit-any
  populateMetrics(metrics: m.Metrics, baggage: any) {
    metrics.record(
      metrics.gaugeMetric(
        "publ_resources_index_entries_total",
        "Count of total resources originated",
      ).instance(this.resourcesIndex.length, baggage),
    );
    this.constructionDurationStats.populateMetrics(
      metrics,
      baggage,
      "publ_resources_origination_duration",
      "resource origination duration",
      "milliseconds",
    );
    this.constructionDurationStats.populateRankMetrics(
      metrics,
      baggage,
      "publ_resources_origination_duration",
      "resource origination duration",
      "milliseconds",
      (item, index) => {
        const resource = item.resource;
        if (rfStd.isRouteSupplier(resource) && resource.route.terminal) {
          const terminal = resource.route.terminal;
          return {
            provenance: item.provenance,
            route: terminal.qualifiedPath,
            routeLabel: terminal.label,
            index,
          };
        } else {
          return { provenance: item.provenance, index };
        }
      },
    );
  }
}

export class PublicationProducersStatistics {
  readonly producers = new Map<string, m.ScalarStatistics>();

  encounter(identity: string, value: number) {
    let stats = this.producers.get(identity);
    if (!stats) {
      stats = new m.ScalarStatistics();
      this.producers.set(identity, stats);
    }
    stats.encounter(value);
  }

  // deno-lint-ignore no-explicit-any
  populateMetrics(metrics: m.Metrics, baggage: any) {
    this.producers.forEach((stats, identity) => {
      stats.populateMetrics(
        metrics,
        baggage,
        `publ_producer_${identity}_duration`,
        `${identity} duration`,
        "milliseconds",
      );
    });
  }
}

export class PublicationPersistedIndex {
  readonly persistedDestFiles = new Map<
    string, // the filename written (e.g. public/**/*.html, etc.)
    rfGovn.FileSysAfterPersistEventElaboration<unknown>
  >();
  readonly persistDurationStats = new m.RankedStatistics<
    { destFileName: string; statistic: number }
  >();

  index(
    destFileName: string,
    fsapee: rfGovn.FileSysAfterPersistEventElaboration<unknown>,
  ): void {
    this.persistedDestFiles.set(destFileName, fsapee);
    const duration = fsapee.persistDurationMS;
    if (duration) {
      this.persistDurationStats.rank({ destFileName, statistic: duration });
    }
  }

  has(destFileName: string): boolean {
    return this.persistedDestFiles.has(destFileName);
  }

  // deno-lint-ignore no-explicit-any
  populateMetrics(metrics: m.Metrics, baggage: any) {
    metrics.record(
      metrics.gaugeMetric(
        "publ_persisted_index_entries_total",
        "Count of total resources persisted",
      ).instance(this.persistedDestFiles.size, baggage),
    );
    this.persistDurationStats.populateMetrics(
      metrics,
      baggage,
      "publ_resources_persist_duration",
      "resource persist duration",
      "milliseconds",
    );
    this.persistDurationStats.populateRankMetrics(
      metrics,
      baggage,
      "publ_resources_persist_duration",
      "resource persist duration",
      "milliseconds",
      (item, index) => ({ destFileName: item.destFileName, index }),
    );
  }
}

export interface PublicationHomePathSupplier {
  (relative: string, abs?: boolean): fsg.FileSysPathText;
}

export interface PublicationOperationalContext {
  readonly projectRootPath: PublicationHomePathSupplier;
  readonly processStartTimestamp: Date;
  readonly isExperimentalOperationalCtx: boolean;
  readonly isLiveReloadRequest: boolean;
  readonly iterationCount: number;
  readonly produceOperationalCtxCargo: (home: string) => Promise<void>;
  readonly publStateDB: () => psDB.PublicationDatabase;
  readonly publStateDbLocation: (relative?: boolean) => string;
}

export interface Preferences<
  OperationalContext extends PublicationOperationalContext,
> {
  readonly operationalCtx: OperationalContext;
  readonly observability: rfStd.Observability;
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
  readonly wsEditorResolver: ws.WorkspaceEditorTargetResolver<
    ws.WorkspaceEditorTarget
  >;
  readonly rewriteMarkdownLink?: mdr.MarkdownLinkUrlRewriter;
  readonly assetsMetricsWalkers?: (
    config: Configuration<OperationalContext>,
  ) => fsT.FileSysAssetWalker[];
  readonly extensionsManager: rfGovn.ExtensionsManager;
  readonly termsManager: k.TermsManager;
  readonly memoizeProducers: boolean;
}

export class Configuration<
  OperationalContext extends PublicationOperationalContext,
> implements Omit<Preferences<OperationalContext>, "assetsMetricsWalkers"> {
  readonly operationalCtx: OperationalContext;
  readonly observability: rfStd.Observability;
  readonly telemetry: telem.Instrumentation<telem.UntypedBaggage> = new telem
    .Telemetry();
  readonly metrics = new metrics.TypicalMetrics();
  readonly envVarNamesPrefix: string;
  readonly assetsMetricsWalkers: fsT.FileSysAssetWalker[];
  readonly git?: git.GitExecutive;
  readonly fsRouteFactory: rfStd.FileSysRouteFactory;
  readonly routeLocationResolver?: rfStd.RouteLocationResolver;
  readonly extensionsManager: rfGovn.ExtensionsManager;
  readonly termsManager: k.TermsManager;
  readonly observabilityRoute: rfGovn.Route;
  readonly diagnosticsRoute: rfGovn.Route;
  readonly contentRootPath: fsg.FileSysPathText;
  readonly destRootPath: fsg.FileSysPathText;
  readonly appName: string;
  readonly mGitResolvers: git.ManagedGitResolvers<string>;
  readonly routeGitRemoteResolver: rfGovn.RouteGitRemoteResolver<
    html.GitRemoteAnchor
  >;
  readonly wsEditorResolver: ws.WorkspaceEditorTargetResolver<
    ws.WorkspaceEditorTarget
  >;
  readonly persistClientCargo: html.HtmlLayoutClientCargoPersister;
  readonly rewriteMarkdownLink?: mdr.MarkdownLinkUrlRewriter;
  readonly memoizeProducers: boolean;

  constructor(prefs: Preferences<OperationalContext>) {
    this.operationalCtx = prefs.operationalCtx;
    this.observability = prefs.observability;
    this.mGitResolvers = prefs.mGitResolvers;
    this.git = git.discoverGitWorktreeExecutiveSync(
      prefs.contentRootPath,
      (gp) => new git.TypicalGit(gp, this.mGitResolvers),
    );
    this.contentRootPath = prefs.contentRootPath;
    this.persistClientCargo = prefs.persistClientCargo;
    this.destRootPath = prefs.destRootPath;
    this.appName = prefs.appName;
    this.routeGitRemoteResolver = prefs.routeGitRemoteResolver;
    this.wsEditorResolver = prefs.wsEditorResolver;
    this.routeLocationResolver = prefs.routeLocationResolver;
    this.fsRouteFactory = new rfStd.FileSysRouteFactory(
      this.routeLocationResolver || rfStd.defaultRouteLocationResolver(),
      rfStd.defaultRouteWorkspaceEditorResolver(this.wsEditorResolver),
    );
    this.observabilityRoute = ocC.observabilityRoute(this.fsRouteFactory);
    this.diagnosticsRoute = ocC.diagnosticsRoute(this.fsRouteFactory);
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
    this.extensionsManager = prefs.extensionsManager;
    this.termsManager = prefs.termsManager;
    this.memoizeProducers = prefs.memoizeProducers;
  }

  produceOperationalCtxContent(): boolean {
    return true;
  }

  symlinkAssets(): boolean {
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

// IMPORTANT: if the structure of this interface is changed, be sure to update
// PUBCTL_DIAGNOSTICS in .envrc.example and .envrc
export interface DiagnosticsOptionsSupplier {
  readonly metrics: {
    readonly universalPEF: boolean;
    readonly universalJSON: boolean;
    readonly assetsPEF: boolean;
    readonly assetsCSV: boolean;
    readonly producers: boolean;
    readonly persistence: boolean;
  };
  readonly renderers: boolean;
  readonly routes: boolean;
}

export const isDiagnosticsOptionsSupplier = safety.typeGuard<
  DiagnosticsOptionsSupplier
>("metrics", "renderers", "routes");

export interface PublicationState {
  readonly observability: rfStd.Observability;
  readonly resourcesTree: rfGovn.RouteTree;
  readonly resourcesIndex: PublicationResourcesIndex<unknown>;
  readonly persistedIndex: PublicationPersistedIndex;
  readonly producerStats: PublicationProducersStatistics;
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
   * method if the route should be rejected for some reason.
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
      ocC.diagnosticsObsRedirectRoute(this.routeFactory),
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

export interface Publication<
  OperationalContext extends PublicationOperationalContext,
> {
  readonly config: Configuration<OperationalContext>;
  readonly produce: () => Promise<void>;
  readonly state: PublicationState;
  // deno-lint-ignore no-explicit-any
  readonly ds: html.DesignSystemFactory<any, any, any, any>;
}

export abstract class TypicalPublication<
  OperationalContext extends PublicationOperationalContext,
> implements
  Publication<OperationalContext>,
  rfGovn.ObservabilityHealthComponentStatusSupplier {
  readonly namespaceURIs = ["TypicalPublication<Resource>"];
  readonly state: PublicationState;
  readonly consumedFileSysWalkPaths = new Set<string>();
  readonly fspEventsEmitter = new rfGovn.FileSysPersistenceEventsEmitter();
  readonly diagsOptions: DiagnosticsOptionsSupplier;
  // deno-lint-ignore no-explicit-any
  readonly ds: html.DesignSystemFactory<any, any, any, any>;

  constructor(
    readonly config: Configuration<OperationalContext>,
    readonly routes = new PublicationRoutes(config.fsRouteFactory),
  ) {
    this.ds = this.constructDesignSystem(config, routes);
    const defaultDiagsOptions: DiagnosticsOptionsSupplier = {
      routes: true,
      metrics: {
        universalPEF: true,
        assetsCSV: true,
        assetsPEF: true,
        universalJSON: true,
        persistence: true,
        producers: true,
      },
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
    const persistedIndex = new PublicationPersistedIndex();
    this.state = {
      observability: config.observability,
      resourcesTree: routes.resourcesTree,
      resourcesIndex: new PublicationResourcesIndex(),
      producerStats: new PublicationProducersStatistics(),
      persistedIndex,
    };
    this.state.observability.events.emit("healthStatusSupplier", this);
    this.fspEventsEmitter.on(
      "afterPersistFlexibleFile",
      // deno-lint-ignore require-await
      async (destFileName, elaboration) => {
        // TODO: warn if file written more than once either here or directly in persist
        persistedIndex.index(destFileName, elaboration);
      },
    );
    this.fspEventsEmitter.on(
      "afterPersistFlexibleFileSync",
      (destFileName, elaboration) => {
        // TODO: warn if file written more than once either here or directly in persist
        persistedIndex.index(destFileName, elaboration);
      },
    );
  }

  abstract constructDesignSystem(
    config: Configuration<OperationalContext>,
    routes: PublicationRoutes,
    // deno-lint-ignore no-explicit-any
  ): html.DesignSystemFactory<any, any, any, any>;

  async *obsHealthStatus(): AsyncGenerator<
    rfGovn.ObservabilityHealthComponentStatus
  > {
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
   * Create symlinks for files such as images, CSS style sheets, and other
   * "assets".
   */
  async symlinkAssets() {
    // if we're running an experimental server, we may not want to mirror
    // assets after a refresh so give config an opportunity to deny request
    if (!this.config.symlinkAssets()) return;

    await Promise.all([
      // For any files that are in the content directory but were not "consumed"
      // (transformed or rendered) we will assume that they should be symlinked
      // to the destination path in the same directory structure as they exist
      // in the source content path. Images, and other assets sitting in same
      // directories as *.html, *.ts, *.md, etc. will be symlink'd so that they
      // do not need to be copied.
      fsLink.linkAssets(
        this.config.contentRootPath,
        this.config.destRootPath,
        {
          destExistsHandler: (src, dest) => {
            // if we wrote the file ourselves, don't warn - otherwise, warn and skip
            if (!this.state.persistedIndex.has(dest)) {
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

      // Symlink any files that are considered "cargo" that must be carried to
      // the client (known as "client-cargo").
      this.config.persistClientCargo(this.config.destRootPath),
    ]);
  }

  async inspectAssets(
    inspector: (asset: fsInspect.InspectableAsset) => void,
  ): Promise<void> {
    // For any files that are in the content directory but were not "consumed"
    // (transformed or rendered) we will assume that they should be inspected
    for await (
      const asset of fsInspect.discoverAssets(
        {
          // NOTE: this should match the content of this.linkAssets.
          originRootPath: this.config.contentRootPath,
          glob: "**/*",
          options: { exclude: ["**/*.ts"] },
          include: (we) =>
            we.isFile && !this.consumedFileSysWalkPaths.has(we.path),
        },
      )
    ) {
      inspector(asset);
    }
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
        customize: (mdi) => {
          mdi.renderer.rules.image = mdr.autoCorrectPrettyUrlImagesRule(
            mdi.renderer.rules.image,
          );
        },
      }),
    );
  }

  operationalCtxOriginators() {
    if (!this.config.produceOperationalCtxContent()) return [];

    const { fsRouteFactory, observabilityRoute } = this.config;
    return [
      diagC.observabilityPreProduceResources(
        observabilityRoute,
        fsRouteFactory,
        {
          metrics: {
            universal: this.config.metrics,
            renderUniversalJSON: this.diagsOptions.metrics.universalJSON,
            renderUniversalPEF: this.diagsOptions.metrics.universalPEF,
          },
          observability: this.state.observability,
        },
      ),
    ];
  }

  // deno-lint-ignore no-explicit-any
  originators(): rfGovn.ResourcesFactoriesSupplier<any>[] {
    const { contentRootPath, fsRouteFactory } = this.config;
    const watcher = new fsg.FileSysGlobsOriginatorEventEmitter();
    // deno-lint-ignore require-await
    watcher.on("afterConstructResource", async (resource, lcMetrics) => {
      // if we "consumed" (handled) the resource it means we do not want it to
      // go to the destination directory so let's track it
      this.state.resourcesIndex.onConstructResource(resource, lcMetrics);
    });
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
      ...this.operationalCtxOriginators(),
    ];
  }

  // deno-lint-ignore no-explicit-any
  postProduceOriginators(): rfGovn.ResourcesFactoriesSupplier<any>[] {
    return [];
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
    const memoize = this.config.memoizeProducers;
    return rfStd.pipelineUnitsRefineryUntypedObservable<
      { readonly startMS: number },
      {
        readonly identity: string;
        // deno-lint-ignore no-explicit-any
        readonly refinery: rfGovn.ResourceRefinery<any>;
        startMS?: number;
      }
    >(
      // deno-lint-ignore require-await
      async () => ({ startMS: Date.now() }),
      // deno-lint-ignore require-await
      async function (eachCtx) {
        eachCtx.startMS = Date.now();
      },
      // deno-lint-ignore require-await
      async (eachCtx) => {
        if (eachCtx.startMS) {
          this.state.producerStats.encounter(
            eachCtx.identity,
            Date.now() - eachCtx.startMS,
          );
        }
      },
      // deno-lint-ignore require-await
      async (ctx) => {
        this.state.producerStats.encounter(
          "cumulative",
          Date.now() - ctx.startMS,
        );
      },
      {
        identity: "prettyUrlsHtmlProducer",
        refinery: this.ds.designSystem.prettyUrlsHtmlProducer(
          this.config.destRootPath,
          this.ds.contentStrategy,
          {
            fspEE: ees,
            memoize: memoize
              // deno-lint-ignore require-await
              ? (async (resource, producer) => {
                this.state.resourcesIndex.memoizeProducer(
                  this.ds,
                  resource,
                  producer,
                );
              })
              : undefined,
          },
        ),
      },
      {
        identity: "jsonTextProducer",
        refinery: jrs.jsonTextProducer(this.config.destRootPath, {
          routeTree: this.routes.resourcesTree,
        }, ees),
      },
      {
        identity: "csvProducer",
        refinery: dtr.csvProducer<PublicationState>(
          this.config.destRootPath,
          this.state,
          ees,
        ),
      },
      {
        identity: "textFileProducer",
        refinery: tfr.textFileProducer<PublicationState>(
          this.config.destRootPath,
          this.state,
          {
            eventsEmitter: ees,
          },
        ),
      },
      {
        identity: "bundleProducer",
        refinery: br.bundleProducer<PublicationState>(
          this.config.destRootPath,
          this.state,
          {
            eventsEmitter: ees,
          },
        ),
      },
    );
  }

  async initProduce() {
    // this usually just removes the dest root but could do other things too
    await this.config.initProduce();

    // setup the cache and any other git-specific initialization
    if (this.ds.contentStrategy.git instanceof git.TypicalGit) {
      await this.ds.contentStrategy.git.init();
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

  async produceMetrics(measures: PublicationMeasures) {
    const assetsTree = new fsT.FileSysAssetsTree();
    for (const walker of this.config.assetsMetricsWalkers) {
      await assetsTree.consumeAssets(walker);
    }
    const commonMetricsBaggage = {
      txID: "transactionID",
      txHost: Deno.hostname(),
    };
    const metrics = this.config.metrics;
    metrics.record(
      metrics.gaugeMetric(
        "publ_lc_init_produce_milliseconds",
        "Time it took to initialize production",
      ).instance(
        measures.originateStartMS - measures.initProduceStartMS,
        commonMetricsBaggage,
      ),
    );
    metrics.record(
      metrics.gaugeMetric(
        "publ_lc_originate_milliseconds",
        "Time it took to originate and construct resources",
      ).instance(
        measures.finalizePrePersistStartMS - measures.originateStartMS,
        commonMetricsBaggage,
      ),
    );
    metrics.record(
      metrics.gaugeMetric(
        "publ_lc_render_milliseconds",
        "Time it took to render and prepare for persistence",
      ).instance(
        measures.persistStartMS - measures.finalizePrePersistStartMS,
        commonMetricsBaggage,
      ),
    );
    metrics.record(
      metrics.gaugeMetric(
        "publ_lc_persist_milliseconds",
        "Time it took to persist rendered resources",
      ).instance(
        measures.finalizeProduceStartMS - measures.persistStartMS,
        commonMetricsBaggage,
      ),
    );
    const metricsOp = this.diagsOptions.metrics;
    if (metricsOp.universalPEF || metricsOp.universalJSON) {
      this.state.resourcesIndex.populateMetrics(metrics, commonMetricsBaggage);
    }
    if (metricsOp.producers) {
      this.state.producerStats.populateMetrics(metrics, commonMetricsBaggage);
    }
    if (metricsOp.persistence) {
      this.state.persistedIndex.populateMetrics(metrics, commonMetricsBaggage);
    }
    if (metricsOp.assetsPEF || metricsOp.assetsCSV) {
      const beforeFSA = Date.now();
      this.state.assetsMetrics = await fsA.fileSysAnalytics({
        assetsTree,
        metrics,
        metricsNamePrefix: "publ_asset_name_extension_analytics_",
        ...commonMetricsBaggage,
      });
      metrics.record(
        metrics.gaugeMetric(
          "publ_lc_asset_name_extension_analytics_compute_duration_milliseconds",
          "Time it took to compute file system assets analytics",
        ).instance(Date.now() - beforeFSA, commonMetricsBaggage),
      );
    }
    metrics.record(
      metrics.gaugeMetric(
        "publ_lc_produce_milliseconds",
        "Total time it took to produce all resources",
      ).instance(
        Date.now() - measures.originateStartMS,
        commonMetricsBaggage,
      ),
    );
    metrics.record(
      metrics.gaugeMetric(
        "publ_lc_publish_milliseconds",
        "Total time it took to produce all resources and perform all other process functions",
      ).instance(
        Date.now() - this.config.operationalCtx.processStartTimestamp.getTime(),
        commonMetricsBaggage,
      ),
    );

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
            renderHealth: true,
            envVars: {
              renderInHealth: true,
              filter: (name) => name.match(/^PUBCTL/) ? true : false,
            },
            metrics: {
              universal: metrics,
              renderUniversalJSON: metricsOp.universalJSON,
              renderUniversalPEF: metricsOp.universalPEF,
              assets: metricsOp.assetsPEF ||
                  metricsOp.assetsCSV
                ? {
                  results: this.state.assetsMetrics!,
                  renderPEF: metricsOp.assetsPEF,
                  renderCSV: metricsOp.assetsCSV,
                }
                : undefined,
            },
            observability: this.state.observability,
            serverContext: () => {
              this.config.operationalCtx;
            },
          },
        ),
        originationRefinery,
      )
    ) {
      // we need to persist these ourselves because by the time produceMetrics()
      // is called, all other resources have already been persisted
      resourcesIndex.index(await persist(resource));
    }

    const ocCtxRoute = ocC.operationalCtxRoute(this.config.fsRouteFactory);
    if (ocCtxRoute.terminal) {
      this.config.operationalCtx.produceOperationalCtxCargo(
        path.join(this.config.destRootPath, ocCtxRoute.terminal.qualifiedPath),
      );
    } else {
      console.warn(
        colors.red(`ocCtxRoute was not available (this should never happen)`),
      );
    }
  }

  async inspectResources(
    resourcesIndex: PublicationResourcesIndex<unknown>,
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
    resourcesIndex: PublicationResourcesIndex<unknown>,
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

  async finalizeProduce(measures: PublicationMeasures) {
    const resourcesIndex = this.state.resourcesIndex;
    const originationRefinery = this.originationRefinery();
    const persist = this.persistersRefinery();
    for (const ppo of this.postProduceOriginators()) {
      for await (
        const resource of this.originate(ppo, originationRefinery)
      ) {
        // we need to persist these ourselves because by the time finalizeProduce()
        // is called, all other resources have already been persisted
        resourcesIndex.index(await persist(resource));
      }
    }

    // any files that were not consumed should "mirrored" to the destination
    await this.symlinkAssets();

    // produce metrics after the assets are mirrored in case we're walking the
    // destination path
    await this.produceMetrics(measures);
  }

  async produce() {
    // give opportunity for subclasses to intialize the production pipeline
    const initProduceStartMS = Date.now();
    await this.initProduce();

    // we store all our resources in this index, as they are produced;
    // ultimately the index contains every generated resource
    const resourcesIndex = this.state.resourcesIndex;

    // find and construct every orginatable resource from file system and other
    // sources; as each resource is prepared, store it in the index -- each
    // resource create child resources recursively and this loop handles all
    // "fanned out" resources as well
    const originateStartMS = Date.now();
    const originationRefinery = this.originationRefinery();
    for await (const resource of this.resources(originationRefinery)) {
      resourcesIndex.index(resource);
    }

    // the first found of all resources are now available, but haven't yet been
    // persisted so let's do any routes finalization, new resources construction
    // or any other pre-persist activities
    const finalizePrePersistStartMS = Date.now();
    await this.finalizePrePersist(originationRefinery, resourcesIndex);

    // now all resources, child resources, redirect pages, etc. have been
    // created so we can persist all pages that are in our index
    const persistStartMS = Date.now();
    const persist = this.persistersRefinery();
    for (const resource of resourcesIndex.resources()) {
      await persist(resource);
    }

    // give opportunity for subclasses to finalize the production pipeline
    await this.finalizeProduce({
      initProduceStartMS,
      originateStartMS,
      finalizePrePersistStartMS,
      persistStartMS,
      finalizeProduceStartMS: Date.now(),
    });
  }
}
