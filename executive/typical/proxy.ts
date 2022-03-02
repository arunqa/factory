import * as colors from "https://deno.land/std@0.123.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.123.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.123.0/fs/mod.ts";
import * as cache from "../../lib/cache/mod.ts";
import * as conf from "../../lib/conf/mod.ts";
import * as s from "../../lib/singleton.ts";
import * as h from "../../lib/health/mod.ts";
import * as rfGovn from "../../governance/mod.ts";
import * as rfStd from "../../core/std/mod.ts";
import * as mr from "../../core/resource/module/module.ts";
import * as pkg from "../../lib/package/mod.ts";
import * as fsLink from "../../lib/fs/link.ts";
import * as task from "../../lib/task/fetch.ts";
import * as r from "../../lib/text/readability.ts";
import "./observability.ts"; // for window.observability global variable

export interface TypicalProxyableFileSysModelArguments<Model, OriginContext>
  extends
    Omit<
      cache.ProxyableFileSysModelLifecycle<Model, OriginContext>,
      "constructFromCachedProxy" | "cacheProxied"
    >,
    Partial<
      Pick<
        cache.ProxyableFileSysModelArguments<Model, OriginContext>,
        "constructFromCachedProxy" | "cacheProxied"
      >
    > {
  readonly proxyHomePath: string;
  readonly envVarNamesPrefix: string;
  readonly healthStatus: {
    componentId: string;
    category: string;
    links?: Record<string, string>;
  };
  readonly modelUnit?: string;
}

function typicalProxyableFileSysModelArguments<Model, OriginContext>(
  args: TypicalProxyableFileSysModelArguments<Model, OriginContext>,
): cache.ProxyableFileSysModelArguments<Model, OriginContext> {
  return {
    proxyFilePathAndName: path.join(
      args.proxyHomePath,
      args.modelUnit ? `${args.modelUnit}` : `model.json`,
    ),
    proxyStrategy: cache.modelProxyEnvVarAgeStrategy(args.envVarNamesPrefix),
    constructFromCachedProxy: async (pfsr) => {
      try {
        return JSON.parse(
          await Deno.readTextFile(
            pfsr.proxyStrategyResult.proxyFilePathAndName,
          ),
        );
      } catch (err) {
        console.error(
          colors.red(
            `Error attempting to construct from cached proxy ${pfsr.proxyStrategyResult.proxyFilePathAndName} in typicalProxyableFileSysModelArguments: ${err}`,
          ),
        );
      }
    },
    cacheProxied: async (model, fsmpsr) => {
      await rfStd.persistFlexibleFileCustom(
        {
          text: JSON.stringify(model, undefined, "  "),
        },
        fsmpsr.proxyFilePathAndName,
        {
          ensureDirSync: fs.ensureDirSync,
        },
      );
      return model;
    },
    ...args,
  };
}

export function typicalProxyableFileSysModel<Model, OriginContext>(
  args: TypicalProxyableFileSysModelArguments<Model, OriginContext>,
): cache.ProxyableModel<Model> {
  return cache.proxyableMemoryFirstFileSysModel<Model, OriginContext>(
    typicalProxyableFileSysModelArguments<Model, OriginContext>(args),
  );
}

export function typicalProxyableFileSysModelHealthStatusEmitter<
  Model,
  OriginContext,
>(
  args: TypicalProxyableFileSysModelArguments<Model, OriginContext>,
): cache.ProxyableModel<Model> {
  return cache.proxyableMemoryFirstFileSysModel<Model, OriginContext>(
    typicalProxyableFileSysHealthStatusEmitterArguments<Model, OriginContext>(
      {
        ...typicalProxyableFileSysModelArguments(args),
        envVarNamesPrefix: args.envVarNamesPrefix,
        healthStatus: args.healthStatus,
      },
    ),
  );
}

// A "syncable asset" is a local file ("asset") which has a default version in
// the Git repo is a proxied cache for a canonical version somewhere else.

export function typicalProxyableFileSysHealthStatusEmitterArguments<
  Model,
  OriginContext,
