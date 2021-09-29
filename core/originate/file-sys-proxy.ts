import { colors, events, fs, path } from "../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as conf from "../../lib/conf/mod.ts";

declare global {
  interface Window {
    fsrProxyEventsEmitters: Map<string, FileSysResourceProxyEventsEmitter>;
    fsdProxyEventsEmitters: Map<string, FileSysDirectoryProxyEventsEmitter>;
  }
}

if (!window.fsrProxyEventsEmitters) {
  window.fsrProxyEventsEmitters = new Map();
}
if (!window.fsdProxyEventsEmitters) {
  window.fsdProxyEventsEmitters = new Map();
}

export class FileSysResourceProxyEventsEmitter extends events.EventEmitter<{
  proxyStrategyResult(psr: FileSysResourceProxyStrategyResult): void;
  constructFromOrigin<OriginContext, Resource>(
    ctx: OriginContext,
    resource: Resource,
  ): void;
  constructFromProxy<Resource>(
    pfsr: ProxiedFileSysResource,
    resource: Resource & ProxiedFileSysResource,
  ): void;
  constructErrorProxy<Resource>(
    pfsr: govn.ProxiedResourceNotAvailable,
    resource: Resource,
  ): void;
  persistProxy<Resource>(
    resource: Resource,
    destFile: string,
  ): void;
}> {
  isVerbose: boolean;
  constructor(isVerbose: boolean) {
    super();
    this.isVerbose = isVerbose;
  }
}

export function fileSysResourceProxyEventsConsoleEmitter(
  cacheKey: string,
  envVarsPrefix: string,
): FileSysResourceProxyEventsEmitter {
  const config = new conf.TypicalEnvArgumentsConfiguration<
    { verbose: boolean }
  >(
    () => ({ verbose: false }),
    (ec) => ({ properties: [ec.booleanProperty("verbose")] }),
    envVarsPrefix,
  );
  const envVars = config.configureSync();
  let result: FileSysResourceProxyEventsEmitter;
  const cachedEE = window.fsrProxyEventsEmitters.get(cacheKey);
  if (!cachedEE) {
    if (envVars.verbose) {
      console.log(
        colors.brightBlue(
          `${cacheKey}: verbose ${
            colors.gray(
              `(${envVarsPrefix}VERBOSE FileSysResourceProxyEventsEmitter)`,
            )
          }`,
        ),
      );
    }
    result = new FileSysResourceProxyEventsEmitter(envVars.verbose);
    window.fsrProxyEventsEmitters.set(cacheKey, result);
    result.on("proxyStrategyResult", (psr) => {
      if (result.isVerbose) {
        const relFilePath = path.isAbsolute(psr.proxyFilePathAndName)
          ? path.relative(Deno.cwd(), psr.proxyFilePathAndName)
          : psr.proxyFilePathAndName;
        if (psr.isConstructFromOrigin) {
          console.info(
            colors.cyan(
              `Acquiring ${
                colors.brightCyan(relFilePath)
              } from origin: ${psr.constructFromOriginReason}`,
            ),
          );
        } else {
          console.info(colors.gray(
            `Using cached content: ${relFilePath}`,
          ));
        }
      }
    });
  } else {
    result = cachedEE;
  }
  return result;
}

export interface FileSysResourceAgeProxyArguments {
  readonly maxAgeInMS: number;
}

export class FileSysResourceAgeProxyEnvArgumentsConfiguration
  extends conf.AsyncEnvConfiguration<FileSysResourceAgeProxyArguments, never> {
  static readonly ageOneSecondMS = 1000;
  static readonly ageOneMinuteMS = this.ageOneSecondMS * 60;
  static readonly ageOneHourMS = this.ageOneMinuteMS * 60;
  static readonly ageOneDayMS = this.ageOneHourMS * 24;

  constructor(
    envVarNamesPrefix?: string,
    readonly maxAgeInMS =
      FileSysResourceAgeProxyEnvArgumentsConfiguration.ageOneHourMS,
  ) {
    super(
      (ec) => ({
        properties: [
          ec.numericProperty("maxAgeInMS"),
        ],
      }),
      (propName) => {
        const [name] = conf.propertyName(propName);
        return `${envVarNamesPrefix || ""}${conf.camelCaseToEnvVarName(name)}`;
      },
      // setting RF_ENVCONFIGEE_FSR_PROXY_VERBOSE=true will allow debugging
      conf.envConfigurationEventsConsoleEmitter(
        "RF_ENVCONFIGEE_FSR_PROXY_VERBOSE",
      ),
    );
  }

  constructSync(): FileSysResourceAgeProxyArguments {
    return {
      maxAgeInMS: this.maxAgeInMS,
    };
  }
}

