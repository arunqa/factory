import * as safety from "../../lib/safety/mod.ts";
import * as health from "../../lib/health/mod.ts";
import * as hEnv from "../../lib/health/env.ts";
import * as govn from "../../governance/mod.ts";

export const isLintable = safety.typeGuard<govn.Lintable>(
  "lint",
);

export const isObservabilityHealthComponentSupplier = safety.typeGuard<
  govn.ObservabilityHealthComponentStatusSupplier
>("obsHealthStatus");

export interface ServiceHealthComponentsChecksOptions {
  readonly includeEnv?: boolean;
  readonly envVarFilter?: (name: string, value: string) => boolean;
}

export class Observability implements govn.ObservabilityEventsEmitterSupplier {
  readonly suppliers: govn.ObservabilityHealthComponentStatusSupplier[] = [];
  constructor(readonly events: govn.ObservabilityEventsEmitter) {
    events.on("healthStatusSupplier", (rf) => this.suppliers.push(rf));
  }

  async serviceHealthComponentsChecks(
    options?: ServiceHealthComponentsChecksOptions,
  ) {
    const checks: Record<string, health.ServiceHealthComponentStatus[]> = {};
    const storeCheck = (
      category: string,
      status: health.ServiceHealthComponentStatus,
    ) => {
      const found = checks[category];
      if (found) {
        found.push(status);
      } else {
        checks[category] = [status];
      }
    };
    for (const supplier of this.suppliers) {
      for await (const status of supplier.obsHealthStatus()) {
        if (Array.isArray(status.category)) {
          for (const category of status.category) {
            storeCheck(category, status.status);
          }
        } else {
          storeCheck(status.category, status.status);
        }
      }
    }
    if (options?.includeEnv) {
      storeCheck(
        "build",
        hEnv.envHealthCheck({
          mutate: hEnv.sensitiveEnvVarValueMutator(),
          filter: options.envVarFilter,
        }),
      );
    }
    return checks;
  }

  async serviceHealth(options?: ServiceHealthComponentsChecksOptions) {
    return health.healthyService({
      serviceId: import.meta.url,
      releaseId: "releaseID",
      description: "TODO: ObservabilityEvents description",
      checks: await this.serviceHealthComponentsChecks(options),
      version: "TODO: ObservabilityEvents version",
    });
  }
}
