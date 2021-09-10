import { govnSvcHealth as health } from "../../deps.ts";

export interface TextKeyCache<T> {
  [key: string]: T;
}

export interface CacheHealthKeyNameTransformer {
  (keyName: string): string;
}

export interface CacheHealth {
  (keyName: CacheHealthKeyNameTransformer): health.ServiceHealthComponents;
}

/**
 * Create a simple LRU cache which looks and acts like a normal object but
 * is backed by a Proxy object that stores expensive to construct objects.
 * @param maxEntries evict cached items after this many entries
 */
export function lruCache<T>(
  maxEntries = 50,
): [cache: TextKeyCache<T>, health: CacheHealth] {
  const result: TextKeyCache<T> = {};
  const handler = {
    // Set objects store the cache keys in insertion order.
    cache: new Set<string>(),
    get: function (obj: TextKeyCache<T>, key: string): T | undefined {
      const entry = obj[key];
      if (entry) {
        // move the most recent key to the end so it's last to be evicted
        this.cache.delete(key);
        this.cache.add(key);
      }
      return entry;
    },
    set: function (obj: TextKeyCache<T>, key: string, value: T): boolean {
      obj[key] = value;
      if (this.cache.size >= maxEntries) {
        // least-recently used cache eviction strategy, the oldest
        // item is the first one in the list
        const keyToDelete = this.cache.keys().next().value;
        delete obj[key];
        this.cache.delete(keyToDelete);
      }
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
        componentId: `local-cache-content`,
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
