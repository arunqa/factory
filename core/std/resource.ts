import * as safety from "../../lib/safety/mod.ts";
import * as govn from "../../governance/mod.ts";
import * as m from "../../lib/metrics/mod.ts";

export const isResourceLifecycleMetricsSupplier = safety.typeGuard<
  govn.ResourceLifecycleMetricsSupplier
>("lifecycleMetrics");

export const isResourceFactorySupplierUntyped = safety.typeGuard<
  govn.ResourceFactorySupplier<unknown>
>("resourceFactory");

export function isResourceFactorySupplier<Resource>(
  o: unknown,
): o is govn.ResourceFactorySupplier<Resource> {
  return isResourceFactorySupplierUntyped(o);
}

export const isResourcesFactoriesSupplierUntyped = safety.typeGuard<
  govn.ResourcesFactoriesSupplier<unknown>
>("resourcesFactories");

export function isResourcesFactoriesSupplier<Resource>(
  o: unknown,
): o is govn.ResourcesFactoriesSupplier<Resource> {
  return isResourcesFactoriesSupplierUntyped(o);
}

export const isChildResourcesFactoriesSupplierUntyped = safety.typeGuard<
  govn.ChildResourcesFactoriesSupplier<unknown>
>("resourcesFactories", "isChildResourcesFactoriesSupplier");

export function isChildResourcesFactoriesSupplier<Resource>(
  o: unknown,
): o is govn.ChildResourcesFactoriesSupplier<Resource> {
  return isChildResourcesFactoriesSupplierUntyped(o);
}

export const isResourcesSupplierUntyped = safety.typeGuard<
  govn.ResourcesSupplier<unknown>
>("resources");

export function isResourcesSupplier<Resource>(
  o: unknown,
): o is govn.ResourcesSupplier<Resource> {
  return isResourcesSupplierUntyped(o);
}

export type ResourcePipeline<Resource> = govn.ResourceRefinery<Resource>[];
export type ResourcePipelineSync<Resource> = govn.ResourceRefinerySync<
  Resource
>[];

export async function traversePipeline<Resource>(
  operateOn: Resource,
  pipeline: ResourcePipeline<Resource>,
): Promise<Resource> {
  let resource = operateOn;
  for (const plUnit of pipeline) {
    resource = await plUnit(resource);
  }
  return resource;
}

export function traversePipelineSync<Resource>(
  operateOn: Resource,
  pipeline: ResourcePipelineSync<Resource>,
): Resource {
  return pipeline.reduce((prev, curr) => curr(prev), operateOn);
}

export async function traversePipelineUnits<Resource>(
  operateOn: Resource,
  ...units: ResourcePipeline<Resource>
): Promise<Resource> {
  let resource = operateOn;
  for (const plUnit of units) {
    resource = await plUnit(resource);
  }
  return resource;
}

export function traversePipelineUnitsSync<Resource>(
  operateOn: Resource,
  ...units: ResourcePipelineSync<Resource>
): Resource {
  return units.reduce((prev, curr) => curr(prev), operateOn);
}

export async function traversePipelines<Resource>(
  operateOn: Resource,
  ...pipelines: ResourcePipeline<Resource>[]
): Promise<Resource> {
  let resource = operateOn;
  for (const pipeline of pipelines) {
    for (const plUnit of pipeline) {
      resource = await plUnit(resource);
    }
  }
  return resource;
}

export function traversePipelinesSync<Resource>(
  operateOn: Resource,
  ...pipelines: ResourcePipelineSync<Resource>[]
): Resource {
  let resource = operateOn;
  for (const pipeline of pipelines) {
    resource = pipeline.reduce((prev, curr) => curr(prev), resource);
  }
  return resource;
}

export function pipelineUnitsRefinery<Resource>(
  ...units: ResourcePipeline<Resource>
): govn.ResourceRefinery<Resource> {
  return async (operateOn) => {
    let resource = operateOn;
    for (const plUnit of units) {
      resource = await plUnit(resource);
    }
    return resource;
  };
}

