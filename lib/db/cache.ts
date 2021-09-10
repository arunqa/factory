import { govnSvcHealth as health } from "../../deps.ts";
import { redis } from "./deps.ts";
import * as stdC from "../../core/std/cache.ts";

export interface RedisCacheOptions<T> {
  readonly port?: number;
  readonly hostname?: string;
  readonly onSuccess?: (
    init: stdC.TextKeyCache<T>,
    report: Required<Pick<RedisCacheOptions<T>, "port" | "hostname">>,
  ) => void;
  readonly onError?: (
    error: Error,
  ) => [cache: stdC.TextKeyCache<T>, health: stdC.CacheHealth];
}

export async function redisCache<T>(
  options?: RedisCacheOptions<T>,
): Promise<[cache: stdC.TextKeyCache<T>, health: stdC.CacheHealth]> {
  const hostname = options?.hostname || "127.0.0.1";
  const port = options?.port || 6379;
  let client: redis.Redis;
  try {
    client = await redis.connect({ hostname, port });
  } catch (error) {
    const cache = options?.onError
      ? options.onError(error)
      : stdC.lruCache<T>();
    return [cache[0], (keyName: (given: string) => string) => {
      const content: health.ServiceHealthComponentStatus[] = [
        health.unhealthyComponent("warn", {
          componentType: "component",
          componentId: `redis-cache-content`,
          links: {},
          time: new Date(),
          output: `Redis Server ${hostname} at ${port}: ${error}`,
        }),
      ];
      const details: Record<string, health.ServiceHealthComponentDetails> = {
        ...cache[1](keyName).details,
        [keyName("redis")]: content,
      };
      return {
        details: details,
      };
    }];
  }

  const result: stdC.TextKeyCache<T> = {};
  if (options?.onSuccess) {
    options.onSuccess(result, { hostname, port });
  }
  const handler = {
    get: async function (
      obj: stdC.TextKeyCache<T>,
      key: string,
    ): Promise<T | undefined> {
      let entry = obj[key];
      if (!entry) {
        const redisValue = await client.get(key);
        if (redisValue) {
          entry = JSON.parse(redisValue);
          obj[key] = entry;
        }
      }
      return entry;
    },
    set: function (
      obj: stdC.TextKeyCache<T>,
      key: string,
      value: T,
    ): boolean {
      obj[key] = value;
      // this is a Promise but we're not going to wait for finish
      // TODO: add a .then() to track telemetry (fail/pass)
      client.set(
        key,
        JSON.stringify(
          value,
          (_key, value) => typeof value === "bigint" ? value.toString() : value, // return everything else unchanged
        ),
      );
      return true;
    },
  };

  return [new Proxy(result, handler), (keyName: (given: string) => string) => {
    const statistics: Record<string, string> = {};
    Object.entries(result).forEach((entry) => {
      const [key, value] = entry;
      statistics[key] = typeof value === "object"
        ? Object.keys(value).join(", ")
        : (typeof value).toString();
    });
    const content: health.ServiceHealthComponentStatus[] = [
      health.healthyComponent({
        componentType: "component",
        componentId: `redis-cache-content`,
        metricName: "count",
        metricUnit: "cardinal",
        metricValue: Object.keys(result).length,
        links: statistics,
        time: new Date(),
      }),
    ];
    const details: Record<string, health.ServiceHealthComponentDetails> = {
      [keyName("content")]: content,
    };
    return {
      details: details,
    };
  }];
}
