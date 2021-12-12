import * as govn from "../../../governance/mod.ts";
import * as html from "../../render/html/mod.ts";
import * as lds from "./governance.ts";
import * as ldsL from "./layout/mod.ts";
import * as n from "../../std/nature.ts";

export function typicalHtmlResource(
  rf: govn.RouteFactory,
  parentRoute: govn.Route,
  childUnit: govn.RouteUnit,
  frontmatter:
    & govn.UntypedFrontmatter
    & html.DesignSystemLayoutArgumentsSupplier,
  HTML: lds.LightningLayoutBodySupplier,
  origin?: govn.ModuleRouteOrigin,
  indexKeys?: govn.ResourceIndexKey[],
): [
  route: govn.Route,
  factory: govn.PersistableHtmlResource,
] {
  const route = {
    ...rf.childRoute(
      childUnit,
      parentRoute,
      true,
    ),
    nature: n.htmlContentNature,
    origin,
  };
  const htmlResource:
    & govn.PersistableHtmlResource
    & govn.RouteSupplier
    & govn.FrontmatterSupplier<govn.UntypedFrontmatter> = {
      nature: n.htmlContentNature,
      frontmatter,
      route,
      html: {
        // deno-lint-ignore require-await
        text: async (layout: lds.LightningLayout) => HTML(layout),
        textSync: HTML,
      },
    };
  if (indexKeys) {
    (htmlResource as unknown as govn.MutatableResourceIndexKeysSupplier)
      .indexKeys = indexKeys;
  }
  return [route, htmlResource];
}

export function smartNavigationPageHtmlFactory(
  rf: govn.RouteFactory,
  parentRoute: govn.Route,
  childUnit: govn.RouteUnit,
  HTML: lds.LightningLayoutBodySupplier,
  origin?: govn.ModuleRouteOrigin,
  indexKeys?: govn.ResourceIndexKey[],
): [
  route: govn.Route,
  factory: govn.ResourceFactorySupplier<govn.HtmlResource>,
] {
  const frontmatter:
    & govn.UntypedFrontmatter
    & html.DesignSystemLayoutArgumentsSupplier = {
      layout: {
        identity: ldsL.smartNavigationPage.identity,
      },
    };

  return typicalHtmlFactory(
    rf,
    parentRoute,
    childUnit,
    frontmatter,
    HTML,
    origin,
    indexKeys,
  );
}

export function typicalHtmlFactory(
  rf: govn.RouteFactory,
  parentRoute: govn.Route,
  childUnit: govn.RouteUnit,
  frontmatter:
    & govn.UntypedFrontmatter
    & html.DesignSystemLayoutArgumentsSupplier,
  HTML: lds.LightningLayoutBodySupplier,
  origin?: govn.ModuleRouteOrigin,
  indexKeys?: govn.ResourceIndexKey[],
): [
  route: govn.Route,
  factory: govn.ResourceFactorySupplier<govn.HtmlResource>,
] {
  const [route, resource] = typicalHtmlResource(
    rf,
    parentRoute,
    childUnit,
    frontmatter,
    HTML,
    origin,
    indexKeys,
  );
  return [route, {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      return resource;
    },
  }];
}

export function autoIndexHtmlFactory(
  rf: govn.RouteFactory,
  parentRoute: govn.Route,
  label: string,
  origin?: govn.ModuleRouteOrigin,
  indexKeys?: govn.ResourceIndexKey[],
): [
  route: govn.Route,
  factory: govn.ResourceFactorySupplier<govn.HtmlResource>,
] {
  const route = {
    ...rf.childRoute(
      { unit: html.indexUnitName, label },
      parentRoute,
      true,
    ),
    nature: n.htmlContentNature,
    origin,
  };
  return [route, {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const frontmatter:
        & govn.UntypedFrontmatter
        & html.DesignSystemLayoutArgumentsSupplier = {
          layout: {
            identity: ldsL.innerIndexAutoPage.identity,
          },
        };

      // body is empty since it's an auto-index page
      const HTML = ``;
      const htmlResource:
        & govn.PersistableHtmlResource
        & govn.RouteSupplier
        & govn.FrontmatterSupplier<govn.UntypedFrontmatter> = {
          nature: n.htmlContentNature,
          frontmatter,
          route,
          html: {
            text: HTML,
            textSync: HTML,
          },
        };
      if (indexKeys) {
        (htmlResource as unknown as govn.MutatableResourceIndexKeysSupplier)
          .indexKeys = indexKeys;
      }
      return htmlResource;
    },
  }];
}
