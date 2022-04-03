import * as safety from "../safety/mod.ts";

export type MetricNature = "info" | "gauge";
export type MetricName = string;
export type MetricDescription = string;
export type MetricNamePrefix = MetricName;
export type MetricLabelName = string;

export interface Metric {
  readonly nature: MetricNature;
  readonly name: MetricName;
  readonly help: MetricDescription;
  readonly declare: (dest: string[], options: MetricsDialect) => void;
}

export interface MetricInstance<M extends Metric> {
  readonly metric: M;
  readonly stringify: (options: MetricsDialect) => string;
  readonly tablify: () => { metric_value?: number };
}

// deno-lint-ignore ban-types
export type TypedObject = object;

export interface MetricLabels<T extends TypedObject> {
  readonly object: T;
  readonly stringify: (options: MetricsDialect) => string;
}

export function isMetricLabels<T extends TypedObject>(
  o: unknown,
): o is MetricLabels<T> {
  const isType = safety.typeGuard<MetricLabels<T>>("object", "stringify");
  return isType(o);
}

export function openMetricsLabels<T extends TypedObject>(
  values: T,
  options: {
    readonly skipUndefinedLabels: boolean;
  } = { skipUndefinedLabels: true },
): MetricLabels<T> {
  return {
    object: values,
    stringify: () => {
      const kvPairs: string[] = [];
      for (const entry of Object.entries(values)) {
        const [name, value] = entry;
        switch (typeof value) {
          case "number":
            kvPairs.push(`${name}="${value}"`);
            break;

          case "function":
            // utility functions should be skipped
            continue;

          case "undefined":
            if (!options.skipUndefinedLabels) {
              kvPairs.push(`${name}=""`);
            }
            break;

          default:
            // strings, dates, etc.
            kvPairs.push(`${name}=${JSON.stringify(value)}`);
        }
      }
      return kvPairs.join(", ");
    },
  };
}

export interface LabeledMetricInstance<M extends Metric, T extends TypedObject>
  extends MetricInstance<M> {
  readonly labels: MetricLabels<T>;
}

export function isLabeledMetricInstance<
  M extends Metric,
  T extends TypedObject,
>(o: unknown): o is LabeledMetricInstance<M, T> {
  const isLabeled = safety.typeGuard<LabeledMetricInstance<M, T>>("labels");
  if (isLabeled(o)) {
    if (isMetricLabels(o.labels)) return true;
  }
  return false;
}

export interface InfoMetric<T extends TypedObject> extends Metric {
  readonly instance: (
    labelValues: T | MetricLabels<T>,
  ) => LabeledMetricInstance<InfoMetric<T>, T>;
}

export function infoMetric<T extends TypedObject>(
  name: MetricName,
  help: string,
): InfoMetric<T> {
  const nature = "info";
  const metric: InfoMetric<T> = {
    nature,
    name: `${name}_info`,
    help,
    instance: (labelValues) => {
      const instanceLabels = isMetricLabels<T>(labelValues)
        ? labelValues
        : openMetricsLabels(labelValues);
      const instance: LabeledMetricInstance<InfoMetric<T>, T> = {
        metric,
        labels: instanceLabels,
        stringify: (options: MetricsDialect): string => {
          return `${instance.metric.name}{${
            instanceLabels.stringify(options)
          }} 1`;
        },
        tablify: () => ({ metric_value: undefined }), // info nature has no value
      };
      return instance;
    },
    declare: (dest, _options): void => {
      dest.push(`# HELP ${metric.name} ${metric.help}`);
      dest.push(`# TYPE ${metric.name} ${nature}`);
    },
  };
  return metric;
}

export interface GaugeMetricInstance<T extends TypedObject>
  extends LabeledMetricInstance<GaugeMetric<T>, T> {
  readonly value: (set?: number) => number;
}

export interface GaugeMetric<T extends TypedObject> extends Metric {
  readonly instance: (
    metricValue: number,
    labelValues: T | MetricLabels<T>,
  ) => GaugeMetricInstance<T>;
}

export function gaugeMetric<T extends TypedObject>(
  name: MetricName,
  help: string,
): GaugeMetric<T> {
  const nature = "gauge";
  const metric: GaugeMetric<T> = {
    nature,
    name,
    help,
    instance: (metricValue, labelValues) => {
      let value = metricValue;
      const instanceLabels = isMetricLabels<T>(labelValues)
        ? labelValues
        : openMetricsLabels(labelValues);
      const instance: GaugeMetricInstance<T> = {
        metric,
        labels: instanceLabels,
        value: (set?: number): number => {
          if (set) value = set;
          return value;
        },
        stringify: (options: MetricsDialect): string => {
          return `${instance.metric.name}{${
            instanceLabels.stringify(options)
          }} ${value}`;
        },
        tablify: () => ({ metric_value: value }),
      };
      return instance;
    },
    declare: (dest, _options): void => {
      dest.push(`# HELP ${metric.name} ${metric.help}`);
      dest.push(`# TYPE ${metric.name} ${nature}`);
    },
  };
  return metric;
}

