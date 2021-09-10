import * as govn from "../../../governance/mod.ts";
import * as contrib from "../contributions.ts";

export type HtmlLayoutClientCargoJavaScriptValue = string;

export interface HtmlLayoutClientCargoValueSupplier {
  readonly clientCargoValue: <Layout extends HtmlLayout>(
    layout: Layout,
  ) => HtmlLayoutClientCargoJavaScriptValue;
}

export interface HtmlLayoutClientCargoSupplier {
  readonly clientCargoPropertyName: string;
}

export interface HtmlLayoutContributions {
  readonly stylesheets: contrib.Contributions;
  readonly scripts: contrib.Contributions;
  readonly head: contrib.Contributions;
  readonly body: contrib.Contributions;
  readonly diagnostics: contrib.Contributions;
}

export type HtmlLayoutBody =
  | govn.FlexibleContentSync
  | govn.FlexibleContent
  | govn.HtmlSupplier;

// deno-lint-ignore no-empty-interface
export interface HtmlLayoutStrategy<Layout extends HtmlLayout>
  extends govn.IdentifiableLayoutStrategy<Layout, govn.HtmlSupplier> {
}

// deno-lint-ignore no-empty-interface
export interface HtmlLayoutStrategySupplier<Layout extends HtmlLayout>
  extends govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier> {
}

export type HtmlLayoutDiagnosticsRequest =
  | boolean
  | "all"
  | "bodySource"
  | "layoutStrategySupplier"
  | "contributions"
  | "state";

export interface HtmlLayoutArguments {
  readonly diagnostics?: HtmlLayoutDiagnosticsRequest;
  readonly redirectConsoleToHTML?: boolean;
}

// TODO: implement contexts like production, sandbox, devl, test, staging, etc.
//       with type-safe properties (not just identities)
// export interface HtmlLayoutRenderContext {
// }

/*
TODO: Add Partial<govn.RenderContextSupplier<HtmlLayoutRenderContext>> to
HtmlLayout so that pages, partials, etc. can easily see which "environment"
like production, sandbox, devl, test, etc. they are running in.
*/
export interface HtmlLayout
  extends
    Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>>,
    HtmlLayoutClientCargoSupplier,
    HtmlLayoutArguments {
  readonly bodySource: HtmlLayoutBody;
  // deno-lint-ignore no-explicit-any
  readonly supplier: HtmlLayoutStrategySupplier<any>;
  readonly contributions: HtmlLayoutContributions;
}

/**
 * Used by Deno HTML modules as html: { text: HtmlLayoutBodySupplier }
 */
export interface HtmlLayoutBodySupplier {
  (layout: HtmlLayout): string;
}

export interface TemplateLiteralHtmlLayout<T, Layout extends HtmlLayout> {
  (
    literals: TemplateStringsArray,
    ...expressions: T[]
  ): HtmlLayoutStrategy<Layout>;
}

export interface HtmlTemplateExprBodyTextSupplier {
  (body?: string): string;
}

export interface HtmlTemplateExprLayoutSupplier<Layout extends HtmlLayout> {
  (
    body: string | undefined,
    layout: Layout,
  ): string | contrib.TextContributionsPlaceholder;
}

export type HtmlPartialUntyped = HtmlTemplateExprLayoutSupplier<HtmlLayout>;
export type HtmlPartial<Layout extends HtmlLayout> =
  HtmlTemplateExprLayoutSupplier<Layout>;

export type HelperFunctionOrString<Layout extends HtmlLayout> =
  | HtmlPartial<Layout>
  | string;
