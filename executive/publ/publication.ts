import { colors, fs, path } from "../../core/deps.ts";
import * as rfGovn from "../../governance/mod.ts";
import * as rfStd from "../../core/std/mod.ts";

import * as safety from "../../lib/safety/mod.ts";
import * as st from "../../lib/statistics/stream.ts";
import * as telem from "../../lib/telemetry/mod.ts";
import * as health from "../../lib/health/mod.ts";
import * as conf from "../../lib/conf/mod.ts";
import * as k from "../../lib/knowledge/mod.ts";
import * as fsA from "../../lib/fs/fs-analytics.ts";
import * as fsT from "../../lib/fs/fs-tabular.ts";
import * as fsLink from "../../lib/fs/link.ts";
import * as fsInspect from "../../lib/fs/inspect.ts";
import * as git from "../../lib/git/mod.ts";
import * as notif from "../../lib/notification/mod.ts";
import * as ws from "../../lib/workspace/mod.ts";
import * as gi from "../../lib/structure/govn-index.ts";
import * as m from "../../lib/metrics/mod.ts";
import * as extn from "../../lib/module/mod.ts";
import * as tab from "../../lib/tabular/mod.ts";
import * as oGovn from "../../core/originate/governance.ts";
import * as fsg from "../../core/originate/file-sys-globs.ts";
import * as tfsg from "../../core/originate/typical-file-sys-globs.ts";
import * as reg from "../typical/registry.ts";

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

export const defaultSqlViewsNamespace = "publication" as const;

export interface MutatableEnrichedResource<Resource> {
  enrichesResource: Resource;
}

export type EnrichedResource<Resource> = Readonly<
  MutatableEnrichedResource<Resource>
>;

export const isEnrichedResource = safety.typeGuard<EnrichedResource<unknown>>(
  "enrichesResource",
);