export interface Metrics {
  readonly instances: Iterable<MetricInstance<Metric>>;
  readonly infoMetric: <T extends TypedObject>(
    name: MetricName,
    help: string,
  ) => InfoMetric<T>;
  readonly gaugeMetric: <T extends TypedObject>(
    name: MetricName,
    help: string,
  ) => GaugeMetric<T>;
  readonly record: (instance: MetricInstance<Metric>) => MetricInstance<Metric>;
}

export interface MetricsDialect {
  export(instances: Iterable<MetricInstance<Metric>>): string[];
}

export function prometheusDialect(): MetricsDialect {
  const dialect: MetricsDialect = {
    export: (instances: Iterable<MetricInstance<Metric>>) => {
      const encounteredMetrics = new Map<MetricLabelName, boolean>();
      const result: string[] = [];
      for (const instance of instances) {
        const encountered = encounteredMetrics.get(instance.metric.name);
        if (!encountered) {
          instance.metric.declare(result, dialect);
          encounteredMetrics.set(instance.metric.name, true);
        }
        result.push(instance.stringify(dialect));
      }
      return result;
    },
  };
  return dialect;
}

export class TypicalMetrics implements Metrics {
  readonly instances: MetricInstance<Metric>[] = [];

  constructor(readonly namePrefix?: string) {
  }

  infoMetric<T extends TypedObject>(
    name: MetricName,
    help: string,
  ): InfoMetric<T> {
    return infoMetric(
      this.namePrefix ? `${this.namePrefix}${name}` : name,
      help,
    );
  }

  gaugeMetric<T extends TypedObject>(
    name: MetricName,
    help: string,
  ): GaugeMetric<T> {
    return gaugeMetric(
      this.namePrefix ? `${this.namePrefix}${name}` : name,
      help,
    );
  }

  record(instance: MetricInstance<Metric>): MetricInstance<Metric> {
    this.instances.push(instance);
    return instance;
  }

  merge(metrics: Metrics): Metrics {
    this.instances.push(...metrics.instances);
    return this;
  }
}

/**
 * jsonMetricsReplacer is used for text transformation using something like:
 *
 *     JSON.stringify(metrics, jsonMetricsReplacer, "  ")
 *
 * Without jsonMetricsReplacer each metric looks like this:
 * {
 *    "metric": {
 *      "name": "asset_name_extension",
 *      "help": "Count of asset name extension encountered"
 *    },
 *    "labels": {
 *      "object": { // we do not want "object", just the labels
 *        "assetExtn": ".txt"
 *      }
 *    },
 *    // value will be missing because it's a function and JSON won't emit
 * }
 *
 * With jsonMetricsReplacer it will look much nicer, like this:
 * {
 *    "metric": "asset_name_extension",
 *    "labels": {
 *      "assetExtn": ".txt"
 *    },
 *    "value": 6
 * }
 */
export const jsonMetricsReplacer = (key: string, value: unknown) => {
  if (key == "value" && typeof value === "function") return value();
  if (key == "metric") {
    return (value as Metric).name;
  }
  if (value && typeof value === "object") {
    if ("object" in value) {
      // deno-lint-ignore no-explicit-any
      return (value as any).object;
    }
    if ("instances" in value) {
      const metricsDefnMap = new Map<string, Metric>();
      // deno-lint-ignore no-explicit-any
      const instances = ((value as any).instances) as MetricInstance<Metric>[];
      for (const instance of instances) {
        const found = metricsDefnMap.get(instance.metric.name);
        if (!found) {
          metricsDefnMap.set(instance.metric.name, instance.metric);
        }
      }
      return {
        instances,
        metrics: Array.from(metricsDefnMap.values()),
      };
    }
  }
  return value;
};

export type TabularEntryID = number | string;
export type TabularEntryIdRef = TabularEntryID;

