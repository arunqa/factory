import * as safety from "../../lib/safety/mod.ts";
import * as health from "../../lib/health/mod.ts";
import * as govn from "../../governance/mod.ts";

export const isLintable = safety.typeGuard<govn.Lintable>(
  "lint",
);

export const isObservabilityHealthComponentSupplier = safety.typeGuard<
  govn.ObservabilityHealthComponentStatusSupplier
>("obsHealthStatus");

export class Observability implements govn.ObservabilityEventsEmitterSupplier {
  readonly suppliers: govn.ObservabilityHealthComponentStatusSupplier[] = [];
  constructor(readonly events: govn.ObservabilityEventsEmitter) {
    events.on("healthStatusSupplier", (rf) => this.suppliers.push(rf));
  }

  async serviceHealthComponentsDetails() {
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
      for await (const status of supplier.obsHealthStatus()) {
        if (Array.isArray(status.category)) {
          for (const category of status.category) {
            storeDetail(category, status.status);
          }
        } else {
          storeDetail(status.category, status.status);
        }
      }
    }
    return details;
  }

  async serviceHealth() {
    return health.healthyService({
      serviceID: import.meta.url,
      releaseID: "releaseID",
      description: "TODO: ObservabilityEvents description",
      details: await this.serviceHealthComponentsDetails(),
      version: "TODO: ObservabilityEvents version",
    });
  }
}
