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

export interface ResourcesIndexStrategy<Resource, IndexResult> {
  readonly index: (r: Resource) => Promise<IndexResult>;
  readonly indexSync: (r: Resource) => IndexResult;
  readonly resources: () => Iterable<Resource>;
  readonly filter: (
    predicate: ResourcesIndexFilterPredicate<Resource>,
    options?: ResourcesIndexFilterOptions,
  ) => Promise<Iterable<Resource>>;
  readonly filterSync: (
    predicate: ResourcesIndexFilterPredicate<Resource>,
    options?: ResourcesIndexFilterOptions,
  ) => Iterable<Resource>;
}
