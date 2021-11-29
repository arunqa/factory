import * as govn from "../../../governance/mod.ts";
import * as hGovn from "./governance.ts";
import * as c from "../../../core/std/content.ts";
import * as contrib from "../contributions.ts";
import * as r from "../../../core/std/render.ts";
import * as obs from "../../../core/std/observability.ts";

export const htmlLayoutOriginDataAttrs:
  hGovn.HtmlLayoutOriginDomDataAttrsResolver = (
    layout: hGovn.HtmlLayout,
    srcModuleImportMetaURL: string,
    symbol: string,
  ): string => {
    const ls = layout.layoutSS.layoutStrategy;
    return `data-rf-origin-layout-symbol="${symbol}" ${
      r.isIdentifiableLayoutStrategy(ls)
        ? `data-rf-origin-layout-name="${ls.identity}"`
        : ""
    }" data-rf-origin-layout-src="${srcModuleImportMetaURL}"`;
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
      rendered: async (layout) => {
        const resource = layout.bodySource;
        const ftcOptions = { functionArgs: [layout] };
        const activeBody = c.isHtmlSupplier(resource)
          ? await c.flexibleTextCustom(resource.html, ftcOptions)
          : (c.isFlexibleContentSupplier(resource)
            ? await c.flexibleTextCustom(bodyAsync(resource), ftcOptions)
            : undefined);
        if (layout.dsCtx.lintReporter) {
          const lintReporter: govn.LintReporter = {
            ...layout.dsCtx.lintReporter,
            report: (ld) => {
              layout.dsCtx.lintReporter!.report({
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
        if (layout.dsCtx.lintReporter) {
          const lintReporter: govn.LintReporter = {
            ...layout.dsCtx.lintReporter,
            report: (ld) => {
              layout.dsCtx.lintReporter!.report({
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
