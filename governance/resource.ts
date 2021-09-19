export interface ResourceSupplier<Resource> {
  readonly resource: Resource;
}

export interface ResourceFactorySupplier<Resource> {
  readonly resourceFactory: () => Promise<Resource>;
}

export interface ResourcesFactoriesSupplier<Resource> {
  readonly resourcesFactories: () => AsyncGenerator<
    ResourceFactorySupplier<Resource>
  >;
}

export interface ChildResourcesFactoriesSupplier<Resource>
  extends ResourcesFactoriesSupplier<Resource> {
  readonly isChildResourcesFactoriesSupplier: true;
  readonly yieldParentWithChildren: boolean;
}

export interface ResourcesSupplier<Resource> {
  readonly resources: () => AsyncGenerator<Resource>;
}

export interface ResourceRefinery<Resource> {
  (r: Resource): Promise<Resource>;
}

export interface ResourceRefinerySync<Resource> {
  (r: Resource): Resource;
}

export type ResourceRefineries<Resource> = [
  ResourceRefinery<Resource>,
  ResourceRefinerySync<Resource>,
];

export interface ResourceRefinerySupplier<Resource> {
  readonly resourceRefinery: ResourceRefinery<Resource>;
}

export interface ResourceRefinerySyncSupplier<Resource> {
  readonly resourceRefinerySync: ResourceRefinerySync<Resource>;
}

export interface ResourceRefinerySuppliers<Resource>
  extends
    ResourceRefinerySupplier<Resource>,
    ResourceRefinerySyncSupplier<Resource> {
}

export interface ResourceProxyStrategyResult {
  readonly isConstructFromOrigin: boolean;
  readonly constructFromOriginReason: string;
}

export interface ProxiedResource {
  readonly proxyStrategyResult: ResourceProxyStrategyResult;
}

export interface ProxiedResourceNotAvailable extends ProxiedResource {
  readonly proxyNotAvailable: boolean;
  readonly proxyOriginError?: Error;
}

export type ResourcesIndexFilterCacheKey = string;

export interface ResourcesIndexFilterPredicate<Resource> {
  (r: Resource, index?: number, options?: {
    total?: number;
    isFirst?: boolean;
    isLast?: boolean;
  }): boolean;
}

export interface ResourcesIndexFilterCache {
  readonly cacheKey: ResourcesIndexFilterCacheKey;
  readonly cachedAt: Date;
}

export interface ResourcesIndexFilterOptions {
  readonly cacheKey?: ResourcesIndexFilterCacheKey;
  readonly constructCache?: (
    suggested: ResourcesIndexFilterCache,
  ) => ResourcesIndexFilterCache;
  readonly cacheExpired?: (
    cache: ResourcesIndexFilterCache,
  ) => boolean;
}

export interface ResourcesIndexStrategy<Resource, IndexResult>
  extends ResourcesSupplier<Resource> {
  readonly guard: (r: unknown) => r is Resource;
  readonly index: (r: Resource | unknown) => Promise<IndexResult>;
  readonly filter: (
    predicate: ResourcesIndexFilterPredicate<Resource>,
    options?: ResourcesIndexFilterOptions,
  ) => AsyncGenerator<Resource>;
}
