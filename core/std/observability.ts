import { govnSvcHealth as health, safety } from "../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as e from "./extension.ts";

export const isObservabilityHealthComponentSupplier = safety.typeGuard<
  govn.ObservabilityHealthComponentStatus
>("obsHealthStatus");

export class Observability implements govn.ObservabilityEventsEmitterSupplier {
  readonly plugins: health.ServiceHealthComponentStatus[] = [];
  readonly resourcesFactories: health.ServiceHealthComponentStatus[] = [];
  readonly resourcesSuppliers: health.ServiceHealthComponentStatus[] = [];
  readonly extensionConsumers: govn.ExtensionConsumer[] = [];
  readonly cachedExtensions = new e.CachedExtensions();
  constructor(readonly observabilityEE: govn.ObservabilityEventsEmitter) {
    observabilityEE.on(
      "healthyOriginator",
      (rf) => {
        if (isObservabilityHealthComponentSupplier(rf)) {
          this.resourcesFactories.push(rf.obsHealthStatus());
        }
      },
    );
    observabilityEE.on(
      "healthyRefinery",
      (rs) => {
        if (isObservabilityHealthComponentSupplier(rs)) {
          this.resourcesSuppliers.push(rs.obsHealthStatus());
        }
      },
    );
  }

  serviceHealthComponentsDetails() {
    return {
      [`plugins`]: this.plugins,
      [`resourcesFactories`]: this.resourcesFactories,
      [`resourcesSuppliers`]: this.resourcesSuppliers,
    };
  }

  serviceHealth() {
    return health.healthyService({
      serviceID: import.meta.url,
      releaseID: "releaseID",
      description: "TODO: ObservabilityEvents description",
      details: this.serviceHealthComponentsDetails(),
      version: "TODO: ObservabilityEvents version",
    });
  }
}
