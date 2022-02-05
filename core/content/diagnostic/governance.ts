import * as fsA from "../../../lib/fs/fs-analytics.ts";
import * as govn from "../../../governance/mod.ts";
import * as o from "../../std/observability.ts";
import * as m from "../../../lib/metrics/mod.ts";

export interface EmitOptionalResourcesSupplier {
  readonly emitResources: () => boolean;
}

export interface DiagnosticsResourcesState {
  readonly routes: EmitOptionalResourcesSupplier & {
    readonly resourcesTree: govn.RouteTree;
  };
  readonly renderers: EmitOptionalResourcesSupplier;
}

export interface PreProduceObservabilityState {
  readonly metrics: EmitOptionalResourcesSupplier & {
    readonly universal: m.Metrics;
  };
  readonly observability: o.Observability;
}

export interface PostProduceObservabilityState {
  readonly metrics: EmitOptionalResourcesSupplier & {
    readonly universal: m.Metrics;
    readonly assets: fsA.AssetsMetricsResult;
  };
  readonly health: EmitOptionalResourcesSupplier;
  readonly observability: o.Observability;
}
