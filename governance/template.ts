export interface TemplateEngineSupplier<TemplateEngine> {
  readonly templateEngine: TemplateEngine;
}

export interface TemplateEnginesSupplier<TemplateEngine, Identity> {
  readonly templateEngine: (name: Identity) => TemplateEngine;
}

export interface TemplateSupplier<Template> {
  readonly template: Template;
}

export interface TemplatesSupplier<Template, Identity> {
  readonly template: (name: Identity) => Template;
}

export interface TemplateRenderingSupplier<Context, Result> {
  readonly renderedTemplate: (ctx: Context) => Result;
}

export interface TextInterpolationResult {
  readonly interpolated: string;
}

// deno-lint-ignore no-empty-interface
export interface TextInterpolationTemplate
  extends TemplateRenderingSupplier<unknown, TextInterpolationResult> {
}

// deno-lint-ignore no-empty-interface
export interface TextInterpolationTemplateSupplier<Result>
  extends TemplateSupplier<TextTemplateLiteral<Result>> {
}

export interface TextTemplateLiteral<Result> {
  (
    literals: TemplateStringsArray,
    ...expressions: unknown[]
  ): Result;
}

export interface HtmlTag {
  (
    paramsOrBody: string | string[] | Record<string, unknown>,
    body?: string,
  ): string;
}
