import * as govn from "./governance.ts";
import * as core from "./core.ts";

export type TabularEntryID = number | string;
export type TabularEntryIdRef = TabularEntryID;

export interface TabularMetric {
  readonly metric_id: TabularEntryID;
  readonly name: govn.MetricName;
  readonly nature: govn.MetricNature;
  readonly description: string;
}

export interface TabularMetricInstance {
  readonly metric_instance_id: TabularEntryIdRef;
  readonly metric_id: TabularEntryIdRef;
  readonly metric_value?: number;
}

export interface TabularMetricLabel {
  readonly metric_label_id: TabularEntryID;
  readonly metric_id: TabularEntryIdRef;
  readonly label: govn.MetricLabelName;
}

export interface TabularMetricInstanceLabel {
  readonly metric_id: TabularEntryIdRef;
  readonly metric_instance_id: TabularEntryIdRef;
  readonly metric_label_id: TabularEntryIdRef;
  readonly label_value?: number | string;
}

/**
 * TabularMetrics are useful for seeing metrics the way a relational database
 * management system (RBDMS) would find it useful (e.g. in SQLite or AlaSQL).
 */
export interface TabularMetrics {
  readonly metrics: TabularMetric[];
  readonly metricInstances: TabularMetricInstance[];
  readonly metricLabels: TabularMetricLabel[];
  readonly metricInstanceLabels: TabularMetricInstanceLabel[];
}

export interface TabularMetricsOptions {
  readonly nextID: (scope: string) => TabularEntryID;
  readonly denormalize: <T>(
    table: string,
    row: T,
    columns?: Record<string, unknown>,
  ) => T;
}

export function defaultTabularMetricsOptions(): TabularMetricsOptions {
  const identities = new Map<string, { nextID: number }>();
  return {
    nextID: (scope: string) => {
      let ID = identities.get(scope);
      if (!ID) {
        ID = { nextID: 0 };
        identities.set(scope, ID);
      }
      ID.nextID++;
      return ID.nextID;
    },
    denormalize: (_table: string, row, columns) => {
      // we want to support optional denormalizing so we'll just add the extra
      // columns to our table; if we didn't want to support denormalization then
      // we could reject certain columns based on the table
      return {
        ...row,
        ...columns,
      };
    },
  };
}

export function tabularMetrics(
  instances: Iterable<govn.MetricInstance<govn.Metric>>,
  options = defaultTabularMetricsOptions(),
): TabularMetrics {
  const { nextID, denormalize } = options;
  const metrics = new Map<string, TabularMetric>();
  const metricInstances: TabularMetricInstance[] = [];
  const metricLabels = new Map<string, TabularMetricLabel>();
  const metricInstanceLabels: TabularMetricInstanceLabel[] = [];

  for (const instance of instances) {
    let metric = metrics.get(instance.metric.name);
    if (!metric) {
      metric = {
        metric_id: nextID("metric_id"),
        name: instance.metric.name,
        description: instance.metric.help,
        nature: instance.metric.nature,
      };
      metrics.set(instance.metric.name, metric);
    }
    const mi: TabularMetricInstance = denormalize("metric_instance", {
      metric_instance_id: nextID("metric_instance_id"),
      metric_id: metric.metric_id,
      ...instance.tablify(),
    }, { metric_name: metric.name, metric_nature: metric.nature });
    metricInstances.push(mi);
    if (core.isLabeledMetricInstance(instance)) {
      for (const entry of Object.entries(instance.labels.object)) {
        const [label, label_value] = entry;
        let metricLabel = metricLabels.get(label);
        if (!metricLabel) {
          metricLabel = denormalize("metric_label", {
            metric_label_id: nextID("metric_label_id"),
            metric_id: metric.metric_id,
            label,
          }, { metric_name: metric.name, metric_nature: metric.nature });
          metricLabels.set(label, metricLabel);
        }
        metricInstanceLabels.push(denormalize("metric_label_instance", {
          metric_id: metric.metric_id,
          metric_instance_id: mi.metric_instance_id,
          metric_label_id: metricLabel.metric_label_id,
          label_value,
        }, {
          metric_name: metric.name,
          metric_nature: metric.nature,
          label: metricLabel.label,
        }));
      }
    }
  }

  return {
    metrics: Array.from(metrics.values()),
    metricInstances,
    metricLabels: Array.from(metricLabels.values()),
    metricInstanceLabels,
  };
}
