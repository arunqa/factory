import * as govn from "../../../../governance/mod.ts";
import * as n from "../../../std/nature.ts";
import * as rtree from "../../../std/route-tree.ts";
import * as lds from "../mod.ts";

// TODO: redirects might also want to generate (yield) .htaccess files too?
//       right now we're generating only HTML but .htaccess would be nice too
//       so that the server would send back a proper HTTP redirect.
// See: https://gist.github.com/ScottPhillips/1721489
//      https://www.redhat.com/sysadmin/beginners-guide-redirects-htaccess

export function redirectResources(
  resourcesTree: rtree.TypicalRouteTree,
): govn.ResourcesFactoriesSupplier<govn.HtmlResource> {
  return {
    resourcesFactories: async function* () {
      for (const alias of resourcesTree.redirects) {
        const htmlFS: govn.ResourceFactorySupplier<govn.HtmlResource> = {
          // deno-lint-ignore require-await
          resourceFactory: async () => {
            const redirectHTML: lds.LightningLayoutBodySupplier = (layout) => {
              const targetURL = layout.dsArgs.navigation.redirectUrl(alias);
              return `<!DOCTYPE HTML>
              <html lang="en-US">
                  <head>
                      <meta charset="UTF-8">
                      <meta http-equiv="refresh" content="0; url=${targetURL}">
                      <script type="text/javascript">window.location.href = "${targetURL}"</script>
                      <title>Redirect to ${alias.label}</title>
                  </head>
                  <body>
                      If you are not redirected automatically, follow <a href='${targetURL}'>${alias.label}</a>.                      
                  </body>
              </html>`;
            };

            const redirectResource:
              & govn.PersistableHtmlResource
              & govn.FrontmatterSupplier<govn.UntypedFrontmatter>
              & govn.RouteSupplier = {
                nature: n.htmlContentNature,
                frontmatter: {
                  layout: {
                    identity: "lds/page/no-decoration",
                  },
                },
                route: {
                  ...resourcesTree.routeFactory.childRoute(
                    { unit: "index", label: "Routes" },
                    alias.route!, // the route for aliases is created in rtree.TypicalRouteTree
                    false,
                  ),
                  nature: n.htmlContentNature,
                },
                html: {
                  // deno-lint-ignore require-await
                  text: async (layout: lds.LightningLayout) =>
                    redirectHTML(layout),
                  textSync: redirectHTML,
                },
              };
            return redirectResource;
          },
        };
        yield htmlFS;
      }
    },
  };
}
