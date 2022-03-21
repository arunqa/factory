import * as fsA from "../../../lib/fs/fs-analytics.ts";
import * as o from "../../std/observability.ts";
import * as m from "../../../lib/metrics/mod.ts";

export interface PreProduceObservabilityState {
  readonly metrics?: {
    readonly universal: m.Metrics;
    readonly renderUniversalPEF: boolean;
    readonly renderUniversalJSON: boolean;
  };
  readonly observability?: o.Observability;
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
  readonly envVars: {
    readonly renderInHealth: boolean;
    readonly filter: (name: string, value: string) => boolean;
  };
  readonly observability?: o.Observability;
}
