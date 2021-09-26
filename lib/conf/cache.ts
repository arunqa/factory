import * as govn from "./governance.ts";

export type ConfigurationCacheKey = string;

export interface ConfigurationCacheExpirationStrategy<Configuration, Context> {
  (
    cached: ConfigurationCache<Configuration, Context>,
    ctx: Context,
  ): boolean;
}

export interface ConfigurationCache<Configuration, Context> {
  readonly config: Configuration;
  readonly cachedAt: Date;
  readonly cacheExpired?: ConfigurationCacheExpirationStrategy<
    Configuration,
    Context
  >;
}

export const ageOneSecondMS = 1000;
export const ageOneMinuteMS = ageOneSecondMS * 60;
export const ageOneHourMS = ageOneMinuteMS * 60;
export const ageOneDayMS = ageOneHourMS * 24;

export function configCacheAgeExpirationStrategy<Configuration, Context>(
  maxAgeInMS: number,
): ConfigurationCacheExpirationStrategy<Configuration, Context> {
  return (cached) => {
    if ((Date.now() - cached.cachedAt.valueOf()) > maxAgeInMS) return true;
    return false;
  };
}

export class CacheableConfigurationSupplier<Configuration, Context>
  implements
    govn.ConfigurationSupplier<Configuration, Context>,
    govn.ConfigurationSyncSupplier<Configuration, Context> {
  protected cached?: ConfigurationCache<Configuration, Context>;

  constructor(
    readonly proxy:
      & govn.ConfigurationSupplier<Configuration, Context>
      & govn.ConfigurationSyncSupplier<Configuration, Context>,
    readonly cacheExpired?: (
      cached: ConfigurationCache<Configuration, Context>,
      ctx: Context,
    ) => boolean,
  ) {
  }

  async configure(
    ctx: Context,
    config?: Configuration,
  ): Promise<Configuration> {
    if (this.cached) {
      if (
        !this.cacheExpired ||
        (this.cacheExpired && !this.cacheExpired(this.cached, ctx))
      ) {
        return this.cached.config;
      }
    }
    const result = await this.proxy.configure(ctx, config);
    this.cached = {
      config: result,
      cachedAt: new Date(),
      cacheExpired: this.cacheExpired,
    };
    return result;
  }

  configureSync(
    ctx: Context,
    config?: Configuration,
  ): Configuration {
    if (this.cached) {
      if (
        !this.cacheExpired ||
        (this.cacheExpired && !this.cacheExpired(this.cached, ctx))
      ) {
        return this.cached.config;
      }
    }
    const result = this.proxy.configureSync(ctx, config);
    this.cached = {
      config: result,
      cachedAt: new Date(),
      cacheExpired: this.cacheExpired,
    };
    return result;
  }
}
