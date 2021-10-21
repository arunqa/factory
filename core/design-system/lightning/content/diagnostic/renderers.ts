import * as govn from "../../../../../governance/mod.ts";
import * as nature from "../../../../std/nature.ts";
import * as route from "../../../../std/route.ts";
import * as lds from "../../mod.ts";

const layoutsGrid = "layouts";

// deno-fmt-ignore
const renderersHTML: lds.LightningLayoutBodySupplier = (layout) => `
<div id="${layoutsGrid}" style="width:1024px;" class="ag-theme-alpine"></div>
<script>
$script(
  "https://unpkg.com/ag-grid-community/dist/ag-grid-community.min.js",
  () => {
    const target = document.querySelector('#${layoutsGrid}');
    if(!target) {
      alert('Target "${layoutsGrid}" not found. Unable to render grid.');
      return;
    }
    const columnDefs = [
      { field: "name" },
      { field: "type" },
      { field: "source" }
    ];
    
    const rowData = [
      ${Array.from(layout.designSystem.layoutStrategies.layouts.values()).map(
        ls => { return JSON.stringify({ 
          name: ls.identity, 
          type: 'HtmlLayoutStrategy' 
        })}).join(", ")}
    ];
    
    const gridOptions = {
      columnDefs: columnDefs,
      rowData: rowData,
      domLayout: 'autoHeight',
    };
    new agGrid.Grid(target, gridOptions);    
  },
);
</script>`

/**
 * Use routesResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function renderersHtmlFactorySupplier(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
): govn.ResourceFactorySupplier<govn.HtmlResource> {
  return {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const sitemapHTML: govn.PersistableHtmlResource & govn.RouteSupplier = {
        nature: nature.htmlContentNature,
        route: {
          ...rf.childRoute(
            { unit: "renderers", label: "Renderers" },
            parentRoute,
            false,
          ),
          nature: nature.htmlContentNature,
          origin: route.routeModuleOrigin(
            import.meta.url,
            "renderersHtmlFactorySupplier",
          ),
        },
        html: {
          // deno-lint-ignore require-await
          text: async (layout: lds.LightningLayout) => renderersHTML(layout),
          textSync: renderersHTML,
        },
      };
      return sitemapHTML;
    },
  };
}
