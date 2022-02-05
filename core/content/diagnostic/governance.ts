import * as fsA from "../../../lib/fs/fs-analytics.ts";
import * as govn from "../../../governance/mod.ts";
import * as o from "../../std/observability.ts";
import * as m from "../../../lib/metrics/mod.ts";

export interface DiagnosticsResourcesState {
  readonly routes: {
    readonly renderRoutes: boolean;
    readonly resourcesTree: govn.RouteTree;
  };
  readonly renderers: boolean;
}

export interface PreProduceObservabilityState {
  readonly metrics?: {
    readonly universal: m.Metrics;
    readonly renderUniversalPEF: boolean;
    readonly renderUniversalJSON: boolean;
  };
  readonly observability: o.Observability;
}

export interface PostProduceObservabilityState {
  readonly metrics?: {
    readonly universal: m.Metrics;
    readonly renderUniversalPEF: boolean;
    readonly renderUniversalJSON: boolean;
    readonly assets?: {
      readonly renderPEF: boolean;
      readonly renderCSV: boolean;
      readonly results: fsA.AssetsMetricsResult;
    };
  };
  readonly renderHealth: boolean;
  readonly observability: o.Observability;
}
