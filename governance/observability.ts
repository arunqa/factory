import { events, govnSvcHealth as health } from "../deps.ts";

export interface ObservabilityHealthComponentStatusIdentity {
  readonly identity: string;
  readonly category: string | string[];
}

export interface ObservabilityHealthComponentStatus
  extends ObservabilityHealthComponentStatusIdentity {
  readonly status: health.ServiceHealthComponentStatus;
}

export interface ObservabilityHealthComponentStatusSupplier {
  readonly obsHealthStatus: () => ObservabilityHealthComponentStatus;
}

export class ObservabilityEventsEmitter extends events.EventEmitter<{
  healthy(ohcss: ObservabilityHealthComponentStatusSupplier): void;
}> {}

export interface ObservabilityEventsEmitterSupplier {
  readonly observabilityEE: ObservabilityEventsEmitter;
}
