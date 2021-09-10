import { events, govnSvcHealth as health, safety } from "../deps.ts";
import * as r from "./resource.ts";

export class ObservabilityEventsEmitter extends events.EventEmitter<{
  healthyOriginator<Resource>(rf: r.ResourcesFactoriesSupplier<Resource>): void;
  healthyRefinery<Resource>(rs: r.ResourcesSupplier<Resource>): void;
}> {}

export interface ObservabilityHealthComponentStatus {
  readonly obsHealthStatus: () => health.ServiceHealthComponentStatus;
}

export const isObservabilityHealthComponentSupplier = safety.typeGuard<
  ObservabilityHealthComponentStatus
>("obsHealthStatus");

export interface ObservabilityEventsEmitterSupplier {
  readonly observabilityEE: ObservabilityEventsEmitter;
}
