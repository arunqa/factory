import { govnSvcMetrics as gsm } from "../../../deps.ts";
import * as fsA from "../../../lib/fs/fs-analytics.ts";
import * as govn from "../../../governance/mod.ts";
import * as dGovn from "./governance.ts";
import * as nature from "../../std/nature.ts";
import * as dtr from "../../render/delimited-text.ts";
import * as tfr from "../../render/text.ts";
import * as ds from "../../render/html/mod.ts";

// deno-fmt-ignore
const metricsHTML: ds.HtmlLayoutBodySupplier = () => `
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
        Papa.parse("./analytics-paths-extensions.csv", {
            download: true,
            skipEmptyLines: true,
            complete: function (parsed) {
                // "Date","Time","Files Path","File Extension in Path","Count of Files with Extension in Path","Total Bytes in all Files with Extension in Path","Build ID","Host"
                $("#typesPivotUI").pivotUI(parsed.data, {
                    rows: ["Scope", "Files Path", "File Extension in Path", "Count of Files with Extension in Path", "Total Bytes in all Files with Extension in Path"],
                    cols: ["Date"],
                    rendererOptions: { table: { rowTotals: false, colTotals: false, } },
                });
            }
        });
    });
</script>
<p style="width: 800px"></p>
<h1>Publication Results</h1>
<h2>TODO: assets metrics do not properly count contents of <code>public</code> because of symlinks instead of hardlinks</h2>
<div>
    <a href="./assets-metrics.json">View <code>metrics.json</code></a><br>
    <a href="./health.json">View <code>health.json</code></a><br>
    <a href="./metrics.txt">View Exported OpenMetrics (in Prometheus Exposition Format)</a>
</div>

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
  _state: dGovn.PreProduceObservabilityState,
): govn.ResourceFactorySupplier<govn.HtmlResource> {
  return {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const frontmatter:
        & govn.UntypedFrontmatter
        & ds.DesignSystemLayoutArgumentsSupplier = {
          layout: {
            identity: ds.designSystemNoDecorationPage.identity,
          },
        };

      const htmlResource:
        & govn.PersistableHtmlResource
        & govn.RouteSupplier
        & govn.FrontmatterSupplier<govn.UntypedFrontmatter> = {
          nature: nature.htmlContentNature,
          frontmatter,
          route: {
            ...rf.childRoute(
              { unit: ds.indexUnitName, label: "Metrics" },
              parentRoute,
              false,
            ),
            nature: nature.htmlContentNature,
          },
          html: {
            // deno-lint-ignore require-await
            text: async (layout: ds.HtmlLayout) => metricsHTML(layout),
            textSync: metricsHTML,
          },
        };
      return htmlResource;
    },
  };
}

/**
 * Use metricsFactorySuppliers as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function metricsFactorySuppliers(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  state: dGovn.PostProduceObservabilityState,
  // deno-lint-ignore no-explicit-any
): govn.ResourceFactorySupplier<any>[] {
  return [{
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const pm = gsm.prometheusDialect();
      const text = pm.export(state.metrics.assets.collected.metrics.instances)
        .join("\n");
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
        & dtr.DelimitedTextSupplier<dGovn.PostProduceMetricsResourcesState>
        & govn.NatureSupplier<
          govn.MediaTypeNature<
            dtr.DelimitedTextResource<dGovn.PostProduceMetricsResourcesState>
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
          header: state.metrics.assets.collected.pathExtnsColumnHeaders.map((
            h,
          ) => `"${h}"`).join(
            ",",
          ),
          rows: state.metrics.assets.collected.pathExtnsColumns.map((row) =>
            row.join(",")
          ),
        };
      return dts;
    },
  }, {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const metricsJSON:
        & govn.PersistableStructuredDataResource
        & govn.RouteSupplier = {
          nature: nature.jsonContentNature,
          route: {
            ...rf.childRoute(
              { unit: "assets-metrics", label: "Assets Metrics JSON" },
              parentRoute,
              false,
            ),
            nature: nature.jsonContentNature,
          },
          structuredDataInstance: () => state.metrics.assets.collected.metrics,
          serializedData: {
            // deno-lint-ignore require-await
            text: async () => {
              return JSON.stringify(
                state.metrics.assets.collected.metrics,
                fsA.jsonMetricsReplacer,
                "  ",
              );
            },
            textSync: () => {
              return JSON.stringify(
                state.metrics.assets.collected.metrics,
                fsA.jsonMetricsReplacer,
                "  ",
              );
            },
          },
        };
      return metricsJSON;
    },
  }];
}
