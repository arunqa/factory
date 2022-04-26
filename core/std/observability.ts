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
  govn.ObservableTabularRecordsSupplier
>("observableTabularRecords");

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

export async function* healthCheckSqlViews(
  statuses: Iterable<govn.ObservabilityHealthComponentStatus>,
  viewNamesStrategy = (
    name:
      | "category"
      | "status"
      | "status_link",
  ) => `service_health_component_status${name == "status" ? "" : `_${name}`}`,
  namespace = "observability",
) {
  // Identity generic is set to string because we're controlling the names
  // using viewNamesStrategy instead of TabularRecordDefn.identity
  const builders = tab.definedTabularRecordsBuilders<string>();

  const shcsCategoryRB = builders.autoRowIdProxyBuilder<
    { category: string },
    "category"
  >({ identity: viewNamesStrategy("category"), namespace }, {
    upsertStrategy: {
      exists: (record, _rowID, index) =>
        index("category")?.get(record.category),
      index: (record, index) => index("category").set(record.category, record),
    },
  });
  const shcsRB = builders.autoRowIdProxyBuilder<
    Omit<health.ServiceHealthComponentStatus, "links"> & { category: string }
  >({ identity: viewNamesStrategy("status"), namespace });
  const shcsLinkRB = builders.autoRowIdProxyBuilder<{
    readonly shcsId: tab.TabularRecordIdRef;
    readonly linkKey: string;
    readonly linkValue: unknown;
  }>({ identity: viewNamesStrategy("status_link"), namespace });

  for (const ohcs of statuses) {
    const { category, status } = ohcs;
    const categories = Array.isArray(category) ? category : [category];
    for (const category of categories) {
      shcsCategoryRB.upsert({ category });
      const { links: _linksRemoved, ...statusWithoutLinks } = status;
      const shcsRecord = shcsRB.upsert({ ...statusWithoutLinks, category });
      for (const link of Object.entries(status.links)) {
        const [linkKey, linkValue] = link;
        shcsLinkRB.upsert({
          shcsId: shcsRecord.id,
          linkKey,
          linkValue,
        });
      }
    }
  }

  yield* builders.definedTabularRecords();
}

export class Observability
  implements
    govn.ObservabilityEventsEmitterSupplier,
    govn.ObservableTabularRecordsSupplier {
  readonly hsSuppliers: govn.ObservabilityHealthComponentStatusSupplier[] = [];
  readonly sqlViewsSuppliers: govn.ObservableTabularRecordsSupplier[] = [];

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

  // implementation of ObservableTabularRecordsSupplier for this class instance
  // which supplies its own sqlViews
  async *observableTabularRecords() {
    yield environmentSqlView;

    const statuses = [];
    for (const hss of this.hsSuppliers) {
      for await (const ohs of hss.obsHealthStatus()) {
        statuses.push(ohs);
      }
    }

    yield* healthCheckSqlViews(statuses);
  }

  // all SQL views by any registered ObservableTabularRecordsSupplier instances
  async *systemObservableTabularRecords(): AsyncGenerator<
    // deno-lint-ignore no-explicit-any
    tab.DefinedTabularRecords<any>
  > {
    for (const sv of this.sqlViewsSuppliers) {
      yield* sv.observableTabularRecords();
    }
  }
}