export interface ProxiedFileSysResource extends govn.ProxiedResource {
  readonly proxyStrategyResult: FileSysResourceProxyStrategyResult;
}

export interface ProxyableFileSysOriginSupplier<Resource, OriginContext> {
  readonly isOriginAvailable: (
    fsrpsr: FileSysResourceProxyStrategyResult,
  ) => Promise<OriginContext | false>;
  readonly acquireOrigin: (po: OriginContext) => Promise<Resource>;
}

export interface FileSysResourceProxyStrategyResult
  extends govn.ResourceProxyStrategyResult {
  readonly proxyFilePathAndName: string;
  readonly proxyFileInfo?: Deno.FileInfo;
}

export interface FileSysResourceProxyStrategy {
  (proxyFilePathAndName: string): Promise<FileSysResourceProxyStrategyResult>;
}

export const fileSysResourceNeverProxyStrategy: FileSysResourceProxyStrategy =
  // deno-lint-ignore require-await
  async (proxyFilePathAndName) => {
    return {
      proxyFilePathAndName,
      isConstructFromOrigin: true,
      constructFromOriginReason:
        `fileSysResourceNeverProxyStrategy always ignores proxies`,
    };
  };

export function fileSysResourceAgeProxyStrategy(
  maxAgeInMS: number,
): FileSysResourceProxyStrategy {
  return async (proxyFilePathAndName) => {
    const relFilePath = path.isAbsolute(proxyFilePathAndName)
      ? path.relative(Deno.cwd(), proxyFilePathAndName)
      : proxyFilePathAndName;
    if (fs.existsSync(proxyFilePathAndName)) {
      const proxyFileInfo = await Deno.stat(proxyFilePathAndName);
      if (proxyFileInfo && proxyFileInfo.mtime) {
        const proxyAgeMS = Date.now() - proxyFileInfo.mtime.valueOf();
        if (proxyAgeMS > maxAgeInMS) {
          return {
            proxyFilePathAndName,
            isConstructFromOrigin: true,
            proxyFileInfo,
            constructFromOriginReason:
              `${relFilePath} age (${proxyAgeMS} ms) is older than max age (${maxAgeInMS} ms)`,
          };
        }
        return {
          proxyFilePathAndName,
          isConstructFromOrigin: false,
          proxyFileInfo,
          constructFromOriginReason:
            `${relFilePath} age (${proxyAgeMS} ms) is less than max age (${maxAgeInMS} ms)`,
        };
      } else {
        return {
          proxyFilePathAndName,
          isConstructFromOrigin: true,
          constructFromOriginReason:
            // deno-fmt-ignore
            `${relFilePath} proxyFileInfo.mtime was not successful: proxyFileInfo = ${JSON.stringify(proxyFileInfo)}`,
        };
      }
    } else {
      return {
        proxyFilePathAndName,
        isConstructFromOrigin: true,
        constructFromOriginReason: `${relFilePath} does not exist`,
      };
    }
  };
}

