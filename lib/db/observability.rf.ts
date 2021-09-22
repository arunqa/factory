import * as govn from "../../governance/mod.ts";
import * as nature from "../../core/std/nature.ts";
import * as rModule from "../../core/resource/module/module.ts";
import * as htmlDS from "../../core/render/html/mod.ts";
import "./sql.ts"; // for window.* globals

const sqlHTML: htmlDS.HtmlLayoutBodySupplier = (_layout) => {
  const dbAccesses = window.globalSqlDbConns
    ? Array.from(window.globalSqlDbConns.values()).map((conn) =>
      Deno.inspect(conn)
    )
    : [];
  // deno-fmt-ignore
  return `<pre>
  ${window.globalSqlDbConns ? dbAccesses.length > 0 ? dbAccesses.join("\n\n") : "database accesses not required (no proxies or caches were updated)" : "window.globalSqlDbConns not initialized"}
  </pre>`
};

/**
 * Use observabilityResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function observabilityResources(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  // deno-lint-ignore no-explicit-any
): govn.ResourcesFactoriesSupplier<any> {
  return {
    resourcesFactories: async function* () {
      const htmlFS: govn.ResourceFactorySupplier<govn.HtmlResource> = {
        // deno-lint-ignore require-await
        resourceFactory: async () => {
          const html: govn.PersistableHtmlResource & govn.RouteSupplier = {
            nature: nature.htmlContentNature,
            route: {
              ...rf.childRoute(
                { unit: "databases", label: "Databases" },
                parentRoute,
                false,
              ),
              nature: nature.htmlContentNature,
            },
            html: {
              // deno-lint-ignore require-await
              text: async (layout: htmlDS.HtmlLayout) => sqlHTML(layout),
              textSync: sqlHTML,
            },
          };
          return html;
        },
      };
      yield htmlFS;
    },
  };
}

/**
 * Use fileSysModuleConstructor to include these resources as part of a file
 * system origination source instead of directly as originators. For example,
 * you can create something like this:
 *
 * content/
 *   observability/
 *     index.r.ts
 *
 * And in index.r.ts you would have:
 *   import * as o from "../../../core/design-system/lightning/content/observability.r.ts";
 *   export default o.fileSysModuleConstructor;
 *
 * The above would allow you move the resources anywhere just by setting up the right
 * files.
 *
 * @param we The walk entry where the resources should be generated
 * @param options Configuration preferences
 * @param imported The module thats imported (e.g. index.r.ts)
 * @returns
 */
export const fileSysModuleConstructor:
  // deno-lint-ignore require-await
  rModule.FileSysResourceModuleConstructor<unknown> = async (
    we,
    options,
    imported,
  ) => {
    return {
      imported,
      isChildResourcesFactoriesSupplier: true,
      yieldParentWithChildren: false,
      ...observabilityResources(we.route, options.fsRouteFactory),
    };
  };