export interface TabularMetric {
  readonly metric_id: TabularEntryID;
  readonly name: MetricName;
  readonly nature: MetricNature;
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
  readonly label: MetricLabelName;
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
  instances: Iterable<MetricInstance<Metric>>,
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
    if (isLabeledMetricInstance(instance)) {
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

export interface ScalarStatisticsEncounterOptions {
  readonly onNewMinValue?: (
    prevMinValue: number,
    changeCount: number,
    valueCount: number,
  ) => void;
  readonly onNewMaxValue?: (
    prevMaxValue: number,
    changeCount: number,
    valueCount: number,
  ) => void;
}

/**
 * ScalarStatistics allows a stream of values to be "encountered" and will
 * compute common statistics on the stream of scalar values.
 */
export class ScalarStatistics {
  protected newMean = 0;
  protected newVariance = 0;
  protected oldMean = 0;
  protected oldVariance = 0;
  protected currentMin = 0;
  protected currentMax = 0;
  protected currentSum = 0;
  protected valueCount = 0;

  encounter(value: number) {
    this.valueCount++;
    if (this.valueCount == 1) {
      this.oldMean = this.newMean = this.currentMin = this.currentMax = value;
      this.oldVariance = 0;
    } else {
      this.newMean = this.oldMean +
        (value - this.oldMean) / this.valueCount;
      this.newVariance = this.oldVariance +
        (value - this.oldMean) * (value - this.newMean);
      this.oldMean = this.newMean;
      this.oldVariance = this.newVariance;
      this.currentMin = Math.min(this.currentMin, value);
      this.currentMax = Math.max(this.currentMax, value);
      this.currentSum += value;
    }
  }

  clear() {
    this.valueCount = 0;
    this.newMean = 0;
    this.oldMean = 0;
    this.newVariance = 0;
    this.oldVariance = 0;
    this.currentMin = 0;
    this.currentMax = 0;
  }

  count() {
    return this.valueCount;
  }

  sum() {
    return this.currentSum;
  }

  mean() {
    return (this.valueCount > 0) ? this.newMean : 0;
  }

  variance() {
    return ((this.valueCount > 1)
      ? this.newVariance / (this.valueCount - 1)
      : 0.0);
  }

  //What is the standard deviation of the items?s
  standardDeviation() {
    return Math.sqrt(this.variance());
  }

  min() {
    return this.currentMin;
  }

  max() {
    return this.currentMax;
  }

  populateMetrics(
    metrics: Metrics,
    // deno-lint-ignore no-explicit-any
    baggage: any,
    subjectKey: string,
    subjectHuman: string,
    units: string,
  ) {
    metrics.record(
      metrics.gaugeMetric(
        `${subjectKey}_count_${units}`,
        `Count of ${subjectHuman} in ${units}`,
      ).instance(this.count(), baggage),
    );
    metrics.record(
      metrics.gaugeMetric(
        `${subjectKey}_sum_${units}`,
        `Sum of ${subjectHuman} in ${units}`,
      ).instance(this.sum(), baggage),
    );
    metrics.record(
      metrics.gaugeMetric(
        `${subjectKey}_mean_${units}`,
        `Average (mean) of ${subjectHuman} in ${units}`,
      ).instance(this.mean(), baggage),
    );
    const min = this.min();
    const max = this.max();
    if (min !== undefined) {
      metrics.record(
        metrics.gaugeMetric(
          `${subjectKey}_min_${units}`,
          `Minimum of ${subjectHuman} in ${units}`,
        ).instance(min, baggage),
      );
    }
    if (max !== undefined) {
      metrics.record(
        metrics.gaugeMetric(
          `${subjectKey}_max_${units}`,
          `Maximum of ${subjectHuman} in ${units}`,
        ).instance(max, baggage),
      );
    }
    metrics.record(
      metrics.gaugeMetric(
        `${subjectKey}_stddev_${units}`,
        `Standard deviation from mean of ${subjectHuman} in ${units}`,
      ).instance(this.standardDeviation(), baggage),
    );
  }
}

export class RankedStatistics<T extends { statistic: number }>
  extends ScalarStatistics {
  readonly maxRanks: number;
  #ranked: T[] = [];
  #compareFn: (a: T, b: T) => number;

  constructor(
    options?: {
      readonly maxRanks: number;
      readonly compareFn?: (a: T, b: T) => number;
    },
  ) {
    super();
    this.maxRanks = options?.maxRanks || 10;
    this.#compareFn = options?.compareFn ||
      ((a, b) => b.statistic - a.statistic);
  }

  rank(value: T): void {
    // compute continuous statistics
    this.encounter(value.statistic);

    // maintain "top X" of value.rank
    this.#ranked.push(value);
    this.#ranked = this.#ranked.sort(this.#compareFn);
    if (this.#ranked.length > this.maxRanks) {
      this.#ranked.length = this.maxRanks;
    }
  }

  populateRankMetrics(
    metrics: Metrics,
    // deno-lint-ignore no-explicit-any
    baggage: any,
    subjectKey: string,
    subjectHuman: string,
    units: string,
    // deno-lint-ignore no-explicit-any
    rankBaggage: (item: T, index: number) => any,
  ) {
    this.#ranked.forEach((item, index) => {
      metrics.record(
        metrics.gaugeMetric(
          `${subjectKey}_ranked_${units}`,
          `Rank of ${subjectHuman} in ${units}`,
        ).instance(item.statistic, {
          ...baggage,
          ...rankBaggage(item, index),
        }),
      );
    });
  }
}
