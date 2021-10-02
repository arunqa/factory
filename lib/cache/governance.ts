import { govnSvcHealth as health } from "./deps.ts";

export interface TextKeyProxy<Resource> {
  [key: string]: Resource;
}

export interface CacheHealthKeyNameTransformer {
  (keyName: string): string;
}

export interface CacheHealth {
  (keyName: CacheHealthKeyNameTransformer): health.ServiceHealthComponents;
}

export interface ResourceProxyStrategyResult {
  readonly isConstructFromOrigin: boolean;
  readonly proxyRemarks: string;
}

export interface ProxiedResource {
  readonly proxyStrategyResult: ResourceProxyStrategyResult;
}

export interface ProxiedResourceNotAvailable extends ProxiedResource {
  readonly proxyNotAvailable: boolean;
  readonly proxyOriginError?: Error;
}
