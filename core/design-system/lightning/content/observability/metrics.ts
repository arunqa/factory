import { govnSvcMetrics as gsm } from "../../../../../deps.ts";
import * as govn from "../../../../../governance/mod.ts";
import * as nature from "../../../../std/nature.ts";
import * as dtr from "../../../../render/delimited-text.ts";
import * as tfr from "../../../../render/text.ts";
import * as am from "../../../../../lib/assets-metrics.ts";
import * as ds from "../../../../render/html/mod.ts";
import * as lds from "../../mod.ts";
import * as ldsL from "../../layout/mod.ts";

// deno-fmt-ignore
const metricsHTML: lds.LightningLayoutBodySupplier = (_layout) => `
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
<script type="text/javascript"
    src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>
<script type="text/javascript"
    src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.min.js"></script>
<link rel="stylesheet" type="text/css"
    href="https://cdnjs.cloudflare.com/ajax/libs/pivottable/2.23.0/pivot.min.css">
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/pivottable/2.23.0/pivot.min.js"></script>
<style>
    body {
        font-family: Verdana;
    }
</style>

<!-- optional: mobile support with jqueryui-touch-punch -->
<script type="text/javascript"
    src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"></script>

<script type="text/javascript">
    $(function () {
        Papa.parse("./analytics-extensions.csv", {
            download: true,
            skipEmptyLines: true,
            complete: function (parsed) {
                // "Date","Time",,"File Extension","Count of Files with Extension","Total Bytes in all Files with Extension","Build ID","Host"
                $("#summaryPivotUI").pivotUI(parsed.data, {
                    rows: ["File Extension", "Count of Files with Extension", "Total Bytes in all Files with Extension"],
                    cols: ["Date"],
                    rendererOptions: { table: { rowTotals: false, colTotals: false, } },
                });
            }
        });
        Papa.parse("./analytics-paths-extensions.csv", {
            download: true,
            skipEmptyLines: true,
            complete: function (parsed) {
                // "Date","Time","Files Path","File Extension in Path","Count of Files with Extension in Path","Total Bytes in all Files with Extension in Path","Build ID","Host"
                $("#typesPivotUI").pivotUI(parsed.data, {
                    rows: ["Files Path", "File Extension in Path", "Count of Files with Extension in Path", "Total Bytes in all Files with Extension in Path"],
                    cols: ["Date"],
                    rendererOptions: { table: { rowTotals: false, colTotals: false, } },
                });
            }
        });
    });
</script>
<p style="width: 800px"></p>
<h1>Publication Results</h1>
<h2>TODO: need to run assets metrics after final symlinks are done to include assets in <code>public</code></h2>
<div>
    <a href="./assets-metrics.json">View <code>metrics.json</code></a><br>
    <a href="./metrics.txt">View Exported OpenMetrics (in Prometheus Exposition Format)</a>
</div>

<h1>File counts and total bytes</h1>
<div id="summaryPivotUI" style="margin: 30px;"></div>

<h1>File counts and total bytes by type</h1>
<div id="typesPivotUI" style="margin: 30px;"></div>`

/**
 * Use routesResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function metricsHtmlFactorySupplier(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
): govn.ResourceFactorySupplier<govn.HtmlResource> {
  return {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const frontmatter:
        & govn.UntypedFrontmatter
        & ds.DesignSystemLayoutArgumentsSupplier = {
          layout: {
            identity: ldsL.noDecorationPage.identity,
          },
        };

      const sitemapHTML:
        & govn.PersistableHtmlResource
        & govn.RouteSupplier
        & govn.FrontmatterSupplier<govn.UntypedFrontmatter> = {
          nature: nature.htmlContentNature,
          frontmatter,
          route: {
            ...rf.childRoute(
              { unit: lds.indexUnitName, label: "Metrics" },
              parentRoute,
              false,
            ),
            nature: nature.htmlContentNature,
          },
          html: {
            // deno-lint-ignore require-await
            text: async (layout: lds.LightningLayout) => metricsHTML(layout),
            textSync: metricsHTML,
          },
        };
      return sitemapHTML;
    },
  };
}

export interface MetricsFactorySuppliersState {
  readonly assetsMetrics: am.AssetsMetricsResult;
}

/**
 * Use metricsFactorySuppliers as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function metricsFactorySuppliers(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  state: MetricsFactorySuppliersState,
  // deno-lint-ignore no-explicit-any
): govn.ResourceFactorySupplier<any>[] {
  return [{
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const pm = gsm.prometheusDialect();
      const text = pm.export(state.assetsMetrics.metrics.instances).join("\n");
      const metricsPEF: tfr.TextFileResource & govn.RouteSupplier = {
        nature: nature.textContentNature,
        route: {
          ...rf.childRoute(
            { unit: "metrics", label: "Assets OpenMetrics" },
            parentRoute,
            false,
          ),
          nature: nature.jsonContentNature,
        },
        isTextFileResource: true,
        text,
        textSync: text,
      };
      return metricsPEF;
    },
  }, {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const dts:
        & dtr.DelimitedTextSupplier<MetricsFactorySuppliersState>
        & govn.NatureSupplier<
          govn.MediaTypeNature<
            dtr.DelimitedTextResource<MetricsFactorySuppliersState>
          >
        >
        & govn.RouteSupplier = {
          nature: dtr.csvContentNature,
          route: {
            ...rf.childRoute(
              {
                unit: "analytics-extensions",
                label: "Analytics Extensions CSV",
              },
              parentRoute,
              false,
            ),
            nature: dtr.csvContentNature,
          },
          isDelimitedTextSupplier: true,
          header: state.assetsMetrics.summaryHeader.map((h) => `"${h}"`).join(
            ",",
          ),
          rows: state.assetsMetrics.summaryRows.map((row) => row.join(",")),
        };
      return dts;
    },
  }, {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const dts:
        & dtr.DelimitedTextSupplier<MetricsFactorySuppliersState>
        & govn.NatureSupplier<
          govn.MediaTypeNature<
            dtr.DelimitedTextResource<MetricsFactorySuppliersState>
          >
        >
        & govn.RouteSupplier = {
          nature: dtr.csvContentNature,
          route: {
            ...rf.childRoute(
              {
                unit: "analytics-paths-extensions",
                label: "Analytics Paths Extensions CSV",
              },
              parentRoute,
              false,
            ),
            nature: dtr.csvContentNature,
          },
          isDelimitedTextSupplier: true,
          header: state.assetsMetrics.pathsHeader.map((h) => `"${h}"`).join(
            ",",
          ),
          rows: state.assetsMetrics.pathsCSV.map((row) => row.join(",")),
        };
      return dts;
    },
  }, {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const metricsJSON: govn.PersistableJsonResource & govn.RouteSupplier = {
        nature: nature.jsonContentNature,
        route: {
          ...rf.childRoute(
            { unit: "assets-metrics", label: "Assets Metrics JSON" },
            parentRoute,
            false,
          ),
          nature: nature.jsonContentNature,
        },
        jsonInstance: () => state.assetsMetrics,
        jsonText: {
          // deno-lint-ignore require-await
          text: async () => {
            return JSON.stringify(state.assetsMetrics, undefined, "  ");
          },
          textSync: () => {
            return JSON.stringify(state.assetsMetrics, undefined, "  ");
          },
        },
      };
      return metricsJSON;
    },
  }];
}