export function enrichResource<Resource>(
  original: Resource,
  enriched: Resource,
): Resource {
  if (isEnrichedResource(original)) {
    if (enriched === original.enrichesResource) return enriched;
    throw new Error(`Duplicate enrichment request`);
  }
  (original as unknown as MutatableEnrichedResource<Resource>)
    .enrichesResource = enriched;
  return enriched;
}

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
  readonly constructionDurationStats = new st.RankedStatistics<
    { resource: unknown; statistic: number; provenance: string }
  >();

  onConstructResource<Resource>(
    resource: Resource,
    lcMetrics: fsg.FileSysGlobWalkEntryLifecycleMetrics<Resource>,
  ): void {
    const duration = lcMetrics.originDurationMS;
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
            if (oGovn.isResourceOriginSupplier(resource)) {
              this.memoizedProducers.set(
                ds.contentStrategy.navigation.location(unit),
                {
                  unit,
                  isReloadRequired: () => unit.isModifiedInFileSys(),
                  replay: async () => {
                    const cloned = await resource.origin.resourceFactory();
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
    m.populateStreamMetrics(
      this.constructionDurationStats,
      metrics,
      baggage,
      "publ_resources_origination_duration",
      "resource origination duration",
      "milliseconds",
    );
    m.populateRankMetrics(
      this.constructionDurationStats,
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
  readonly producers = new Map<string, st.StreamStatistics>();

  encounter(identity: string, value: number) {
    let stats = this.producers.get(identity);
    if (!stats) {
      stats = new st.StreamStatistics();
      this.producers.set(identity, stats);
    }
    stats.encounter(value);
  }

  // deno-lint-ignore no-explicit-any
  populateMetrics(metrics: m.Metrics, baggage: any) {
    this.producers.forEach((stats, identity) => {
      m.populateStreamMetrics(
        stats,
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
    rfGovn.FileSysPersistResult
  >();
  readonly persistDurationStats = new st.RankedStatistics<
    { destFileName: string; statistic: number }
  >();

  index(
    destFileName: string,
    fsapee: rfGovn.FileSysPersistResult,
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
    m.populateStreamMetrics(
      this.persistDurationStats,
      metrics,
      baggage,
      "publ_resources_persist_duration",
      "resource persist duration",
      "milliseconds",
    );
    m.populateRankMetrics(
      this.persistDurationStats,
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

export interface ResFactoryHomePathSupplier {
  (relative: string, abs?: boolean): fsg.FileSysPathText;
}

export interface PublicationOperationalContext {
  readonly projectRootPath: PublicationHomePathSupplier;
  readonly resFactoryRootPath?: ResFactoryHomePathSupplier;
  readonly processStartTimestamp: Date;
  readonly isExperimentalOperationalCtx?: boolean;
  readonly isLiveReloadRequest?: boolean;
  readonly iterationCount?: number;
  readonly produceOperationalCtxCargo?: (home: string) => Promise<void>;
  readonly publStateDB: () => psDB.PublicationDatabase;
  readonly publStateDbLocation: (relative?: boolean) => string;
}

export interface Preferences<
  OperationalContext extends PublicationOperationalContext,
> {
  readonly operationalCtx: OperationalContext;
  readonly contentRootPath: fsg.FileSysPathText;
  readonly destRootPath: fsg.FileSysPathText;
  readonly resFactoryRootPath?: fsg.FileSysPathText;
  readonly observability?: rfStd.Observability;
  readonly appName?: string;
  readonly envVarNamesPrefix?: string;
  readonly persistClientCargo?: html.HtmlLayoutClientCargoPersister;
  readonly mGitResolvers?: git.ManagedGitResolvers<string>;
  readonly routeGitRemoteResolver?: rfGovn.RouteGitRemoteResolver<
    html.GitRemoteAnchor
  >;
  readonly routeLocationResolver?: rfStd.RouteLocationResolver;
  readonly wsEditorResolver?: ws.WorkspaceEditorTargetResolver<
    ws.WorkspaceEditorTarget
  >;
  readonly rewriteMarkdownLink?: mdr.MarkdownLinkUrlRewriter;
  readonly fsAssetsWalkers?: (
    config: Configuration<OperationalContext>,
  ) => fsT.FileSystemTabularRecordsWalker[];
  readonly extensionsManager: extn.ExtensionsManager;
  readonly termsManager?: k.TermsManager;
  readonly memoizeProducers?: boolean;
}

export class Configuration<
  OperationalContext extends PublicationOperationalContext,
> implements
  Omit<Preferences<OperationalContext>, "fsAssetsWalkers">,
  rfGovn.ObservableTabularRecordsSupplier {
  readonly operationalCtx: OperationalContext;
  readonly observability?: rfStd.Observability;
  readonly telemetry: telem.Instrumentation<telem.UntypedBaggage> = new telem
    .Telemetry();
  readonly metrics = new m.TypicalMetrics();
  readonly envVarNamesPrefix?: string;
  readonly fsAssetsWalkers: fsT.FileSystemTabularRecordsWalker[];
  readonly contentGit?: git.GitExecutive;
  readonly resFactoryGit?: git.GitExecutive;
  readonly fsRouteFactory: rfStd.FileSysRouteFactory;
  readonly routeLocationResolver?: rfStd.RouteLocationResolver;
  readonly extensionsManager: extn.ExtensionsManager;
  readonly termsManager?: k.TermsManager;
  readonly observabilityRoute: rfGovn.Route;
  readonly diagnosticsRoute: rfGovn.Route;
  readonly contentRootPath: fsg.FileSysPathText;
  readonly destRootPath: fsg.FileSysPathText;
  readonly resFactoryRootPath?: fsg.FileSysPathText;
  readonly appName?: string;
  readonly mGitResolvers?: git.ManagedGitResolvers<string>;
  readonly routeGitRemoteResolver?: rfGovn.RouteGitRemoteResolver<
    html.GitRemoteAnchor
  >;
  readonly wsEditorResolver?: ws.WorkspaceEditorTargetResolver<
    ws.WorkspaceEditorTarget
  >;
  readonly persistClientCargo?: html.HtmlLayoutClientCargoPersister;
  readonly rewriteMarkdownLink?: mdr.MarkdownLinkUrlRewriter;
  readonly memoizeProducers?: boolean;
  readonly originatorRegistry: reg.OriginatorsRegistry;

  constructor(prefs: Preferences<OperationalContext>) {
    this.operationalCtx = prefs.operationalCtx;
    this.observability = prefs.observability;
    this.mGitResolvers = prefs.mGitResolvers;
    this.contentGit = this.mGitResolvers
      ? git.discoverGitWorktreeExecutiveSync(
        prefs.contentRootPath,
        (gp) => new git.TypicalGit(gp, this.mGitResolvers!),
      )
      : undefined;
    this.resFactoryGit = prefs.resFactoryRootPath
      ? (this.mGitResolvers
        ? git.discoverGitWorktreeExecutiveSync(
          prefs.resFactoryRootPath,
          (gp) => new git.TypicalGit(gp, this.mGitResolvers!),
        )
        : undefined)
      : undefined;
    this.contentRootPath = prefs.contentRootPath;
    this.persistClientCargo = prefs.persistClientCargo;
    this.destRootPath = prefs.destRootPath;
    this.resFactoryRootPath = prefs.resFactoryRootPath;
    this.appName = prefs.appName;
    this.routeGitRemoteResolver = prefs.routeGitRemoteResolver;
    this.wsEditorResolver = prefs.wsEditorResolver;
    this.routeLocationResolver = prefs.routeLocationResolver;
    this.fsRouteFactory = new rfStd.FileSysRouteFactory(
      this.routeLocationResolver || rfStd.defaultRouteLocationResolver(),
      this.wsEditorResolver
        ? rfStd.defaultRouteWorkspaceEditorResolver(this.wsEditorResolver)
        : undefined,
    );
    this.observabilityRoute = ocC.observabilityRoute(this.fsRouteFactory);
    this.diagnosticsRoute = ocC.diagnosticsRoute(this.fsRouteFactory);
    this.envVarNamesPrefix = prefs.envVarNamesPrefix;
    this.fsAssetsWalkers = prefs.fsAssetsWalkers
      ? prefs.fsAssetsWalkers(this)
      : [{
        namespace: "origin",
        rootAbsPath: path.resolve(this.contentRootPath),
        options: assetMetricsWalkOptions,
      }, {
        namespace: "destination",
        rootAbsPath: path.resolve(this.destRootPath),
        options: assetMetricsWalkOptions,
      }];
    this.rewriteMarkdownLink = prefs.rewriteMarkdownLink;
    this.extensionsManager = prefs.extensionsManager;
    this.termsManager = prefs.termsManager;
    this.memoizeProducers = prefs.memoizeProducers;
    this.originatorRegistry = new reg.OriginatorsRegistry(
      defaultSqlViewsNamespace,
    );

    this.observability?.events.emitSync("sqlViewsSupplier", this);
  }

  async *observableTabularRecords(
    viewNamesStrategy = (name: "config") => name,
  ) {
    const configRB = tab.tabularRecordsAutoRowIdBuilder<{
      property: string;
      value: unknown;
      elaboration?: string;
    }>();

    for (const entry of Object.entries(this)) {
      const [property, value] = entry;
      switch (property) {
        case "appName":
        case "envVarNamesPrefix":
          configRB.upsert({ property, value });
          break;

        case "contentRootPath":
        case "destRootPath":
          configRB.upsert({
            property,
            value,
            elaboration: path.resolve(value),
          });
          break;
      }
    }

    const oc = this.operationalCtx;
    configRB.upsert({
      property: `oc.projectRootPath`,
      value: oc.projectRootPath("", true),
      elaboration: oc.projectRootPath("", false) || Deno.cwd(),
    });
    configRB.upsert({
      property: `oc.resFactoryRootPath`,
      value: oc.resFactoryRootPath?.("", true) ?? "(not supplied)",
      elaboration: oc.resFactoryRootPath?.("", false) ?? "(not supplied)",
    });
    configRB.upsert({
      property: `oc.processStartTimestamp`,
      value: oc.processStartTimestamp,
    });
    configRB.upsert({
      property: `oc.isExperimentalOperationalCtx`,
      value: oc.isExperimentalOperationalCtx,
    });
    configRB.upsert({
      property: `oc.isLiveReloadRequest`,
      value: oc.isLiveReloadRequest,
    });
    configRB.upsert({
      property: `oc.iterationCount`,
      value: oc.iterationCount,
    });
    configRB.upsert({
      property: `oc.publStateDbLocation`,
      value: path.resolve(oc.publStateDbLocation?.()),
      elaboration: path.resolve(oc.publStateDbLocation?.(true)),
    });

    yield tab.definedTabularRecordsProxy<{
      property: string;
      value: unknown;
      elaboration?: string;
    }>(
      {
        identity: viewNamesStrategy("config"),
        namespace: defaultSqlViewsNamespace,
        // we supply columns because elaboration is optional and the SQL defn "detector" will miss that column
        // if the first record doesn't have it defined
        columns: [
          { identity: "property" },
          { identity: "value" },
          { identity: "elaboration" },
        ],
      },
      configRB.records,
    );
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
  readonly observability?: rfStd.Observability;
  readonly routes: PublicationRoutes;
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
    if (ocC.isOperationalCtxRoute(rs)) return undefined;
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
  readonly routes: PublicationRoutes;
}

export abstract class TypicalPublication<
  OperationalContext extends PublicationOperationalContext,
> implements
  Publication<OperationalContext>,
  rfGovn.ObservabilityHealthComponentStatusSupplier,
  rfGovn.ObservableTabularRecordsSupplier {
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
    this.config.mGitResolvers?.registerResolver(routes.gitAssetPublUrlResolver);
    this.diagsOptions = diagsConfig.configureSync();
    const persistedIndex = new PublicationPersistedIndex();
    const resourcesIndex = new PublicationResourcesIndex();
    this.state = {
      observability: config.observability,
      routes,
      resourcesIndex,
      producerStats: new PublicationProducersStatistics(),
      persistedIndex,
    };
    this.config.observability?.events.emit("healthStatusSupplier", this);
    this.config.observability?.events.emit("healthStatusSupplier", this);
    this.fspEventsEmitter.on(
      "afterPersistContributionFile",
      // deno-lint-ignore require-await
      async (result) => {
        // TODO: warn if file written more than once either here or directly in persist
        persistedIndex.index(result.destFileName, result);
      },
    );
    this.fspEventsEmitter.on(
      "afterPersistContributionFileSync",
      (result) => {
        // TODO: warn if file written more than once either here or directly in persist
        persistedIndex.index(result.destFileName, result);
      },
    );
    this.config.observability?.events.emitSync("sqlViewsSupplier", this);
  }

  async *resourcesTabularRecords() {
    const builders = tab.definedTabularRecordsBuilders<
      | "resource_nature"
      | "resource"
      | "resource_route_terminal"
      | "resource_measures"
      | "resource_frontmatter"
      | "resource_model"
      | "resource_index"
      | "resource_fs_origin"
      | "persisted"
    >();
    const resNatureRB = builders.autoRowIdProxyBuilder<{
      mediaType: rfGovn.MediaTypeIdentity;
    }, "mime">({
      identity: "resource_nature",
      namespace: defaultSqlViewsNamespace,
    }, {
      upsertStrategy: {
        exists: (r, _rowID, index) => index("mime")?.get(r.mediaType),
        index: (r, index) => index("mime").set(r.mediaType, r),
      },
    });
    const resourceRB = builders.autoRowIdProxyBuilder<{
      mediaType: rfGovn.MediaTypeIdentity;
      resourceUuid: rfGovn.ResourceIdentity;
      originatorId: tab.TabularRecordIdRef;
      isMemoized: boolean;
      isTextAsync: boolean;
      isTextSync: boolean;
      isHtml: boolean;
      isStructured: boolean;
      isContentModel: boolean;
      hasFrontmatter: boolean;
      properties: string[];
    }, "resourceUUID">({
      identity: "resource",
      namespace: defaultSqlViewsNamespace,
    }, {
      upsertStrategy: {
        exists: (r, _rowID, index) =>
          index("resourceUUID")?.get(r.resourceUuid),
        index: (r, index) => index("resourceUUID").set(r.resourceUuid, r),
      },
    });
    const resTerminalRouteRB = builders.autoRowIdProxyBuilder<
      {
        resourceId: tab.TabularRecordIdRef;
      } & rfGovn.RouteNode
    >({
      identity: "resource_route_terminal",
      namespace: defaultSqlViewsNamespace,
    });
    const resMeasuresRB = builders.autoRowIdProxyBuilder<{
      resourceId: tab.TabularRecordIdRef;
    }>({
      identity: "resource_measures",
      namespace: defaultSqlViewsNamespace,
    });
    const resFileSysOriginRB = builders.autoRowIdProxyBuilder<{
      resourceId: tab.TabularRecordIdRef;
      fsGlobOriginId: tab.TabularRecordIdRef;
      fsGlob: string;
      name: string;
      path: string;
    }>({
      identity: "resource_fs_origin",
      namespace: defaultSqlViewsNamespace,
    });
    const resFrontmatterRB = builders.autoRowIdProxyBuilder<{
      resourceId: tab.TabularRecordIdRef;
      key: string;
      value: unknown;
      valueType: string;
    }>({
      identity: "resource_frontmatter",
      namespace: defaultSqlViewsNamespace,
    });
    const resModelRB = builders.autoRowIdProxyBuilder<{
      resourceId: tab.TabularRecordIdRef;
      model: unknown;
      properties: string[];
    }>({
      identity: "resource_model",
      namespace: defaultSqlViewsNamespace,
    });

    for (const resource of this.state.resourcesIndex.resourcesIndex) {
      // deno-lint-ignore no-explicit-any
      let nature: rfGovn.MediaTypeNature<any> | undefined = undefined;
      if (rfStd.isNatureSupplier(resource)) {
        if (rfStd.isMediaTypeNature(resource.nature)) {
          nature = resource.nature;
          resNatureRB.upsert({ mediaType: nature.mediaType });
        }
      }

      let resTerminalRouteNode: rfGovn.RouteNode | undefined = undefined;
      if (rfStd.isRouteSupplier(resource)) {
        if (resource.route.terminal) {
          resTerminalRouteNode = resource.route.terminal;
        }
      }

      const resourceRecord = resourceRB.upsert({
        mediaType: nature?.mediaType ?? "RF/unknown",
        resourceUuid: rfStd.autoResourceIdentity(resource),
        originatorId:
          oGovn.isOriginatorSupplier(resource) && resource.originatorTR
            ? resource.originatorTR.id
            : -1,
        isMemoized: resTerminalRouteNode
          ? (this.state.resourcesIndex.memoizedProducers.get(
              this.ds.contentStrategy.navigation.location(resTerminalRouteNode),
            )
            ? true
            : false)
          : false,
        isTextAsync: rfStd.isTextSupplier(resource),
        isTextSync: rfStd.isTextSyncSupplier(resource),
        isHtml: rfStd.isHtmlSupplier(resource),
        isStructured: rfStd.isStructuredDataInstanceSupplier(resource),
        isContentModel: rfStd.isContentModelSupplier(resource),
        hasFrontmatter: rfStd.isFrontmatterSupplier(resource),
        properties: Object.keys(resource as Record<string, unknown>),
      });
      const resourceId = resourceRecord.id;

      if (oGovn.isOriginMeasuresSupplier(resource)) {
        resMeasuresRB.upsert({ resourceId, ...resource.originMeasures });
      }

      if (resTerminalRouteNode) {
        // this will add all terminal unit properties
        resTerminalRouteRB.upsert({ resourceId, ...resTerminalRouteNode });
      }

      if (rfStd.isFrontmatterSupplier(resource) && resource.frontmatter) {
        const flattened = tab.flattenObject(resource.frontmatter);
        Object.entries(flattened).forEach((kv) =>
          resFrontmatterRB.upsert({
            resourceId,
            key: kv[0],
            value: kv[1],
            valueType: typeof kv[1],
          })
        );
      }

      if (rfStd.isModelSupplier(resource) && resource.model) {
        resModelRB.upsert({
          resourceId,
          model: resource.model,
          properties: Object.keys(resource.model as Record<string, unknown>),
        });
      }

      if (fsg.isFileSysGlobOriginSupplier(resource)) {
        resFileSysOriginRB.upsert({
          resourceId,
          fsGlobOriginId: resource.originTR ? resource.originTR.id : -1,
          name: resource.origin.name,
          path: resource.origin.path,
          fsGlob: resource.origin.glob.glob,
        });
      }
    }

    const persistedRB = builders.autoRowIdProxyBuilder<{
      resourceId: tab.TabularRecordIdRef;
      destFileName: string;
      persistDurationMs: number;
      contribution: string;
    }>({
      identity: "persisted",
      namespace: defaultSqlViewsNamespace,
    });

    for (const fspr of this.state.persistedIndex.persistedDestFiles.values()) {
      if (rfStd.isIdentifiableResourceSupplier(fspr.context)) {
        const resourceRec = resourceRB.findByIndex(
          "resourceUUID",
          fspr.context.resource.identity,
        );
        persistedRB.upsert({
          resourceId: resourceRec ? resourceRec.id : -2,
          destFileName: fspr.destFileName,
          contribution: fspr.contribution,
          persistDurationMs: fspr.persistDurationMS,
        });
      } else {
        persistedRB.upsert({
          resourceId: -1,
          destFileName: fspr.destFileName,
          contribution: fspr.contribution,
          persistDurationMs: fspr.persistDurationMS,
        });
      }
    }

    const resIndexesRB = builders.autoRowIdProxyBuilder<
      { namespace: string; index: string; resourceId: tab.TabularRecordIdRef }
    >({
      identity: "resource_index",
      namespace: defaultSqlViewsNamespace,
    });

    for (
      const kr of this.state.resourcesIndex.keyedResources.entries()
    ) {
      const [namespace, nsKeysIndex] = kr;
      for (const nsk of nsKeysIndex.entries()) {
        const [index, resources] = nsk;
        for (const resource of resources) {
          if (rfStd.isResourceIdentitySupplier(resource)) {
            const resourceRec = resourceRB.findByIndex(
              "resourceUUID",
              resource.identity,
            );
            const resourceId = resourceRec ? resourceRec.id : -1;
            resIndexesRB.upsert({ namespace, index, resourceId });
          } else {
            resIndexesRB.upsert({ namespace, index, resourceId: "-1" });
          }
        }
      }
    }

    yield* builders.definedTabularRecords();
  }

  async *observableTabularRecords(): AsyncGenerator<
    // deno-lint-ignore no-explicit-any
    tab.DefinedTabularRecords<any>
  > {
    yield* m.tabularMetrics(this.config.metrics.instances);
    yield* fsT.fileSystemTabularRecords(this.config.fsAssetsWalkers);
    yield* this.config.originatorRegistry.definedTabularRecords();
    yield* this.resourcesTabularRecords();
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
      this.config.persistClientCargo?.(this.config.destRootPath),
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
          fsgorSupplier: this.config.originatorRegistry,
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
    const fspEE = this.fspEventsEmitter;
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
            fspEE,
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
        }, fspEE),
      },
      {
        identity: "csvProducer",
        refinery: dtr.csvProducer<PublicationState>(
          this.config.destRootPath,
          this.state,
          fspEE,
        ),
      },
      {
        identity: "textFileProducer",
        refinery: tfr.textFileProducer<PublicationState>(
          this.config.destRootPath,
          this.state,
          {
            eventsEmitter: fspEE,
          },
        ),
      },
      {
        identity: "bundleProducer",
        refinery: br.bundleProducer<PublicationState>(
          this.config.destRootPath,
          this.state,
          {
            eventsEmitter: fspEE,
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
      if (
        this.state.observability &&
        rfStd.isObservabilityHealthComponentSupplier(originator)
      ) {
        this.state.observability.events.emitSync(
          "healthStatusSupplier",
          originator,
        );
      }
      if (
        this.state.observability &&
        rfStd.isObservabilitySqlViewsSupplier(originator)
      ) {
        this.state.observability.events.emitSync(
          "sqlViewsSupplier",
          originator,
        );
      }
      yield* this.originate(originator, refine);
    }
  }

  async produceMetrics(measures: PublicationMeasures) {
    // TODO: generate fs stats and put them here
    // const assetsTree = new fsT.FileSysAssetsTree();
    // for (const walker of this.config.assetsMetricsWalkers) {
    //   await assetsTree.consumeAssets(walker);
    // }
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
      // TODO: put fs assets into CSV / etc.
      // const beforeFSA = Date.now();
      // this.state.assetsMetrics = await fsA.fileSysAnalytics({
      //   assetsTree,
      //   metrics,
      //   metricsNamePrefix: "publ_asset_name_extension_analytics_",
      //   ...commonMetricsBaggage,
      // });
      // metrics.record(
      //   metrics.gaugeMetric(
      //     "publ_lc_asset_name_extension_analytics_compute_duration_milliseconds",
      //     "Time it took to compute file system assets analytics",
      //   ).instance(Date.now() - beforeFSA, commonMetricsBaggage),
      // );
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
              assets: undefined, // TODO: use fs assets tables to store in CSV
              // assets: metricsOp.assetsPEF ||
              //     metricsOp.assetsCSV
              //   ? {
              //     results: this.state.assetsMetrics!,
              //     renderPEF: metricsOp.assetsPEF,
              //     renderCSV: metricsOp.assetsCSV,
              //   }
              //   : undefined,
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
      await resourcesIndex.index(await persist(resource));
    }

    const ocCtxRoute = ocC.operationalCtxRoute(this.config.fsRouteFactory);
    if (ocCtxRoute.terminal) {
      this.config.operationalCtx.produceOperationalCtxCargo?.(
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
      await resourcesIndex.index(resource);
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
        await resourcesIndex.index(await persist(resource));
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
    // ultimately the index contains every originated resource
    const resourcesIndex = this.state.resourcesIndex;

    // find and construct every orginatable resource from file system and other
    // sources; as each resource is prepared, store it in the index -- each
    // resource create child resources recursively and this loop handles all
    // "fanned out" resources as well
    const originateStartMS = Date.now();
    const originationRefinery = this.originationRefinery();
    for await (const resource of this.resources(originationRefinery)) {
      await resourcesIndex.index(resource);
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
    const ri = resourcesIndex.resourcesIndex;
    for (let i = 0; i < ri.length; i++) {
      const resource = ri[i];
      const persisted = await persist(resource);

      // it's possible the persistence middleware may replace the resource so
      // let's make sure we're tracking the right one in the index
      if (resource !== persisted) {
        const enriched = enrichResource(resource, persisted);
        resourcesIndex.reindex(resource, i, enriched);
      }
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
