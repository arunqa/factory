import { fs, govnSvcMetrics as gsm, path } from "../deps.ts";

// deno-lint-ignore no-empty-interface
export interface Asset {
}

export interface FileSystemAsset extends Asset {
  readonly walkEntry: fs.WalkEntry;
}

export interface AssetMetric {
  readonly asset: Asset;
  readonly metric: gsm.Metric;
}

export interface FileSystemAssetMetric extends AssetMetric {
  readonly asset: FileSystemAsset;
  readonly metric: gsm.Metric;
}

export interface AssetMetricsContext extends Partial<TransactionIdSupplier> {
  readonly allMetrics: gsm.Metrics;
  readonly nameMetrics: AssetNameMetrics;
}

export interface FileSystemAssetAnalyticsSupplier {
  (
    asset: FileSystemAsset,
    walker: FileSysAssetWalker,
    ams: AssetMetricsContext,
  ): Promise<void>;
}

export interface FileSysAssetWalker {
  readonly root: string;
  readonly remarks?: string;
  readonly options?: fs.WalkOptions;
}

export interface TransactionIdSupplier {
  readonly txID: string;
  readonly txHost: string;
}

export interface AssetsMetricsArguments extends Partial<TransactionIdSupplier> {
  readonly walkers: Iterable<FileSysAssetWalker>;
  readonly metricsSuppliers: FileSystemAssetAnalyticsSupplier[];
  readonly metrics: gsm.TypicalMetrics;
}

export interface DateSupplier {
  readonly date: Date;
}

export interface AssetExtensionSupplier {
  readonly assetExtn: string;
}

export interface AssetPathSupplier {
  readonly assetPath: string;
}

export interface AssetAnalyticsMetrics<Labels extends gsm.TypedObject> {
  readonly countGauge: gsm.GaugeMetric<Labels>;
  readonly count: gsm.GaugeMetricInstance<Labels>;
  readonly totalBytesGauge: gsm.GaugeMetric<Labels>;
  readonly totalBytes: gsm.GaugeMetricInstance<Labels>;
}

export interface AssetNameMetrics {
  readonly extnAnalytics: (extn: string) =>
    & AssetExtensionSupplier
    & AssetAnalyticsMetrics<
      AssetExtensionSupplier & Partial<TransactionIdSupplier> & DateSupplier
    >;
  readonly extnPathAnalytics: (
    path: string,
    extn: string,
  ) =>
    & AssetExtensionSupplier
    & AssetPathSupplier
    & AssetAnalyticsMetrics<
      & AssetExtensionSupplier
      & AssetPathSupplier
      & Partial<TransactionIdSupplier>
      & DateSupplier
    >;
}

export function assetNameMetrics(): FileSystemAssetAnalyticsSupplier {
  return async (asset, walker, ams) => {
    if (!asset.walkEntry.isFile) return;
    const assetExtn = path.extname(asset.walkEntry.name);
    const ea = ams.nameMetrics.extnAnalytics(assetExtn);
    const stat = await Deno.stat(asset.walkEntry.path);
    ea.count.value(ea.count.value() + 1);
    ea.totalBytes.value(
      ea.totalBytes.value() + stat.size,
    );

    // for each path up to the root, record the total count and bytes
    let assetPath = path.dirname(asset.walkEntry.path);
    while (assetPath && assetPath != "." && assetPath.trim().length > 0) {
      const epa = ams.nameMetrics.extnPathAnalytics(
        assetPath,
        assetExtn,
      );
      epa.count.value(epa.count.value() + 1);
      epa.totalBytes.value(
        epa.totalBytes.value() + stat.size,
      );
      assetPath = path.dirname(assetPath);
      if (walker.root == assetPath) break;
    }
  };
}

export interface AssetNameSupplier
  extends AssetExtensionSupplier, AssetPathSupplier {
  readonly assetPathAndName: string;
  readonly assetName: string;
}

export interface AssetNameIssue extends AssetNameSupplier {
  readonly issue: string;
}

export interface AssetNameSpacesIssue extends AssetNameIssue {
  readonly issue: "spaces in asset name";
}

