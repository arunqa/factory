import { events, fs, log, path } from "../deps.ts";
import * as health from "../../lib/health/mod.ts";
import * as govn from "../../governance/mod.ts";
import * as g from "../../lib/git/mod.ts";
import * as r from "../std/route.ts";

export type FileSysPathText = string;
export type FileSysFileNameOnly = string;
export type FileSysGlobText = string;

export interface FileSysGlobWalkEntryLifecycleMetrics<Resource> {
  readonly fsgwe: FileSysGlobWalkEntry<Resource>;
  readonly constructDurationMS: number;
  readonly refineDurationMS?: number;
}

export interface FileSysGlobWalkEntryFactory<Resource> {
  readonly construct: (
    we: FileSysGlobWalkEntry<Resource>,
    options: r.FileSysRouteOptions,
  ) => Promise<Resource>;
  readonly refine?: govn.ResourceRefinery<Resource>;
}

export interface FileSysGlobWalkEntryFactorySupplier<Resource> {
  readonly factory: FileSysGlobWalkEntryFactory<Resource>;
}

export interface FileSysPathGlob<Resource>
  extends
    Partial<FileSysGlobWalkEntryFactorySupplier<Resource>>,
    Partial<r.FileSysRouteOptions> {
  readonly humanFriendlyName?: string;
  readonly glob: FileSysGlobText;
  readonly exclude?: string[];
}

export interface FileSysPath<Resource>
  extends
    Partial<FileSysGlobWalkEntryFactorySupplier<Resource>>,
    Partial<r.FileSysRouteOptions> {
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
}

export interface FileSysPaths<Resource>
  extends
    Partial<FileSysGlobWalkEntryFactorySupplier<Resource>>,
    Partial<r.FileSysRouteOptions> {
  readonly humanFriendlyName: string;
  readonly ownerFileSysPath: FileSysPathText;
  readonly lfsPaths: Iterable<FileSysPath<Resource>>;
  readonly fsRouteFactory: r.FileSysRouteFactory;
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
}

export class FileSysGlobsOriginator<Resource>
  implements
    govn.ResourcesFactoriesSupplier<Resource>,
    govn.ObservabilityHealthComponentStatusSupplier,
    govn.NamespacesSupplier {
  readonly namespaceURIs = ["FileSysGlobsOriginator<Resource>"];
  readonly obsHealthIdentity: govn.ObservabilityHealthComponentCategorySupplier;
  readonly fsee?: FileSysGlobsOriginatorEventEmitter<Resource>;
  readonly oee?: govn.ObservabilityEventsEmitter;
  constructor(
    readonly topLevelLfsPaths: FileSysPaths<Resource>[],
    readonly extensionsManager: govn.ExtensionsManager,
    options?: FileSysGlobsOriginatorOptions<Resource>,
  ) {
    if (options?.eventEmitter) {
      this.fsee = options?.eventEmitter(this);
    }
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
          const fsrOptions: r.FileSysRouteOptions = {
            fsRouteFactory: glob.fsRouteFactory || lfsPath.fsRouteFactory ||
              tllfsPath.fsRouteFactory,
            routeParser: glob.routeParser || lfsPath.routeParser ||
              tllfsPath.routeParser || r.typicalFileSysRouteParser,
            extensionsManager: glob.extensionsManager ||
              lfsPath.extensionsManager ||
              tllfsPath.extensionsManager || this.extensionsManager,
            log: glob.log ||
              lfsPath.log ||
              tllfsPath.log || logger,
          };

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
              resourceFactory: async () => {
                const beforeConstruct = Date.now();
                let resource = await construct(fsgwe, fsrOptions);
                const afterConstruct = Date.now();
                if (refine) resource = await refine(resource);

                if (this.fsee) {
                  // deno-lint-ignore no-explicit-any
                  const lcMetrics: FileSysGlobWalkEntryLifecycleMetrics<any> = {
                    fsgwe,
                    constructDurationMS: Date.now() - beforeConstruct,
                    refineDurationMS: refine
                      ? (Date.now() - afterConstruct)
                      : undefined,
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
