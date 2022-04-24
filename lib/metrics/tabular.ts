import * as govn from "./governance.ts";
import * as core from "./core.ts";
import * as tab from "../tabular/mod.ts";

export function* tabularMetrics(
  instances: Iterable<govn.MetricInstance<govn.Metric>>,
  viewNamesStrategy = (
    name:
      | "metric"
      | "metric_instance"
      | "metric_label"
      | "metric_instance_label",
  ) => name,
) {
  const metricRB = tab.tabularRecordsAutoRowIdBuilder<{
    readonly name: govn.MetricName;
    readonly nature: govn.MetricNature;
    readonly description: string;
  }, "name">({
    upsertStrategy: {
      exists: (metric, _rowID, index) => {
        return index("name")?.get(metric.name);
      },
      index: (metric, index) => {
        index("name").set(metric.name, metric);
      },
    },
  });
  const metricLabelRB = tab.tabularRecordsAutoRowIdBuilder<{
    readonly metricId: tab.TabularRecordIdRef;
    readonly metricName: govn.MetricName;
    readonly label: govn.MetricLabelName;
  }, "metricIdLabel">({
    upsertStrategy: {
      exists: (ml, _rowID, index) => {
        return index("metricIdLabel")?.get(`${ml.metricId}_${ml.label}`);
      },
      index: (ml, index) => {
        index("metricIdLabel").set(`${ml.metricId}_${ml.label}`, ml);
      },
    },
  });
  const metricInstanceRB = tab.tabularRecordsAutoRowIdBuilder<{
    readonly metricId: tab.TabularRecordIdRef;
    readonly metricName: govn.MetricName;
    readonly metricValue?: number;
  }>();
  const metricInstanceLabelRB = tab.tabularRecordsAutoRowIdBuilder<{
    readonly metricId: tab.TabularRecordIdRef;
    readonly metricName: govn.MetricName;
    readonly metricInstanceId: tab.TabularRecordIdRef;
    readonly metricLabelId: tab.TabularRecordIdRef;
    readonly label: string;
    readonly labelValue?: number | string;
  }>();

  for (const instance of instances) {
    const metric = metricRB.upsert({
      name: instance.metric.name,
      nature: instance.metric.nature,
      description: instance.metric.help,
    });
    const { id: metricId, name: metricName } = metric;
    const metricInstance = metricInstanceRB.upsert({
      metricId,
      metricName,
      metricValue: instance.tablify().metric_value,
    });
    if (core.isLabeledMetricInstance(instance)) {
      for (const entry of Object.entries(instance.labels.object)) {
        const [label, labelValue] = entry;
        const metricLabel = metricLabelRB.upsert({
          metricId,
          metricName,
          label,
        });
        metricInstanceLabelRB.upsert({
          metricId,
          metricName,
          metricInstanceId: metricInstance.id,
          metricLabelId: metricLabel.id,
          label: metricLabel.label,
          labelValue,
        });
      }
    }
  }

  const namespace = "observability";
  yield tab.definedTabularRecordsProxy(
    { identity: viewNamesStrategy("metric"), namespace },
    metricRB.records,
  );
  yield tab.definedTabularRecordsProxy(
    { identity: viewNamesStrategy("metric_label"), namespace },
    metricLabelRB.records,
  );
  yield tab.definedTabularRecordsProxy(
    { identity: viewNamesStrategy("metric_instance"), namespace },
    metricInstanceRB.records,
  );
  yield tab.definedTabularRecordsProxy(
    { identity: viewNamesStrategy("metric_instance_label"), namespace },
    metricInstanceLabelRB.records,
  );
}
