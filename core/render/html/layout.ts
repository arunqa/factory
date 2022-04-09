import * as govn from "../../../governance/mod.ts";
import * as hGovn from "./governance.ts";
import * as c from "../../../core/std/content.ts";
import * as contrib from "../contributions.ts";
import * as r from "../../../core/std/render.ts";
import * as obs from "../../../core/std/observability.ts";
import * as e from "../../../lib/text/escape.ts";
import * as extn from "../../../lib/module/mod.ts";

// hide properties that could have circular references which will break JSON.stringify()
export const jsonStringifyRouteReplacer = (key: string, value: unknown) =>
  ["notifications", "owner", "parent", "children", "ancestors"].find((name) =>
      name == key
    )
    ? "(ignored)"
    : value;

export const htmlOperationalCtxDataAttrs:
  hGovn.HtmlOperationalCtxDomDataAttrsResolver = (
    layout: hGovn.HtmlLayout,
  ): string => {
    return `data-rf-operational-ctx='${
      e.escapeHtmlCustom(
        JSON.stringify(layout.operationalCtxClientCargo),
        e.matchHtmlRegExpForAttrSingleQuote,
      )
    }'`;
  };

export const htmlMetaOriginDomDataAttrs:
  hGovn.HtmlMetaOriginDomDataAttrsResolver = (
    layout: hGovn.HtmlLayout,
  ): string => {
    return `${
      layout.frontmatter
        ? `data-rf-origin-frontmatter='${
          e.escapeHtmlCustom(
            JSON.stringify(layout.frontmatter),
            e.matchHtmlRegExpForAttrSingleQuote,
          )
        }'`
        : ""
    }`;
  };

export const htmlNavigationOriginDomDataAttrs:
  hGovn.HtmlNavigationOriginDomDataAttrsResolver = (
    layout: hGovn.HtmlLayout,
  ): string => {
    return `${
      layout.activeRoute
        ? `data-rf-origin-nav-active-route='${
          e.escapeHtmlCustom(
            JSON.stringify(layout.activeRoute, jsonStringifyRouteReplacer),
            e.matchHtmlRegExpForAttrSingleQuote,
          )
        }'`
        : ""
    }`;
  };

export const htmlDesignSystemOriginDataAttrs:
  hGovn.HtmlDesignSystemOriginDomDataAttrsResolver = (
    layout: hGovn.HtmlLayout,
    srcModuleImportMetaURL: string,
    symbol: string,
  ): string => {
    const ls = layout.layoutSS.layoutStrategy;
    return `${
      layout.activeRoute
        ? `data-rf-origin-design-system='${
          e.escapeHtmlCustom(
            JSON.stringify({
              identity: layout.designSystem.identity,
              location: layout.designSystem.location,
              layout: {
                symbol,
                name: r.isIdentifiableLayoutStrategy(ls)
                  ? ls.identity
                  : undefined,
                src: srcModuleImportMetaURL,
                diagnostics: layout.diagnostics,
              },
              isPrettyURL: true, // TODO: if RF ever makes it optional, update this and account for it
              moduleAssetsBaseAbsURL: "", // TODO fill in base URL
              dsAssetsBaseAbsURL: layout.designSystem.dsAssetsBaseURL,
              universalAssetsBaseAbsURL:
                layout.designSystem.universalAssetsBaseURL,
            }),
            e.matchHtmlRegExpForAttrSingleQuote,
          )
        }'`
        : ""
    }`;
  };

export const typicalHtmlOriginResolvers: hGovn.HtmlOriginResolvers = {
  meta: htmlMetaOriginDomDataAttrs,
  navigation: htmlNavigationOriginDomDataAttrs,
  designSystem: htmlDesignSystemOriginDataAttrs,
  operationalCtx: htmlOperationalCtxDataAttrs,
  dataAttrs: (layout, srcModuleImportMetaURL, layoutSymbol) => {
    return `${typicalHtmlOriginResolvers.meta(layout)} ${
      typicalHtmlOriginResolvers.navigation(layout)
    } ${
      typicalHtmlOriginResolvers.designSystem(
        layout,
        srcModuleImportMetaURL,
        layoutSymbol,
      )
    } ${typicalHtmlOriginResolvers.operationalCtx(layout)}`;
  },
};

const bodyAsync = (
  instance: govn.FlexibleContent | govn.FlexibleContentSync | govn.HtmlSupplier,
) => c.isHtmlSupplier(instance) ? instance.html : instance;

const bodySync = (
  instance: govn.FlexibleContentSync | govn.FlexibleContent | govn.HtmlSupplier,
) => c.isHtmlSupplier(instance) ? instance.html : instance;

export function htmlLayoutContributions(): hGovn.HtmlLayoutContributions {
  return {
    scripts: contrib.contributions("<!-- scripts contrib -->"),
    stylesheets: contrib.contributions("<!-- stylesheets contrib -->"),
    head: contrib.contributions("<!-- head contrib -->"),
    body: contrib.contributions("<!-- body contrib -->"),
    diagnostics: contrib.contributions("<!-- diagnostics contrib -->"),
  };
}

export function htmlLayoutTemplate<T, Layout extends hGovn.HtmlLayout>(
  identity: string,
  location: extn.LocationSupplier,
): hGovn.TemplateLiteralHtmlLayout<T, Layout> {
  return (literals, ...suppliedExprs) => {
    const interpolate: (layout: Layout, body?: string) => string = (
      layout,
      body,
    ) => {
      // evaluate expressions and look for contribution placeholders
      const placeholders: number[] = [];
      const expressions: unknown[] = [];
      let exprIndex = 0;
      for (let i = 0; i < suppliedExprs.length; i++) {
        const expr = suppliedExprs[i];
        if (typeof expr === "function") {
          const exprValue = expr(layout, body);
          if (contrib.isTextContributionsPlaceholder(exprValue)) {
            placeholders.push(exprIndex);
            expressions[exprIndex] = expr; // we're going to run the function later
          } else {
            expressions[exprIndex] = exprValue;
          }
        } else {
          expressions[exprIndex] = expr;
        }
        exprIndex++;
      }
      if (placeholders.length > 0) {
        for (const ph of placeholders) {
          const tcph = (expressions[ph] as hGovn.HtmlPartial<Layout>)(
            layout as Layout,
            body,
          );
          expressions[ph] = contrib.isTextContributionsPlaceholder(tcph)
            ? tcph.contributions.map((c) => c.content).join("\n")
            : tcph;
        }
      }
      let interpolated = "";
      for (let i = 0; i < expressions.length; i++) {
        interpolated += literals[i];
        interpolated += typeof expressions[i] === "string"
          ? expressions[i]
          : Deno.inspect(expressions[i]);
      }
      interpolated += literals[literals.length - 1];
      return interpolated;
    };
    const layoutStrategy: hGovn.HtmlLayoutStrategy<Layout> = {
      identity,
      location,
      rendered: async (layout) => {
        const resource = layout.bodySource;
        const ftcOptions = { functionArgs: [layout] };
        const activeBody = c.isHtmlSupplier(resource)
          ? await c.flexibleTextCustom(resource.html, ftcOptions)
          : (c.isFlexibleContentSupplier(resource)
            ? await c.flexibleTextCustom(bodyAsync(resource), ftcOptions)
            : undefined);
        if (layout.contentStrategy.lintReporter) {
          const lintReporter: govn.LintReporter = {
            ...layout.contentStrategy.lintReporter,
            report: (ld) => {
              layout.contentStrategy.lintReporter!.report({
                ...ld,
                layout,
              });
            },
          };
          if (obs.isLintable(layout)) {
            layout.lint(lintReporter);
          }
          if (obs.isLintable(layout.layoutSS)) {
            layout.layoutSS.lint(lintReporter);
          }
        }
        return { ...resource, html: interpolate(layout, activeBody) };
      },
      renderedSync: (layout) => {
        const resource = layout.bodySource;
        const ftcOptions = { functionArgs: [layout] };
        const activeBody = c.isHtmlSupplier(resource)
          ? c.flexibleTextSyncCustom(resource.html, ftcOptions)
          : (c.isFlexibleContentSyncSupplier(resource)
            ? c.flexibleTextSyncCustom(bodySync(resource), ftcOptions)
            : undefined);
        if (layout.contentStrategy.lintReporter) {
          const lintReporter: govn.LintReporter = {
            ...layout.contentStrategy.lintReporter,
            report: (ld) => {
              layout.contentStrategy.lintReporter!.report({
                ...ld,
                layout,
              });
            },
          };
          if (obs.isLintable(layout)) {
            layout.lint(lintReporter);
          }
          if (obs.isLintable(layout.layoutSS)) {
            layout.layoutSS.lint(lintReporter);
          }
        }
        return { ...resource, html: interpolate(layout, activeBody) };
      },
    };

    return layoutStrategy;
  };
}