>(
  pmfsa: cache.ProxyableFileSysModelArguments<Model, OriginContext> & {
    readonly envVarNamesPrefix: string;
    readonly healthStatus: {
      componentId: string;
      category: string;
      links?: Record<string, string>;
    };
  },
): cache.ProxyableFileSysModelArguments<Model, OriginContext> {
  const relFilePath = (fsrpsr: cache.FileSysModelProxyStrategyResult) => {
    return path.isAbsolute(fsrpsr.proxyFilePathAndName)
      ? path.relative(Deno.cwd(), fsrpsr.proxyFilePathAndName)
      : fsrpsr.proxyFilePathAndName;
  };
  const result:
    & cache.ProxyableFileSysModelArguments<Model, OriginContext>
    & rfGovn.ObservabilityHealthComponentStatusSupplier
    & {
      obsHealthComponentStatus: {
        evaluated: boolean;
        state?: h.ServiceHealthComponentStatus;
        provenance: (
          links?: Record<string, string>,
        ) => Omit<h.HealthyServiceHealthComponentStatus, "status">;
      };
    } = {
      obsHealthComponentStatus: {
        evaluated: false,
        state: undefined,
        provenance: (
          links?: Record<string, string>,
        ): Omit<h.HealthyServiceHealthComponentStatus, "status"> => {
          return {
            componentId: pmfsa.healthStatus.componentId,
            componentType: "component",
            links: {
              module: import.meta.url,
              ...pmfsa.healthStatus.links,
              ...links,
            },
            time: new Date(),
          };
        },
      },
      obsHealthStatus: async function* () {
        let status: h.ServiceHealthComponentStatus | undefined;
        if (result.obsHealthComponentStatus.evaluated) {
          if (result.configState) {
            const state = await result.configState();
            if (!state.isConfigured) {
              status = h.unhealthyComponent("warn", {
                ...result.obsHealthComponentStatus.provenance(),
                // deno-fmt-ignore
                output: `Unable to originate ${pmfsa.proxyFilePathAndName}, proxy env vars not configured (using stale data)`,
              });
            }
          }
          if (!status) {
            // assume that by now the proxy has been executed
            status = result.obsHealthComponentStatus.state;
          }
        } else {
          status = h.unhealthyComponent("warn", {
            ...result.obsHealthComponentStatus.provenance(),
            // deno-fmt-ignore
            output: `Unable to establish health of ${pmfsa.proxyFilePathAndName}, obsHealthStatus was executed before obsHealthComponentStatus.evaluated was set`,
          });
        }
        yield {
          category: pmfsa.healthStatus.category,
          status: status ||
            h.unhealthyComponent("fail", {
              ...result.obsHealthComponentStatus.provenance(),
              output: "indeterminate",
            }),
        };
      },
      ...pmfsa,
      constructFromOrigin: (oc, fsrpsr, args) => {
        result.obsHealthComponentStatus.evaluated = true;
        result.obsHealthComponentStatus.state = h.healthyComponent(
          result.obsHealthComponentStatus.provenance({
            action: "acquired",
            target: relFilePath(fsrpsr),
            remarks: fsrpsr.proxyRemarks,
          }),
        );
        return pmfsa.constructFromOrigin(oc, fsrpsr, args);
      },
      constructFromCachedProxy: (state, args) => {
        // `Using cached content: ${relFilePath(state.proxyStrategyResult)} (${state.proxyStrategyResult.proxyRemarks})`
        result.obsHealthComponentStatus.evaluated = true;
        result.obsHealthComponentStatus.state = h.healthyComponent(
          result.obsHealthComponentStatus.provenance({
            action: "used-cached",
            strategy: relFilePath(state.proxyStrategyResult),
            remarks: state.proxyStrategyResult.proxyRemarks,
          }),
        );
        return pmfsa.constructFromCachedProxy(state, args);
      },
      constructFromError: (issue, cachedProxy, args) => {
        result.obsHealthComponentStatus.evaluated = true;
        if (cachedProxy) {
          result.obsHealthComponentStatus.state = h.unhealthyComponent(
            "warn",
            {
              ...result.obsHealthComponentStatus.provenance({
                "proxy-available": "yes",
                diagnostics: JSON.stringify(issue),
              }),
              output: issue.proxyStrategyResult.proxyRemarks,
            },
          );
        } else {
          result.obsHealthComponentStatus.state = h.unhealthyComponent(
            "fail",
            {
              ...result.obsHealthComponentStatus.provenance({
                "proxy-available": "no",
                diagnostics: JSON.stringify(issue),
              }),
              output: issue.proxyStrategyResult.proxyRemarks,
            },
          );
        }
        return pmfsa.constructFromError(issue, cachedProxy, args);
      },
    };
  if (window.observability) {
    window.observability.events.emit("healthStatusSupplier", result);
  } else {
    console.warn(
      `window.observability not available, typicalProxyableFileSysHealthStatusEmitterArguments healthStatusSupplier not set`,
    );
  }
  return result;
}