export abstract class ProxyableFileSysResource<Resource, OriginContext>
  implements govn.ResourceFactorySupplier<Resource> {
  constructor(
    readonly proxyFilePathAndName: string,
    readonly proxyStrategy: FileSysResourceProxyStrategy,
    readonly fsrpEE?: FileSysResourceProxyEventsEmitter,
  ) {
  }

  abstract isOriginAvailable(
    fsrpsr: FileSysResourceProxyStrategyResult,
  ): Promise<OriginContext | false>;

  abstract constructFromOrigin(ctx: OriginContext): Promise<Resource>;

  abstract constructFromProxy(
    pfsr: ProxiedFileSysResource,
  ): Promise<Resource & ProxiedFileSysResource>;

  abstract constructErrorProxy(
    pfsr: govn.ProxiedResourceNotAvailable,
  ): Promise<Resource>;

  abstract persistProxy(
    resource: Resource,
    destFile: string,
  ): Promise<Resource>;

  async resourceFactory(): Promise<Resource> {
    const fsrpsr = await this.proxyStrategy(this.proxyFilePathAndName);
    const fsrpEE = this.fsrpEE;
    if (fsrpEE) await fsrpEE.emit("proxyStrategyResult", fsrpsr);
    if (fsrpsr.isConstructFromOrigin) {
      try {
        const po = await this.isOriginAvailable(fsrpsr);
        if (po) {
          const cfo = await this.constructFromOrigin(po);
          if (fsrpEE) fsrpEE.emitSync("constructFromOrigin", po, cfo);
          const pp = await this.persistProxy(cfo, this.proxyFilePathAndName);
          if (fsrpEE) {
            fsrpEE.emitSync("persistProxy", cfo, this.proxyFilePathAndName);
          }
          return pp;
        } else {
          if (fsrpsr.proxyFileInfo) {
            // origin was not available, use the proxy
            const pfsr = { proxyStrategyResult: fsrpsr };
            const cfp = await this.constructFromProxy(pfsr);
            if (fsrpEE) fsrpEE.emitSync("constructFromProxy", pfsr, cfp);

            return cfp;
          }
          // origin was not available, and proxy is not available
          const pfsr = { proxyNotAvailable: true, proxyStrategyResult: fsrpsr };
          const cep = await this.constructErrorProxy(pfsr);
          if (fsrpEE) fsrpEE.emitSync("constructErrorProxy", pfsr, cep);
          return cep;
        }
      } catch (proxyOriginError) {
        // origin was not accessible, and proxy is not available
        const pfsr = {
          proxyStrategyResult: fsrpsr,
          proxyNotAvailable: false,
          proxyOriginError,
        };
        const cep = await this.constructErrorProxy(pfsr);
        if (fsrpEE) {
          fsrpEE.emitSync("constructErrorProxy", pfsr, cep);
        } else {
          console.error(proxyOriginError);
        }
        return cep;
      }
    } else {
      // fsrpsr.isConstructFromOrigin is false
      const pfsr = { proxyStrategyResult: fsrpsr };
      const cfp = await this.constructFromProxy(pfsr);
      if (fsrpEE) fsrpEE.emitSync("constructFromProxy", pfsr, cfp);
      return cfp;
    }
  }
}

export class FileSysDirectoryProxyEventsEmitter extends events.EventEmitter<{
  proxyStrategyResult(psr: FileSysDirectoryProxyStrategyResult): void;
  constructOrigin(proxyPath: string): void;
  constructOriginError(
    psr: FileSysDirectoryProxyStrategyResult,
    error: Error,
  ): void;
  notADirectoryError(proxyPath: string): void;
}> {
  isVerbose: boolean;
  constructor(isVerbose: boolean) {
    super();
    this.isVerbose = isVerbose;
  }
}

export function fileSysDirectoryProxyEventsConsoleEmitter(
  cacheKey: string,
  envVarsPrefix: string,
): FileSysDirectoryProxyEventsEmitter {
  const config = new conf.TypicalEnvArgumentsConfiguration<
    { verbose: boolean }
  >(
    () => ({ verbose: false }),
    (ec) => ({ properties: [ec.booleanProperty("verbose")] }),
    envVarsPrefix,
  );
  const envVars = config.configureSync();
  let result: FileSysDirectoryProxyEventsEmitter;
  const cachedEE = window.fsdProxyEventsEmitters.get(cacheKey);
  if (!cachedEE) {
    if (envVars.verbose) {
      console.log(
        colors.brightBlue(
          `${cacheKey}: verbose ${
            colors.gray(
              `(${envVarsPrefix}VERBOSE FileSysDirectoryProxyEventsEmitter)`,
            )
          }`,
        ),
      );
    }
    result = new FileSysDirectoryProxyEventsEmitter(envVars.verbose);
    window.fsdProxyEventsEmitters.set(cacheKey, result);
    result.on("proxyStrategyResult", (psr) => {
      if (result.isVerbose) {
        const relPath = path.isAbsolute(psr.proxyPath)
          ? path.relative(Deno.cwd(), psr.proxyPath)
          : psr.proxyPath;
        if (psr.isConstructFromOrigin) {
          console.info(colors.cyan(
            `Acquiring path ${
              colors.brightCyan(relPath)
            } from origin: ${psr.constructFromOriginReason}`,
          ));
        } else {
          console.info(colors.gray(
            `Using cached path: ${relPath}`,
          ));
        }
      }
    });
  } else {
    result = cachedEE;
  }
  return result;
}

export interface FileSysDirectoryProxyStrategyResult
  extends govn.ResourceProxyStrategyResult {
  readonly proxyPath: string;
  readonly proxyPathInfo?: Deno.FileInfo;
}