export interface AssetNameCaseSensitivityIssue extends AssetNameIssue {
  readonly issue: "mixed case in asset name";
}

export function assetNameLintIssues(
  metrics: gsm.TypicalMetrics,
): FileSystemAssetAnalyticsSupplier {
  const spacesInNameInfo = metrics.infoMetric<
    AssetNameSpacesIssue & Partial<TransactionIdSupplier>
  >(
    "asset_name_lint_issue_spaces_in_name",
    "Spaces in asset name",
  );
  const mixedCaseInNameInfo = metrics.infoMetric<
    AssetNameCaseSensitivityIssue & Partial<TransactionIdSupplier>
  >(
    "asset_name_lint_issue_mixed_case",
    "Mixed case in asset name",
  );
  // deno-lint-ignore require-await
  return async (asset, _walker, ams) => {
    if (!asset.walkEntry.isFile) return;
    const assetName = asset.walkEntry.name;
    if (asset.walkEntry.name.indexOf(" ") >= 0) {
      const issue: AssetNameSpacesIssue & Partial<TransactionIdSupplier> = {
        assetName,
        assetPath: path.dirname(asset.walkEntry.path),
        assetPathAndName: asset.walkEntry.path,
        assetExtn: path.extname(assetName),
        issue: "spaces in asset name",
        txID: ams.txID,
        txHost: ams.txHost,
      };
      metrics.record(spacesInNameInfo.instance(issue));
    }
    if (assetName !== assetName.toLocaleLowerCase()) {
      const issue:
        & AssetNameCaseSensitivityIssue
        & Partial<TransactionIdSupplier> = {
          assetName: asset.walkEntry.name,
          assetPath: path.dirname(asset.walkEntry.path),
          assetPathAndName: asset.walkEntry.path,
          assetExtn: path.extname(asset.walkEntry.name),
          issue: "mixed case in asset name",
          txID: ams.txID,
          txHost: ams.txHost,
        };
      metrics.record(mixedCaseInNameInfo.instance(issue));
    }
  };
}

export interface AssetsMetricsResult {
  readonly metrics: gsm.Metrics;
  readonly summaryHeader: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  readonly summaryRows: [
    date: string,
    time: string,
    extn: string,
    count: number,
    totalBytes: number,
    txID?: string,
    host?: string,
  ][];
  readonly pathsHeader: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  readonly pathsCSV: [
    date: string,
    time: string,
    path: string,
    extn: string,
    count: number,
    totalBytes: number,
    txID?: string,
    host?: string,
  ][];
}

