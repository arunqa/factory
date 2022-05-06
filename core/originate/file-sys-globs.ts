import { events, fs, log, path } from "../deps.ts";
import * as safety from "../../lib/safety/mod.ts";
import * as health from "../../lib/health/mod.ts";
import * as fsr from "../../lib/fs/fs-route.ts";
import * as govn from "../../governance/mod.ts";
import * as oGovn from "./governance.ts";
import * as g from "../../lib/git/mod.ts";
import * as res from "../std/resource.ts";
import * as rt from "../std/route.ts";
import * as extn from "../../lib/module/mod.ts";
import * as tab from "../../lib/tabular/mod.ts";
import * as oTab from "./tabular.ts";

export type FileSysPathText = string;
export type FileSysFileNameOnly = string;
export type FileSysGlobText = string;

export type FileSysGlobWalkOriginLifecycleMeasures = oGovn.OriginMeasures<
  typeof oGovn.TypicalOriginLifecycleMeasures[number]
>;

export interface FileSysGlobWalkEntryLifecycleMetrics<Resource>
  extends FileSysGlobWalkOriginLifecycleMeasures {
  readonly fsgwe: FileSysGlobWalkEntry<Resource>;
}

export interface FileSysGlobWalkEntryFactory<Resource> {
  readonly construct: (
    we: FileSysGlobWalkEntry<Resource>,
    options: rt.FileSysRouteOptions,
  ) => Promise<Resource>;
  readonly refine?: govn.ResourceRefinery<Resource>;
}

export interface FileSysGlobWalkEntryFactorySupplier<Resource> {
  readonly factory: FileSysGlobWalkEntryFactory<Resource>;
}

export interface FileSysPathGlob<Resource>
  extends
    Partial<FileSysGlobWalkEntryFactorySupplier<Resource>>,
    Partial<rt.FileSysRouteOptions> {
  readonly humanFriendlyName?: string;
  readonly glob: FileSysGlobText;
  readonly exclude?: string[];
}

export interface FileSysPath<Resource>
  extends
    Partial<FileSysGlobWalkEntryFactorySupplier<Resource>>,
    Partial<rt.FileSysRouteOptions> {
  readonly humanFriendlyName: string;
  readonly fileSysPath: FileSysPathText;
  readonly fileSysGitPaths: false | g.GitPathsSupplier;
  readonly globs: Iterable<FileSysPathGlob<Resource>>;
}

export interface FileSysGlobWalkEntry<Resource>
  extends
    fs.WalkEntry,
    govn.ResourceFactorySupplier<Resource>,
    govn.RouteSupplier {
  readonly ownerFileSysPath: FileSysPathText;
  readonly lfsPath: FileSysPath<Resource>;
  readonly glob: FileSysPathGlob<Resource>;
  readonly fsgorSupplier?: FileSysGlobsOriginatorRegistrySupplier;
  readonly fsGlobOriginTR?: tab.InsertedRecord<
    FileSysGlobOriginatorTabularRecord
  >;
}

export const isPotentialFileSysGlobWalkEntry = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  FileSysGlobWalkEntry<any>
>("name", "path", "ownerFileSysPath", "lfsPath", "glob");

export function isFileSysGlobWalkEntry<Resource>(
  o: unknown,
): o is FileSysGlobWalkEntry<Resource> {
  return res.isResourceFactorySupplier<Resource>(o) && rt.isRouteSupplier(o) &&
    isPotentialFileSysGlobWalkEntry(o);
}

export function isFileSysGlobOriginSupplier<Resource>(
  o: unknown,
): o is oGovn.ResourceOriginSupplier<
  Resource,
  FileSysGlobWalkEntry<Resource>,
  tab.InsertedRecord<FileSysGlobOriginatorTabularRecord>
> {
  return oGovn.isResourceOriginSupplier(o) &&
    isFileSysGlobWalkEntry<Resource>(o.origin);
}

export interface FileSysPaths<Resource>
  extends
    Partial<FileSysGlobWalkEntryFactorySupplier<Resource>>,
    Partial<rt.FileSysRouteOptions> {
  readonly humanFriendlyName: string;
  readonly ownerFileSysPath: FileSysPathText;
  readonly lfsPaths: Iterable<FileSysPath<Resource>>;
  readonly fsRouteFactory: rt.FileSysRouteFactory;
}

export class FileSysGlobsOriginatorEventEmitter<Resource>
  extends events.EventEmitter<{
    beforeYieldWalkEntry(we: FileSysGlobWalkEntry<Resource>): Promise<void>;
    afterConstructResource(
      r: Resource,
      lcMetrics: FileSysGlobWalkEntryLifecycleMetrics<Resource>,
    ): Promise<void>;
  }> {}

export interface FileSysGlobsOriginatorOptions<Resource> {
  readonly eventEmitter?: (
    fsrfs: FileSysGlobsOriginator<Resource>,
  ) => FileSysGlobsOriginatorEventEmitter<
    Resource
  >;
  readonly obsHealthStatusIdentity?:
    govn.ObservabilityHealthComponentCategorySupplier;
  readonly fsgorSupplier?: FileSysGlobsOriginatorRegistrySupplier;
}

