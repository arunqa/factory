import { events, fs, govnSvcHealth as health, log, path } from "../../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as r from "../std/route.ts";

export type FileSysPathText = string;
export type FileSysFileNameOnly = string;
export type FileSysGlobText = string;

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
}

export class FileSysGlobsOriginatorEventEmitter<Resource>
  extends events.EventEmitter<{
    beforeYieldWalkEntry(we: FileSysGlobWalkEntry<Resource>): Promise<void>;
    afterConstructResource(
      r: Resource,
      we: FileSysGlobWalkEntry<Resource>,
    ): Promise<void>;
  }> {}

export interface FileSysGlobsOriginatorOptions<Resource>
  extends Partial<govn.ObservabilityEventsEmitterSupplier> {
  readonly eventEmitter?: (
    fsrfs: FileSysGlobsOriginator<Resource>,
  ) => FileSysGlobsOriginatorEventEmitter<
    Resource
  >;
}

export class FileSysGlobsOriginator<Resource>
  implements
    govn.ResourcesFactoriesSupplier<Resource>,
    govn.ObservabilityHealthComponentStatus,
    govn.NamespacesSupplier {
  readonly namespaceURIs = ["FileSysGlobsOriginator<Resource>"];
  readonly fileSysRoutes: r.FileSysRoutes;
  readonly fsee?: FileSysGlobsOriginatorEventEmitter<Resource>;
  readonly oee?: govn.ObservabilityEventsEmitter;
  constructor(
    readonly topLevelLfsPaths: FileSysPaths<Resource>[],
    readonly extensionsManager: govn.ExtensionsManager,
    options?: FileSysGlobsOriginatorOptions<Resource>,
  ) {
    this.fileSysRoutes = new r.FileSysRoutes();
    if (options?.eventEmitter) {
      this.fsee = options?.eventEmitter(this);
    }
    if (options?.observabilityEE) {
      this.oee = options?.observabilityEE;
    }
    this.oee?.emitSync("healthyOriginator", this);
  }

  obsHealthStatus() {
    const time = new Date();
    return health.healthyComponent({
      componentId: `${this.namespaceURIs.join(", ")} ${
        this.topLevelLfsPaths.map((tlp) => tlp.ownerFileSysPath).join(", ")
      }`,
      componentType: "component",
      links: {},
      time,
    });
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

            const lfswe: FileSysGlobWalkEntry<Resource> = {
              ...we,
              ownerFileSysPath: tllfsPath.ownerFileSysPath,
              lfsPath,
              glob,
              route: await this.fileSysRoutes.route(
                we.path,
                rootPath,
                fsrOptions,
              ),
              resourceFactory: async () => {
                let resource = await construct(lfswe, fsrOptions);
                if (refine) resource = await refine(resource);
                if (this.fsee) {
                  await this.fsee.emit(
                    "afterConstructResource",
                    resource,
                    lfswe,
                  );
                }
                return resource;
              },
            };
            if (this.fsee) await this.fsee.emit("beforeYieldWalkEntry", lfswe);
            yield lfswe;
          }
        }
      }
    }
  }
}
