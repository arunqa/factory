import * as safety from "../../lib/safety/mod.ts";
import * as health from "../../lib/health/mod.ts";
import * as hEnv from "../../lib/health/env.ts";
import * as tab from "../../lib/tabular/mod.ts";
import * as govn from "../../governance/mod.ts";

export const isLintable = safety.typeGuard<govn.Lintable>(
  "lint",
);

export const isObservabilityHealthComponentSupplier = safety.typeGuard<
  govn.ObservabilityHealthComponentStatusSupplier
>("obsHealthStatus");

export const isObservabilitySqlViewsSupplier = safety.typeGuard<
  govn.ObservableSqlViewsSupplier
>("observableSqlViews");

export interface ServiceHealthComponentsChecksOptions {
  readonly includeEnv?: boolean;
  readonly envVarFilter?: (name: string, value: string) => boolean;
}

export const environmentSqlView = tab.definedTabularRecordsProxy<{
  readonly var_name: string;
  readonly var_value: string;
}>(
  {
    identity: "environment",
    namespace: "server_os",
    help: "Results of Deno.env.toObject()",
  },
  Array.from(Object.entries(Deno.env.toObject())).map((envEntry) => ({
    varName: envEntry[0],
    varValue: envEntry[1],
  })),
);

export interface HealthCheckRecord {
  readonly id: tab.TabularRecordID;
  readonly category: string;
  readonly status: string;
  readonly component_id: string;
  readonly component_type: string;
  readonly metric_name?: string;
  readonly node?: string;
  readonly observed_unit?: string;
  readonly observed_value?: health.ServiceHealthObservedValue;
  readonly time: Date;
}

export interface HealthCheckLinkRecord {
  readonly health_check_id: tab.TabularRecordIdRef;
  readonly link_key: string;
  readonly link_value: unknown;
}

export async function* healthCheckSqlViews(
  statuses: Iterable<govn.ObservabilityHealthComponentStatus>,
) {
  const hcRecords: HealthCheckRecord[] = [];
  const hclRecords: HealthCheckLinkRecord[] = [];

  for (const ohcs of statuses) {
    const { category, status } = ohcs;
    const categories = Array.isArray(category) ? category : [category];
    for (const category of categories) {
      const hcr: HealthCheckRecord = {
        id: hcRecords.length,
        category,
        status: status.status,
        component_id: status.componentId,
        component_type: status.componentType,
        metric_name: status.metricName,
        node: status.node,
        observed_unit: status.observedUnit,
        observed_value: status.observedValue,
        time: status.time,
      };
      hcRecords.push(hcr);
      for (const link of Object.entries(status.links)) {
        const [link_key, link_value] = link;
        hclRecords.push({
          health_check_id: hcr.id,
          link_key,
          link_value,
        });
      }
    }
  }

  if (hclRecords.length > 0) {
    const hcTable: tab.DefinedTabularRecordsProxy<HealthCheckRecord> = {
      tabularRecordDefn: {
        identity: "health_check",
        namespace: "observability",
        ...tab.mirrorColumnDefnsFromExemplar(hcRecords),
      },
      // deno-lint-ignore require-await
      dataRows: async () => hcRecords,
    };
    yield hcTable;
  }

  if (hclRecords.length > 0) {
    const hclTable: tab.DefinedTabularRecordsProxy<HealthCheckLinkRecord> = {
      tabularRecordDefn: {
        identity: "health_check_link",
        namespace: "observability",
        ...tab.mirrorColumnDefnsFromExemplar(hclRecords),
      },
      // deno-lint-ignore require-await
      dataRows: async () => hclRecords,
    };

    yield hclTable;
  }
}

export class Observability
  implements
    govn.ObservabilityEventsEmitterSupplier,
    govn.ObservableSqlViewsSupplier {
  readonly hsSuppliers: govn.ObservabilityHealthComponentStatusSupplier[] = [];
  readonly sqlViewsSuppliers: govn.ObservableSqlViewsSupplier[] = [];

  constructor(readonly events: govn.ObservabilityEventsEmitter) {
    events.on("healthStatusSupplier", (rf) => this.hsSuppliers.push(rf));
    events.on("sqlViewsSupplier", (svs) => this.sqlViewsSuppliers.push(svs));

    events.emitSync("sqlViewsSupplier", this);
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
    for (const supplier of this.hsSuppliers) {
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

  // implementation of ObservableSqlViewsSupplier for this specific instance
  async *observableSqlViews() {
    yield environmentSqlView;

    const statuses = [];
    for (const hss of this.hsSuppliers) {
      for await (const ohs of hss.obsHealthStatus()) {
        statuses.push(ohs);
      }
    }

    yield* healthCheckSqlViews(statuses);
  }

  // all SQL views by any registered ObservableSqlViewsSupplier instances
  async *allSqlViews(): AsyncGenerator<
    // deno-lint-ignore no-explicit-any
    tab.DefinedTabularRecordsProxy<any>
  > {
    for (const sv of this.sqlViewsSuppliers) {
      yield* sv.observableSqlViews();
    }
  }
}