export interface FileSysGlobOriginatorTabularRecord
  extends oTab.OriginatorTabularRecordRefSupplier {
  readonly glob: FileSysGlobText;
  readonly exclude: string;
  readonly friendlyName: string;
  readonly construct: string;
  readonly refine: string;
  readonly routeFactory: string;
  readonly routeParser: string;
  readonly gitWorkTree: string;
}

export class FileSysGlobsOriginatorTabularRecordsFactory
  extends oTab.DependentOriginatorTabularRecordsFactory<
    "originator_fs_glob"
  > {
  #originatorTR: oTab.OriginatorTabularRecord;
  readonly fileSysGlobRB: tab.TabularRecordsBuilder<
    tab.InsertableRecord<FileSysGlobOriginatorTabularRecord>,
    tab.InsertedRecord<FileSysGlobOriginatorTabularRecord>
  >;

  get originatorTR() {
    return this.#originatorTR;
  }

  constructor(
    parent: oTab.OriginatorTabularRecordsFactory<"originator">,
  ) {
    super(parent);
    this.#originatorTR = this.parentFactory.originatorRB.upsert({
      originator: `FileSysGlobsOriginator`,
      provenance: import.meta.url,
      enabled: true,
    });
    this.fileSysGlobRB = this.parentFactory.prepareBuilder(
      "originator_fs_glob",
      tab.tabularRecordsAutoRowIdBuilder(),
    );
  }
}

export interface FileSysGlobsOriginatorRegistrySupplier {
  readonly fsgotrFactory: FileSysGlobsOriginatorTabularRecordsFactory;
  // deno-lint-ignore no-explicit-any
  readonly registerRefinery: (rr: govn.ResourceRefinery<any>) => void;
}

export const isProxyablesOriginatorRegistry = safety.typeGuard<
  FileSysGlobsOriginatorRegistrySupplier
>("fsgotrFactory");