export function typicalProxyableFileSysConsoleEmitterArguments<
  Model,
  OriginContext,
>(
  pmfsa: cache.ProxyableFileSysModelArguments<Model, OriginContext> & {
    readonly envVarNamesPrefix: string;
  },
): cache.ProxyableFileSysModelArguments<Model, OriginContext> {
  if (window.disableAllProxies) {
    return pmfsa;
  }
  const config = new conf.TypicalEnvArgumentsConfiguration<
    { verbose: boolean }
  >(
    () => ({ verbose: false }),
    (ec) => ({ properties: [ec.booleanProperty("verbose")] }),
    pmfsa.envVarNamesPrefix,
  );
  const envVars = config.configureSync();
  if (envVars.verbose) {
    console.log(
      colors.brightBlue(
        `${pmfsa.envVarNamesPrefix}VERBOSE ${
          colors.gray("(typicalProxyableFileSysConsoleEmitterArguments)")
        }`,
      ),
    );
    const relFilePath = (fsrpsr: cache.FileSysModelProxyStrategyResult) => {
      return path.isAbsolute(fsrpsr.proxyFilePathAndName)
        ? path.relative(Deno.cwd(), fsrpsr.proxyFilePathAndName)
        : fsrpsr.proxyFilePathAndName;
    };
    return {
      ...pmfsa,
      // configState is optional so only wrap the function if it's defined
      configState: pmfsa.configState
        ? (async () => {
          const state = await pmfsa.configState!();
          if (!state.isConfigured) {
            // deno-fmt-ignore
            console.info(colors.brightRed(`Unable to originate ${colors.brightCyan(pmfsa.proxyFilePathAndName)}, proxy env vars not configured (using stale data)`));
          }
          return state;
        })
        : undefined,
      constructFromOrigin: (oc, fsrpsr, args) => {
        // deno-fmt-ignore
        console.info(colors.cyan(`Acquiring ${colors.brightCyan(relFilePath(fsrpsr))} from origin: ${fsrpsr.proxyRemarks}`));
        return pmfsa.constructFromOrigin(oc, fsrpsr, args);
      },
      constructFromCachedProxy: (state, args) => {
        // deno-fmt-ignore
        console.info(colors.gray(`Using cached content: ${relFilePath(state.proxyStrategyResult)} (${state.proxyStrategyResult.proxyRemarks})`));
        return pmfsa.constructFromCachedProxy(state, args);
      },
      constructFromError: (issue, cachedProxy, args) => {
        // deno-fmt-ignore
        console.info(colors.red(`Error encountered, ${cachedProxy ? `proxy available`: 'proxy not available'} ${colors.gray(`(check operational-context/observability/health.json for diagnostics)`)}`));
        return pmfsa.constructFromError(issue, cachedProxy, args);
      },
    };
  } else {
    console.info(colors.gray(`${pmfsa.envVarNamesPrefix}VERBOSE is not set`));
  }
  return pmfsa;
}

export const typicalSyncableAssetEnvVarNamesPrefix = `SYNCABLE_ASSETS_PROXY_`;

export interface TypicalSyncableAssetArguments extends
  Omit<
    cache.ProxyableFileSysModelLifecycle<string, boolean>,
    | "proxyFilePathAndName"
    | "constructFromCachedProxy"
    | "isOriginAvailable"
    | "constructFromOrigin"
    | "constructFromError"
  > {
  readonly assetPath: string;
  readonly envVarNamesPrefix?: string;
  readonly healthStatus: {
    componentId: string;
    category: string;
    links?: Record<string, string>;
  };
}

function typicalSyncableAssetArguments(
  args: TypicalSyncableAssetArguments,
): cache.ProxyableFileSysModelArguments<string, boolean> {
  return {
    proxyFilePathAndName: args.assetPath,
    proxyStrategy: cache.modelProxyEnvVarAgeStrategy(
      args.envVarNamesPrefix || typicalSyncableAssetEnvVarNamesPrefix,
    ),
    // deno-lint-ignore require-await
    constructFromCachedProxy: async (proxied) => {
      // a version of the file will always be present, no need to do anything
      return proxied.proxyStrategyResult.proxyFilePathAndName;
    },
    // deno-lint-ignore require-await
    isOriginAvailable: async () => true,
    // deno-lint-ignore require-await
    constructFromOrigin: async (_oc, sr) => sr.proxyFilePathAndName,
    // deno-lint-ignore require-await
    constructFromError: async (_issue, cachedProxy) =>
      cachedProxy || args.assetPath,
    ...args,
  };
}

