import * as fsA from "../../../../../lib/fs/fs-analytics.ts";
import * as govn from "../../../../../governance/mod.ts";
import * as o from "../../../../std/observability.ts";

export interface EmitOptionalResourcesSupplier {
  readonly emitResources: () => boolean;
}

export interface DiagnosticsResourcesState {
  readonly routes: EmitOptionalResourcesSupplier & {
    readonly resourcesTree: govn.RouteTree;
  };
  readonly renderers: EmitOptionalResourcesSupplier;
}

export interface PreProduceMetricsResourcesState {
  readonly assets: EmitOptionalResourcesSupplier & {
    readonly emitResources: () => boolean;
  };
}

export interface PostProduceMetricsResourcesState {
  readonly assets: EmitOptionalResourcesSupplier & {
    readonly collected: fsA.AssetsMetricsResult;
    readonly emitResources: () => boolean;
  };
}

export interface PreProduceObservabilityState {
  readonly metrics: PreProduceMetricsResourcesState;
  readonly observability: o.Observability;
}

export interface PostProduceObservabilityState {
  readonly metrics: PostProduceMetricsResourcesState;
  readonly health: EmitOptionalResourcesSupplier;
  readonly observability: o.Observability;
}