export class FileSysGlobsOriginator<Resource>
  implements
    govn.ResourcesFactoriesSupplier<Resource>,
    govn.ObservabilityHealthComponentStatusSupplier,
    govn.NamespacesSupplier {
  readonly namespaceURIs = ["FileSysGlobsOriginator<Resource>"];
  readonly obsHealthIdentity: govn.ObservabilityHealthComponentCategorySupplier;
  readonly fsee?: FileSysGlobsOriginatorEventEmitter<Resource>;
  readonly oee?: govn.ObservabilityEventsEmitter;
  readonly fsgorSupplier?: FileSysGlobsOriginatorRegistrySupplier;
  constructor(
    readonly topLevelLfsPaths: FileSysPaths<Resource>[],
    readonly extensionsManager: extn.ExtensionsManager,
    options?: FileSysGlobsOriginatorOptions<Resource>,
  ) {
    if (options?.eventEmitter) {
      this.fsee = options?.eventEmitter(this);
    }
    this.fsgorSupplier = options?.fsgorSupplier;
    this.obsHealthIdentity = options?.obsHealthStatusIdentity || {
      category: `FileSysGlobsOriginator`,
    };
  }

  async *obsHealthStatus(): AsyncGenerator<
    govn.ObservabilityHealthComponentStatus
  > {
    const time = new Date();
    for (const topLevelPath of this.topLevelLfsPaths) {
      for (const lfsPath of topLevelPath.lfsPaths) {
        for (const glob of lfsPath.globs) {
          const componentId = `FileSysGlobsOriginator ${
            glob.humanFriendlyName ||
            lfsPath.humanFriendlyName ||
            topLevelPath.humanFriendlyName
          } ${glob.glob}`;
          const status = health.healthyComponent({
            componentId,
            componentType: "component",
            links: {
              "module": import.meta.url,
              "ownerFileSysPath": topLevelPath.ownerFileSysPath,
              "fileSysPath": lfsPath.fileSysPath,
            },
            time,
          });
          yield {
            category: this.obsHealthIdentity.category,
            status,
          };
        }
      }
    }
  }

  async *resourcesFactories() {
    const logger = log.getLogger();
    for (const tllfsPath of this.topLevelLfsPaths) {
      for (const lfsPath of tllfsPath.lfsPaths) {
        for (const glob of lfsPath.globs) {
          const construct = glob.factory?.construct ||
            lfsPath.factory?.construct || tllfsPath.factory?.construct;
          const refine = glob.factory?.refine ||
            lfsPath.factory?.refine || tllfsPath.factory?.refine;
          const fsrOptions: rt.FileSysRouteOptions = {
            fsRouteFactory: glob.fsRouteFactory || lfsPath.fsRouteFactory ||
              tllfsPath.fsRouteFactory,
            routeParser: glob.routeParser || lfsPath.routeParser ||
              tllfsPath.routeParser || fsr.typicalFileSysRouteParser,
            extensionsManager: glob.extensionsManager ||
              lfsPath.extensionsManager ||
              tllfsPath.extensionsManager || this.extensionsManager,
            log: glob.log ||
              lfsPath.log ||
              tllfsPath.log || logger,
          };

          let fsGlobOriginTR:
            | tab.InsertedRecord<FileSysGlobOriginatorTabularRecord>
            | undefined;
          if (this.fsgorSupplier) {
            fsGlobOriginTR = this.fsgorSupplier.fsgotrFactory.fileSysGlobRB
              .upsert({
                originatorId: this.fsgorSupplier.fsgotrFactory.originatorTR.id,
                glob: glob.glob,
                friendlyName: glob.humanFriendlyName || "",
                exclude: glob.exclude ? glob.exclude.join(", ") : "",
                construct: construct
                  ? Deno.inspect(construct, { depth: 1 })
                  : "",
                refine: refine ? Deno.inspect(refine, { depth: 1 }) : "",
                routeFactory: Deno.inspect(
                  fsrOptions.fsRouteFactory,
                  { depth: 1 },
                ),
                routeParser: Deno.inspect(fsrOptions.routeParser, { depth: 1 }),
                gitWorkTree: lfsPath.fileSysGitPaths
                  ? lfsPath.fileSysGitPaths.workTreePath
                  : "",
              });
          }

          const rootPath = path.resolve(lfsPath.fileSysPath);
          for await (
            const we of fs.expandGlob(glob.glob, {
              root: rootPath,
              exclude: glob.exclude,
              includeDirs: false,
            })
          ) {
            if (!construct) {
              logger.warning(
                `Unable to use resource ${we.path}: no factory.construct() found in glob ${glob.glob}, lfsPath ${lfsPath.fileSysPath}, or tllfsPath ${tllfsPath.ownerFileSysPath}`,
              );
              continue;
            }

            const fsgwe: FileSysGlobWalkEntry<Resource> = {
              ...we,
              ownerFileSysPath: tllfsPath.ownerFileSysPath,
              lfsPath,
              glob,
              route: await fsrOptions.fsRouteFactory.fsRoute(
                we.path,
                rootPath,
                fsrOptions,
              ),
              fsgorSupplier: this.fsgorSupplier,
              fsGlobOriginTR,
              resourceFactory: async () => {
                // performance.now() is higher resolution but Date.now() is faster
                const beforeConstruct = Date.now();
                let resource = await construct(fsgwe, fsrOptions);
                const afterConstruct = Date.now();
                if (refine) {
                  this.fsgorSupplier?.registerRefinery(refine);
                  resource = await refine(resource);
                }

                const originMeasures: FileSysGlobWalkOriginLifecycleMeasures = {
                  originConstructDurationMS: afterConstruct - beforeConstruct,
                  originMiddlewareDurationMS: refine
                    ? (Date.now() - afterConstruct)
                    : undefined,
                  originDurationMS: Date.now() - beforeConstruct,
                };

                // support memoization (rfExplorer server use cases); calling
                // resource.origin.resourceFactory() will "replay" the memoized
                // resource and allow hot reloading in the client.
                const mos = ((resource as unknown) as (
                  & oGovn.MutatableResourceOriginatorSupplier<
                    FileSysGlobsOriginator<Resource>
                  >
                  & oGovn.MutatableResourceOriginSupplier<
                    Resource,
                    FileSysGlobWalkEntry<Resource>,
                    tab.InsertedRecord<FileSysGlobOriginatorTabularRecord>
                  >
                  & oGovn.MutatableOriginMeasuresSupplier<
                    typeof oGovn.TypicalOriginLifecycleMeasures[number]
                  >
                ));
                mos.originator = this;
                mos.originatorRfExplorerNarrativeHTML =
                  `<a href="/workspace/editor-redirect/abs${
                    path.fromFileUrl(import.meta.url)
                  }" title="Edit FileSysGlobsOriginator in IDE"><code>FileSysGlobsOriginator</code></a> glob <code>${lfsPath.fileSysPath}/${glob.glob}${
                    glob.humanFriendlyName ? `(${glob.humanFriendlyName})` : ""
                  }</code>`;
                mos.originatorTR =
                  this.fsgorSupplier?.fsgotrFactory.originatorTR;
                mos.origin = fsgwe;
                mos.originTR = fsGlobOriginTR;
                mos.originMeasures = originMeasures;

                if (this.fsee) {
                  // deno-lint-ignore no-explicit-any
                  const lcMetrics: FileSysGlobWalkEntryLifecycleMetrics<any> = {
                    fsgwe,
                    ...originMeasures,
                  };

                  await this.fsee.emit(
                    "afterConstructResource",
                    resource,
                    lcMetrics,
                  );
                }
                return resource;
              },
            };
            if (this.fsee) await this.fsee.emit("beforeYieldWalkEntry", fsgwe);
            yield fsgwe;
          }
        }
      }
    }
  }
}
