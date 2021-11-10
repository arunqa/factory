import { events } from "./deps.ts";
import * as health from "../lib/health/mod.ts";

export interface ObservabilityHealthComponentCategorySupplier {
  readonly category: string | string[];
}

export interface ObservabilityHealthComponentStatus
  extends ObservabilityHealthComponentCategorySupplier {
  readonly status: health.ServiceHealthComponentStatus;
}

export interface ObservabilityHealthComponentStatusSupplier {
  readonly obsHealthStatus: () => Generator<ObservabilityHealthComponentStatus>;
}

export class ObservabilityEventsEmitter extends events.EventEmitter<{
  healthStatusSupplier(ohcss: ObservabilityHealthComponentStatusSupplier): void;
}> {}

export interface ObservabilityEventsEmitterSupplier {
  readonly events: ObservabilityEventsEmitter;
}