export function pipelineUnitsRefineryUntyped(
  // deno-lint-ignore no-explicit-any
  ...units: ResourcePipeline<any>
  // deno-lint-ignore no-explicit-any
): govn.ResourceRefinery<any> {
  return async (operateOn) => {
    let resource = operateOn;
    for (const plUnit of units) {
      resource = await plUnit(resource);
    }
    return resource;
  };
}

export function pipelineUnitsRefinerySyncUntyped(
  // deno-lint-ignore no-explicit-any
  ...units: ResourcePipelineSync<any>
  // deno-lint-ignore no-explicit-any
): govn.ResourceRefinerySync<any> {
  return (operateOn) => {
    let resource = operateOn;
    for (const plUnit of units) {
      resource = plUnit(resource);
    }
    return resource;
  };
}

export function pipelineRefiner<Resource>(
  pipeline: ResourcePipeline<Resource>,
): govn.ResourceRefinery<Resource> {
  return async (operateOn) => {
    let resource = operateOn;
    for (const plUnit of pipeline) {
      resource = await plUnit(resource);
    }
    return resource;
  };
}

export function pipelinesRefiner<Resource>(
  pipelines: ResourcePipeline<Resource>[],
): govn.ResourceRefinery<Resource> {
  return async (operateOn) => {
    let resource = operateOn;
    for (const pipeline of pipelines) {
      for (const plUnit of pipeline) {
        resource = await plUnit(resource);
      }
    }
    return resource;
  };
}

export function pipelineUnitsRefinerySync<Resource>(
  ...units: ResourcePipelineSync<Resource>
): govn.ResourceRefinerySync<Resource> {
  return (resource) => {
    return units.reduce((prev, curr) => curr(prev), resource);
  };
}

export function pipelineRefinerySync<Resource>(
  pipeline: ResourcePipelineSync<Resource>,
): govn.ResourceRefinerySync<Resource> {
  return (resource) => {
    return pipeline.reduce((prev, curr) => curr(prev), resource);
  };
}

export function pipelinesRefinerySync<Resource>(
  pipelines: ResourcePipelineSync<Resource>[],
): govn.ResourceRefinerySync<Resource> {
  return (operateOn) => {
    let resource = operateOn;
    for (const pipeline of pipelines) {
      resource = pipeline.reduce((prev, curr) => curr(prev), resource);
    }
    return resource;
  };
}

export function isIndexableResourceIfNotNull<Resource>(
  o: unknown,
): o is Resource {
  if (o) return true;
  return false;
}

export interface UniversalResourcesIndexFilterCache<Resource>
  extends govn.ResourcesIndexFilterCache {
  readonly filtered: Resource[];
}

export const isResourceIndexKeysSupplier = safety.typeGuard<
  govn.ResourceIndexKeysSupplier
>("indexKeys");

export type NamespacedKeysIndex<Resource> = Map<
  govn.ResourceIndexKeyLiteral,
  Resource[]
>;