export interface FileSysDirectoryProxyStrategy {
  (proxyPath: string): Promise<FileSysDirectoryProxyStrategyResult>;
}

export const fileSysDirectoryNeverProxyStrategy: FileSysDirectoryProxyStrategy =
  // deno-lint-ignore require-await
  async (proxyPath) => {
    return {
      proxyPath,
      isConstructFromOrigin: true,
      constructFromOriginReason:
        `fileSysDirectoryNeverProxyStrategy always ignores proxies`,
    };
  };

export function fileSysDirectoryAgeProxyStrategy(
  maxAgeInMS: number,
): FileSysDirectoryProxyStrategy {
  return async (proxyPath) => {
    const relPath = path.isAbsolute(proxyPath)
      ? path.relative(Deno.cwd(), proxyPath)
      : proxyPath;
    if (fs.existsSync(proxyPath)) {
      const proxyPathInfo = await Deno.stat(proxyPath);
      if (proxyPathInfo && proxyPathInfo.mtime) {
        const proxyAgeMS = Date.now() - proxyPathInfo.mtime.valueOf();
        if (proxyAgeMS > maxAgeInMS) {
          return {
            proxyPath,
            isConstructFromOrigin: true,
            proxyPathInfo,
            constructFromOriginReason:
              `${relPath} age (${proxyAgeMS} ms) is older than max age (${maxAgeInMS} ms)`,
          };
        }
        return {
          proxyPath,
          isConstructFromOrigin: false,
          proxyPathInfo,
          constructFromOriginReason:
            `${relPath} age (${proxyAgeMS} ms) is less than max age (${maxAgeInMS} ms)`,
        };
      } else {
        return {
          proxyPath,
          isConstructFromOrigin: true,
          constructFromOriginReason:
            // deno-fmt-ignore
            `${relPath} proxyPathInfo.mtime was not successful: proxyFileInfo = ${JSON.stringify(proxyPathInfo)}`,
        };
      }
    } else {
      return {
        proxyPath,
        isConstructFromOrigin: true,
        constructFromOriginReason: `${relPath} does not exist`,
      };
    }
  };
}

export abstract class ProxyableFileSysDirectory<OriginContext> {
  static readonly ageOneSecondMS = 1000;
  static readonly ageOneMinuteMS = this.ageOneSecondMS * 60;
  static readonly ageOneHourMS = this.ageOneMinuteMS * 60;
  static readonly ageOneDayMS = this.ageOneHourMS * 24;

  constructor(
    readonly proxyPath: string,
    readonly proxyStrategy: FileSysDirectoryProxyStrategy,
    readonly fsdpEE?: FileSysDirectoryProxyEventsEmitter,
  ) {
  }

  abstract isOriginAvailable(
    fsdpsr: FileSysDirectoryProxyStrategyResult,
  ): Promise<OriginContext | false>;

  abstract constructFromOrigin(ctx: OriginContext): Promise<void>;

  relativePath(newPath: string): string {
    return path.join(this.proxyPath, newPath);
  }

  removeProxyPath(existing: Deno.FileInfo): boolean {
    if (existing.isDirectory) {
      Deno.removeSync(this.proxyPath, { recursive: true });
      return true;
    } else {
      if (this.fsdpEE) {
        this.fsdpEE.emitSync("notADirectoryError", this.proxyPath);
      } else {
        console.warn(
          `${this.proxyPath} is not a directory, unable to remove (ProxyableFileSysDirectory.removeProxyPath)`,
        );
      }
      return false;
    }
  }

  async prepareDirectory(): Promise<void> {
    const fsdpsr = await this.proxyStrategy(this.proxyPath);
    const fsdpEE = this.fsdpEE;
    if (fsdpEE) fsdpEE.emitSync("proxyStrategyResult", fsdpsr);
    if (fsdpsr.isConstructFromOrigin) {
      try {
        const po = await this.isOriginAvailable(fsdpsr);
        if (po) {
          // if no `stat` path does not exist
          if (fsdpsr.proxyPathInfo) this.removeProxyPath(fsdpsr.proxyPathInfo);
          await this.constructFromOrigin(po);
          if (fsdpEE) fsdpEE.emit("constructOrigin", this.proxyPath);
        }
      } catch (proxyOriginError) {
        if (fsdpEE) {
          fsdpEE.emitSync("constructOriginError", fsdpsr, proxyOriginError);
        } else {
          console.error(proxyOriginError);
        }
      }
    }
  }
}