export function typicalSyncableAsset(
  args: TypicalSyncableAssetArguments,
): cache.ProxyableModel<string> {
  return cache.proxyableMemoryFirstFileSysModel<string, boolean>(
    typicalSyncableAssetArguments(args),
  );
}

export function typicalSyncableAssetConsoleEmitter(
  args: TypicalSyncableAssetArguments,
): cache.ProxyableModel<string> {
  return cache.proxyableMemoryFirstFileSysModel(
    typicalProxyableFileSysHealthStatusEmitterArguments<string, boolean>(
      {
        ...typicalSyncableAssetArguments(args),
        envVarNamesPrefix: args.envVarNamesPrefix ||
          typicalSyncableAssetEnvVarNamesPrefix,
        healthStatus: args.healthStatus,
      },
    ),
  );
}

export function typicalSyncableAssetModuleConstructor(
  args: TypicalSyncableAssetArguments,
): mr.FileSysResourceModuleConstructor<unknown> {
  // deno-lint-ignore require-await
  return async (_we, _o, imported) => {
    const asset = s.SingletonsManager.globalInstance()
      .singletonSync(() => typicalSyncableAssetConsoleEmitter(args));

    return {
      imported,
      // we set this to true so that resourcesFactories will get called
      isChildResourcesFactoriesSupplier: true,
      yieldParentWithChildren: false,
      // deno-lint-ignore require-yield
      resourcesFactories: async function* () {
        // usually we would yield resources but we're just proxying a syncable asset
        await asset.value()();
      },
    };
  };
}

export function typicalSyncableReadableAssetsModuleConstructor(
  readables: () => Generator<
    { originURL: string; assetPath: string; assetName: string }
  >,
): mr.FileSysResourceModuleConstructor<unknown> {
  // deno-lint-ignore require-await
  return async (_we, _o, imported) => {
    return {
      imported,
      // we set this to true so that resourcesFactories will get called
      isChildResourcesFactoriesSupplier: true,
      yieldParentWithChildren: false,
      // deno-lint-ignore require-yield
      resourcesFactories: async function* () {
        // usually we would yield resources but we're just proxying a syncable asset
        // and not actually create any
        for (const readable of readables()) {
          await s.SingletonsManager.globalInstance()
            .singletonSync(() =>
              typicalSyncableAssetConsoleEmitter({
                assetPath: path.join(
                  readable.assetPath,
                  `${readable.assetName}.readable.html`,
                ),
                cacheProxied: async (destPath) => {
                  await task.downloadAsset(
                    readable.originURL,
                    destPath,
                    async (srcEndpoint, destFile, httpResp, mark) => {
                      // see if we have a strong eTag and store it;
                      // if we have an eTag but it's weak ("W/"), discard it
                      // because we want the JSON to be durable and not create
                      // version control conflicts
                      let originETag = httpResp.headers.get("ETag");
                      let originETagNature = originETag
                        ? "strong"
                        : "unavailable";
                      if (
                        originETag && originETag.startsWith("W/")
                      ) {
                        originETag = null;
                        originETagNature = "weak";
                      }
                      const rr = await r.extractReadableHTML(
                        await Deno.readTextFile(destFile),
                      );
                      await Deno.writeTextFile(destFile, rr.content);
                      await Deno.writeTextFile(
                        path.join(
                          readable.assetPath,
                          `${readable.assetName}.readable.json`,
                        ),
                        JSON.stringify({
                          originURL: readable.originURL,
                          originETag,
                          originETagNature,
                          originLastModified: httpResp.headers.get(
                            "Last-Modified",
                          ),
                          ...rr,
                        }),
                      );
                      await task.reportDownloadConsole(
                        destFile,
                        srcEndpoint,
                        httpResp,
                        mark,
                      );
                    },
                    // deno-lint-ignore require-await
                    async (error, srcEndpoint, destFile) => {
                      console.error(
                        `Unable to download ${destFile} from ${srcEndpoint}`,
                      );
                      console.dir(error, { colors: true });
                    },
                  );
                  return destPath;
                },
                healthStatus: {
                  componentId: `${readable.assetPath} ${readable.assetName}`,
                  category: "Syncable Readable Assets",
                  links: { ...readable },
                },
              })
            ).value()();
        }
      },
    };
  };
}

