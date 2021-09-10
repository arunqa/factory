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