export async function assetsMetrics(
  aapo: AssetsMetricsArguments,
): Promise<AssetsMetricsResult> {
  const countGauge = aapo.metrics.gaugeMetric<
    AssetExtensionSupplier & Partial<TransactionIdSupplier> & DateSupplier
  >(
    "asset_name_extension",
    "Count of asset name extension encountered",
  );
  const totalBytesGauge = aapo.metrics.gaugeMetric<
    AssetExtensionSupplier & Partial<TransactionIdSupplier> & DateSupplier
  >(
    "asset_name_extension_bytes",
    "Total bytes of asset name extension",
  );
  const countByPathGauge = aapo.metrics.gaugeMetric<
    & AssetExtensionSupplier
    & AssetPathSupplier
    & Partial<TransactionIdSupplier>
    & DateSupplier
  >(
    "asset_name_extension_in_path",
    "Count of asset name extensions encountered in path",
  );
  const totalBytesByPathGauge = aapo.metrics.gaugeMetric<
    & AssetExtensionSupplier
    & AssetPathSupplier
    & Partial<TransactionIdSupplier>
    & DateSupplier
  >(
    "asset_name_extension_bytes_in_path",
    "Total bytes of asset name extensions encountered in path",
  );
  const extnAnalytics = new Map<
    string,
    & AssetExtensionSupplier
    & AssetAnalyticsMetrics<
      AssetExtensionSupplier & Partial<TransactionIdSupplier> & DateSupplier
    >
  >();
  const extnPathAnalytics = new Map<
    string,
    & AssetExtensionSupplier
    & AssetPathSupplier
    & AssetAnalyticsMetrics<
      & AssetExtensionSupplier
      & AssetPathSupplier
      & Partial<TransactionIdSupplier>
      & DateSupplier
    >
  >();
  const context: AssetMetricsContext = {
    allMetrics: aapo.metrics,
    txID: aapo.txID,
    txHost: aapo.txHost,
    nameMetrics: {
      extnAnalytics: (assetExtn) => {
        let analytics = extnAnalytics.get(assetExtn);
        if (!analytics) {
          const labels = {
            assetExtn,
            txID: aapo.txID,
            txHost: aapo.txHost,
            date: new Date(),
          };
          analytics = {
            assetExtn,
            count: countGauge.instance(0, labels),
            countGauge,
            totalBytes: totalBytesGauge.instance(0, labels),
            totalBytesGauge,
          };
          aapo.metrics.record(analytics.count);
          aapo.metrics.record(analytics.totalBytes);
          extnAnalytics.set(assetExtn, analytics);
        }
        return analytics;
      },
      extnPathAnalytics: (assetPath, assetExtn) => {
        const mapKey = `${assetPath}${assetExtn}`;
        let analytics = extnPathAnalytics.get(mapKey);
        if (!analytics) {
          const labels = {
            assetPath,
            assetExtn,
            txID: aapo.txID,
            txHost: aapo.txHost,
            date: new Date(),
          };
          analytics = {
            assetPath,
            assetExtn,
            count: countByPathGauge.instance(0, labels),
            countGauge: countByPathGauge,
            totalBytes: totalBytesByPathGauge.instance(0, labels),
            totalBytesGauge: totalBytesByPathGauge,
          };
          aapo.metrics.record(analytics.count);
          aapo.metrics.record(analytics.totalBytes);
          extnPathAnalytics.set(mapKey, analytics);
        }
        return analytics;
      },
    },
  };

  for (const walker of aapo.walkers) {
    for await (const we of fs.walkSync(walker.root, walker.options)) {
      for await (const ms of aapo.metricsSuppliers) {
        await ms({ walkEntry: we }, walker, context);
      }
    }
  }

  const result: AssetsMetricsResult = {
    metrics: context.allMetrics,
    summaryHeader: [
      "Date",
      "Time",
      "File Extension",
      "Count of Files with Extension",
      "Total Bytes in all Files with Extension",
      "Build ID",
      "Host",
    ],
    summaryRows: [],
    pathsHeader: [
      "Date",
      "Time",
      "Files Path",
      "File Extension in Path",
      "Count of Files with Extension in Path",
      "Total Bytes in all Files with Extension in Path",
      "Build ID",
      "Host",
    ],
    pathsCSV: [],
  };

  for (const ea of extnAnalytics.values()) {
    const labels = ea.count.labels.object;
    result.summaryRows.push(
      [
        labels.date.toLocaleDateString("en-US"),
        labels.date.toLocaleTimeString("en-US"),
        labels.assetExtn,
        ea.count.value(),
        ea.totalBytes.value(),
        labels.txID,
        labels.txHost,
      ],
    );
  }

  for (const epa of extnPathAnalytics.values()) {
    const labels = epa.count.labels.object;
    result.pathsCSV.push(
      [
        labels.date.toLocaleDateString("en-US"),
        labels.date.toLocaleTimeString("en-US"),
        labels.assetPath,
        labels.assetExtn,
        epa.count.value(),
        epa.totalBytes.value(),
        labels.txID,
        labels.txHost,
      ],
    );
  }

  return result;
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
    return (value as gsm.Metric).name;
  }
  if (value && typeof value === "object") {
    if ("object" in value) {
      // deno-lint-ignore no-explicit-any
      return (value as any).object;
    }
    if ("instances" in value) {
      const metricsDefnMap = new Map<string, gsm.Metric>();
      // deno-lint-ignore no-explicit-any
      const instances = ((value as any).instances) as gsm.MetricInstance<
        gsm.Metric
      >[];
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