export class UniversalResourcesIndex<Resource>
  implements govn.ResourcesIndexStrategy<Resource, void> {
  readonly isIndexable: safety.TypeGuard<Resource>;
  readonly resourcesIndex: Resource[] = [];
  readonly globalNamespaceKeysIndex: NamespacedKeysIndex<Resource>;
  readonly keyedResources = new Map<
    govn.ResourceIndexKeyNamespace,
    NamespacedKeysIndex<Resource>
  >();
  readonly cachedFilter = new Map<
    govn.ResourcesIndexFilterCacheKey,
    UniversalResourcesIndexFilterCache<Resource>
  >();

  constructor(isIndexable?: safety.TypeGuard<Resource>) {
    this.isIndexable = isIndexable || isIndexableResourceIfNotNull;
    this.globalNamespaceKeysIndex = this.prepareNamespaceIndex(".GLOBAL");
  }

  resources(): Iterable<Resource> {
    return this.resourcesIndex;
  }

  // deno-lint-ignore require-await
  async index(r: Resource | unknown): Promise<void> {
    if (this.isIndexable(r)) {
      this.resourcesIndex.push(r);
      if (isResourceIndexKeysSupplier(r)) {
        this.registerKeys(r);
      }
    }
  }

  indexSync(r: Resource | unknown): void {
    if (this.isIndexable(r)) {
      this.resourcesIndex.push(r);
      if (isResourceIndexKeysSupplier(r)) {
        this.registerKeys(r);
      }
    }
  }

  prepareNamespaceIndex(
    ns: govn.ResourceIndexKeyNamespace,
  ): NamespacedKeysIndex<Resource> {
    const result = new Map();
    this.keyedResources.set(ns, result);
    return result;
  }

  registerKeys(r: Resource & govn.ResourceIndexKeysSupplier) {
    for (const key of r.indexKeys) {
      const ns = key.namespace
        ? (this.keyedResources.get(key.namespace) ||
          this.prepareNamespaceIndex(key.namespace))
        : this.globalNamespaceKeysIndex;
      let resources = ns.get(key.literal);
      if (!resources) {
        resources = [];
        ns.set(key.literal, resources);
      }
      resources.push(r);
    }
  }

  keyed(key: govn.ResourceIndexKey): Resource[] | undefined {
    const ns = key.namespace
      ? this.keyedResources.get(key.namespace)
      : this.globalNamespaceKeysIndex;
    return ns?.get(key.literal);
  }

  keyedUnique(
    key: govn.ResourceIndexKey,
    onNotUnique?: (
      r: Resource[],
      key: govn.ResourceIndexKey,
    ) => Resource | undefined,
  ): Resource | undefined {
    const keyed = this.keyed(key);
    if (keyed) {
      if (keyed.length == 1) {
        return keyed[0];
      }
      return onNotUnique ? onNotUnique(keyed, key) : undefined;
    }
    return undefined;
  }

  // deno-lint-ignore require-await
  async filter(
    predicate: govn.ResourcesIndexFilterPredicate<Resource>,
    options?: govn.ResourcesIndexFilterOptions,
  ): Promise<Iterable<Resource>> {
    return this.filterSync(predicate, options);
  }

  filterSync(
    predicate: govn.ResourcesIndexFilterPredicate<Resource>,
    options?: govn.ResourcesIndexFilterOptions,
  ): Iterable<Resource> {
    let filtered: Resource[] | undefined = undefined;
    if (options?.cacheKey) {
      const cached = this.cachedFilter.get(options?.cacheKey);
      if (cached) {
        if (options?.cacheExpired) {
          if (!options?.cacheExpired(cached)) filtered = cached.filtered;
        } else {
          filtered = cached.filtered;
        }
      }
    }
    if (!filtered) {
      const total = this.resourcesIndex.length;
      const lastIndex = this.resourcesIndex.length - 1;
      filtered = this.resourcesIndex.filter((r, index) =>
        predicate(r, index, {
          total,
          isFirst: index === 0,
          isLast: index === lastIndex,
        })
      );
    }
    if (options?.cacheKey) {
      this.cachedFilter.set(options?.cacheKey, {
        cacheKey: options?.cacheKey,
        cachedAt: new Date(),
        filtered,
      });
    }
    return filtered;
  }

  populateMetrics(metrics: m.Metrics) {
    let totalConstructMS = 0;
    for (const r of this.resourcesIndex) {
      if (isResourceLifecycleMetricsSupplier(r)) {
        const cpm = r.lifecycleMetrics.constructPM;
        totalConstructMS += cpm.duration;
      }
    }
    metrics.record(
      metrics.gaugeMetric(
        "resources_index_entries_total",
        "Count of total resources constructed",
      ).instance(this.resourcesIndex.length, {}),
    );
    metrics.record(
      metrics.gaugeMetric(
        "resources_index_lc_construction_milliseconds",
        "Aggregated construction time of all resources in milliseconds",
      ).instance(totalConstructMS, {}),
    );
    const meanConstructMS = totalConstructMS / this.resourcesIndex.length;
    metrics.record(
      metrics.gaugeMetric(
        "resources_index_lc_construction_mean_milliseconds",
        "Average (mean) construction time of all resources in milliseconds",
      ).instance(meanConstructMS, {}),
    );
  }
}