function pdsAssetsEnvVarArgs(proxyEnvVarsPrefix: string) {
  const proxyEE = cache.fileSysDirectoryProxyEventsConsoleEmitter(
    "populateClientCargoDirEventsEmitter",
    proxyEnvVarsPrefix,
  );
  const proxyConfig = new cache
    .FileSysResourceAgeProxyEnvArgumentsConfiguration(
    proxyEnvVarsPrefix,
    cache.FileSysResourceAgeProxyEnvArgumentsConfiguration.ageOneDayMS,
  );
  const proxyOptions = proxyConfig.configureSync();
  return { proxyOptions, proxyEE };
}

function pdsAssetsPopulateEnvVarArgs(envVarsPrefix: string) {
  const populateConfig = new conf.TypicalEnvArgumentsConfiguration<
    { verbose: boolean }
  >(
    () => ({ verbose: false }),
    (ec) => ({ properties: [ec.booleanProperty("verbose")] }),
    envVarsPrefix,
  );
  return populateConfig.configureSync();
}

/**
 * Resource Factory Design System ("theme") proxyable assets. Assets can be,
 * optionally, symlink'd to a local directory (for developer convenience) or
 * acquired from a remote (usually GitHub) package if assets are not available
 * locally. Once acquired, the remote copy is proxied (cached) for one day.
 */
export function proxyableDesignSystemAssets(
  {
    clientCargoHome,
    publishDest,
    dsClientCargoRelSrcHome,
    dsClientCargoRelDestHome,
    dsLocalFileSysHomeRel,
    pdsaEnvVarsPrefix,
  }: {
    readonly clientCargoHome: string;
    readonly publishDest: string;
    readonly dsClientCargoRelSrcHome: string;
    readonly dsClientCargoRelDestHome: string;
    readonly dsLocalFileSysHomeRel: string;
    readonly pdsaEnvVarsPrefix: string;
  },
) {
  const { proxyOptions, proxyEE } = pdsAssetsEnvVarArgs(
    `${pdsaEnvVarsPrefix}THEME_PROXY_`,
  );
  const populateOptions = pdsAssetsPopulateEnvVarArgs(
    `${pdsaEnvVarsPrefix}POPULATE_`,
  );

  const destination = path.join(clientCargoHome, dsClientCargoRelDestHome);

  const dsLocalFileSysHome = path.resolve(
    clientCargoHome,
    dsLocalFileSysHomeRel,
  );
  const localPackage = pkg.symlinkChildren(
    path.join(
      dsLocalFileSysHome,
      dsClientCargoRelSrcHome,
    ),
    path.join(publishDest, dsClientCargoRelDestHome),
    undefined,
    populateOptions.verbose
      ? fsLink.symlinkDirectoryChildrenConsoleReporters
      : undefined,
  );

  const ghPackagePath = "resFactory/factory";
  const remotePackage = pkg.gitHubPackageCustom(
    {
      name: ghPackagePath,
    },
    destination,
    async (_gpmPkg, tmpPath, dest) => {
      const srcPath = path.join(tmpPath, "factory", dsClientCargoRelSrcHome);
      if (populateOptions.verbose) {
        console.info(
          colors.green(
            `${colors.gray(`[${ghPackagePath}]`)} acquired ${
              colors.white(srcPath)
            } as ${dest}`,
          ),
        );
      }
      await fs.move(srcPath, dest, { overwrite: true });
    },
  );

  const proxyable = new pkg.RemotePackageFileSysProxy(
    destination,
    cache.fileSysDirectoryAgeProxyStrategy(proxyOptions.maxAgeInMS),
    [{
      acquire: async () => {
        if (await fs.exists(dsLocalFileSysHome)) {
          if (await localPackage.acquire()) {
            if (populateOptions.verbose) {
              console.info(colors.gray(
                `${dsLocalFileSysHomeRel} found, symlink'd for development convenience`,
              ));
            }
            return true;
          }
          console.info(colors.red(
            `${dsLocalFileSysHomeRel} found, but symlinking for development convenience failed: localPackage.acquire() is false`,
          ));
        } else {
          if (populateOptions.verbose) {
            console.info(colors.gray(
              `${dsLocalFileSysHome} not found, acquiring from remote`,
            ));
          }
        }
        return await remotePackage.acquire();
      },
    }],
    proxyEE,
  );
  return { proxyable, populateOptions };
}
