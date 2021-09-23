import { govnSvcHealth as health, safety } from "../deps.ts";
import * as govn from "../../governance/mod.ts";

export const isObservabilityHealthComponentSupplier = safety.typeGuard<
  govn.ObservabilityHealthComponentStatusSupplier
>("obsHealthStatus");

export class Observability implements govn.ObservabilityEventsEmitterSupplier {
  readonly suppliers: govn.ObservabilityHealthComponentStatus[] = [];
  constructor(readonly observabilityEE: govn.ObservabilityEventsEmitter) {
    observabilityEE.on(
      "healthy",
      (rf) => {
        if (isObservabilityHealthComponentSupplier(rf)) {
          this.suppliers.push(rf.obsHealthStatus());
        }
      },
    );
  }

  serviceHealthComponentsDetails() {
    const details: Record<string, health.ServiceHealthComponentStatus[]> = {};
    const storeDetail = (
      category: string,
      status: health.ServiceHealthComponentStatus,
    ) => {
      const found = details[category];
      if (found) {
        found.push(status);
      } else {
        details[category] = [status];
      }
    };
    for (const supplier of this.suppliers) {
      if (Array.isArray(supplier.category)) {
        for (const category of supplier.category) {
          storeDetail(category, supplier.status);
        }
      } else {
        storeDetail(supplier.category, supplier.status);
      }
    }
    return details;
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
