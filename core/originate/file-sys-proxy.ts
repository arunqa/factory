import { events, fs, path } from "../deps.ts";
import * as govn from "../../governance/mod.ts";

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
}> {}

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

export const ageOneSecondMS = 1000;
export const ageOneMinuteMS = ageOneSecondMS * 60;
export const ageOneHourMS = ageOneMinuteMS * 60;
export const ageOneDayMS = ageOneHourMS * 24;

export function fileSysResourceAgeProxyStrategy(
  maxAgeInMS: number,
): FileSysResourceProxyStrategy {
  return async (proxyFilePathAndName) => {
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
              `${proxyFilePathAndName} age (${proxyAgeMS} ms) is older than max age (${maxAgeInMS} ms)`,
          };
        }
        return {
          proxyFilePathAndName,
          isConstructFromOrigin: false,
          proxyFileInfo,
          constructFromOriginReason:
            `${proxyFilePathAndName} age (${proxyAgeMS} ms) is less than max age (${maxAgeInMS} ms)`,
        };
      } else {
        return {
          proxyFilePathAndName,
          isConstructFromOrigin: true,
          constructFromOriginReason:
            // deno-fmt-ignore
            `${proxyFilePathAndName} proxyFileInfo.mtime was not successful: proxyFileInfo = ${JSON.stringify(proxyFileInfo)}`,
        };
      }
    } else {
      return {
        proxyFilePathAndName,
        isConstructFromOrigin: true,
        constructFromOriginReason: `${proxyFilePathAndName} does not exist`,
      };
    }
  };
}

export interface FileSysResourceAgeOrEnvVarProxyOptions {
  readonly maxAgeInMS: number;
  readonly identity: string;
  readonly envVarNameMutator?: (suggested: string) => string;
  readonly report?: (message: string) => void;
}

export function fileSysResourceAgeOrEnvVarProxyStrategy(
  options: FileSysResourceAgeOrEnvVarProxyOptions,
  ...envVarNames: string[]
): FileSysResourceProxyStrategy {
  const { maxAgeInMS, identity, envVarNameMutator, report } = options;
  if (envVarNames && envVarNames.length > 0) {
    for (const varName of envVarNames) {
      const envVarName = envVarNameMutator
        ? envVarNameMutator(varName)
        : varName;
      const envVarValue = Deno.env.get(envVarName);
      if (typeof envVarValue === "string") {
        const envVarMaxAgeInMS = Number.parseInt(envVarValue);
        if (identity) {
          if (envVarMaxAgeInMS) {
            if (report) {
              report(
                `Proxying ${identity} using age ${envVarMaxAgeInMS} ms using ${envVarName} = ${envVarMaxAgeInMS}`,
              );
            }
            return fileSysResourceAgeProxyStrategy(
              Number.parseInt(envVarValue),
            );
          } else {
            if (report) {
              report(
                `Proxies for ${identity} disabled using ${envVarName} = ${envVarMaxAgeInMS}`,
              );
            }
            return fileSysResourceNeverProxyStrategy;
          }
        }
      }
    }
  }
  return fileSysResourceAgeProxyStrategy(maxAgeInMS);
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
}> {}

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
              `${proxyPath} age (${proxyAgeMS} ms) is older than max age (${maxAgeInMS} ms)`,
          };
        }
        return {
          proxyPath,
          isConstructFromOrigin: false,
          proxyPathInfo,
          constructFromOriginReason:
            `${proxyPath} age (${proxyAgeMS} ms) is less than max age (${maxAgeInMS} ms)`,
        };
      } else {
        return {
          proxyPath,
          isConstructFromOrigin: true,
          constructFromOriginReason:
            // deno-fmt-ignore
            `${proxyPath} proxyPathInfo.mtime was not successful: proxyFileInfo = ${JSON.stringify(proxyPathInfo)}`,
        };
      }
    } else {
      return {
        proxyPath,
        isConstructFromOrigin: true,
        constructFromOriginReason: `${proxyPath} does not exist`,
      };
    }
  };
}

export interface FileSysDirectoryAgeOrEnvVarProxyOptions {
  readonly maxAgeInMS: number;
  readonly identity: string;
  readonly envVarNameMutator?: (suggested: string) => string;
  readonly report?: (message: string) => void;
}

export function fileSysDirectoryAgeOrEnvVarProxyStrategy(
  options: FileSysDirectoryAgeOrEnvVarProxyOptions,
  ...envVarNames: string[]
): FileSysDirectoryProxyStrategy {
  const { maxAgeInMS, identity, envVarNameMutator, report } = options;
  if (envVarNames && envVarNames.length > 0) {
    for (const varName of envVarNames) {
      const envVarName = envVarNameMutator
        ? envVarNameMutator(varName)
        : varName;
      const envVarValue = Deno.env.get(envVarName);
      if (typeof envVarValue === "string") {
        const envVarMaxAgeInMS = Number.parseInt(envVarValue);
        if (identity) {
          if (envVarMaxAgeInMS) {
            if (report) {
              report(
                `Proxying ${identity} using age ${envVarMaxAgeInMS} ms using ${envVarName} = ${envVarMaxAgeInMS}`,
              );
            }
            return fileSysDirectoryAgeProxyStrategy(
              Number.parseInt(envVarValue),
            );
          } else {
            if (report) {
              report(
                `Proxies for ${identity} disabled using ${envVarName} = ${envVarMaxAgeInMS}`,
              );
            }
            return fileSysDirectoryNeverProxyStrategy;
          }
        }
      }
    }
  }
  return fileSysDirectoryAgeProxyStrategy(maxAgeInMS);
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
