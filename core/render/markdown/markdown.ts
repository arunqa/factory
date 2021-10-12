import { safety } from "../../../deps.ts";
import { default as markdownIt } from "https://jspm.dev/markdown-it@12.2.0";
import { default as markdownItReplaceLink } from "https://jspm.dev/markdown-it-replace-link@1.1.0";
import { default as markdownItFootnote } from "https://jspm.dev/markdown-it-footnote@3.0.3";
import { default as markdownItAnchor } from "https://jspm.dev/markdown-it-anchor@8.3.0";
import { default as markdownItTitle } from "https://jspm.dev/markdown-it-title@4.0.0";
import { default as markdownItDirective } from "https://jspm.dev/markdown-it-directive@1.0.1";
import * as govn from "../../../governance/mod.ts";
import * as c from "../../../core/std/content.ts";
import * as m from "../../../core/std/model.ts";
import * as fm from "../../../core/std/frontmatter.ts";
import * as md from "../../resource/markdown.ts";
import mdStyle from "./markdown.css.ts";

/**
 * markdownRenderEnv is available after Markdown rendering and includes
 * properties such as titles, footnotes, and other "generated" attributes.
 */
export interface MarkdownRenderEnvSupplier<
  RenderEnv extends Record<string, unknown>,
> {
  readonly markdownRenderEnv: RenderEnv;
}

export interface MarkdownContentDirective<Attributes>
  extends MarkdownRenderEnvSupplier<Record<string, unknown>> {
  readonly isMarkdownContentDirective: true;
  readonly identity: govn.DirectiveIdentity;
  readonly content: string;
  readonly destinations?: [link: string, string: string][];
  readonly attributes?: Attributes;
}

export interface MarkdownContentInlineDirective<Attributes>
  extends MarkdownContentDirective<Attributes> {
  readonly isMarkdownContentInlineDirective: true;
}

export interface MarkdownItOptions {
  readonly html?: boolean;
  readonly xhtmlOut?: boolean;
  readonly breaks?: boolean;
  readonly langPrefix?: string;
  readonly linkify?: boolean;
  readonly typographer?: boolean;
  readonly quotes?: string | string[];
}

export interface MarkdownItOptionsSupplier {
  readonly markdown: MarkdownItOptions;
}

export const isMarkdownItOptionsSupplier = safety.typeGuard<
  MarkdownItOptionsSupplier
>("markdown");

export type MarkdownLayoutStrategy = govn.LayoutStrategy<
  md.MarkdownResource,
  govn.HtmlSupplier
>;

export type DefaultMarkdownLayoutSupplier = govn.DefaultLayoutStrategySupplier<
  md.MarkdownResource,
  govn.HtmlSupplier
>;

export interface MarkdownLinkUrlRewriter {
  (parsedURL: string, renderEnv: Record<string, unknown>): string;
}

export interface MarkdownLayoutPreferences {
  readonly directiveExpectations?: govn.DirectiveExpectationsSupplier<
    govn.DirectiveExpectation<
      // deno-lint-ignore no-explicit-any
      MarkdownContentDirective<any>,
      string | undefined
    >
  >;
  readonly rewriteURL?: MarkdownLinkUrlRewriter;
  readonly transformRendered?: (
    rendered: string,
    resource: md.MarkdownResource,
  ) => string;
}

export class TypicalMarkdownLayout implements MarkdownLayoutStrategy {
  // deno-lint-ignore no-explicit-any
  readonly mdiRenderer: any;

  constructor(
    readonly identity: string,
    readonly mpl?: MarkdownLayoutPreferences,
    mdiOptions?: MarkdownItOptions,
  ) {
    // @ts-ignore: This expression is not callable.
    this.mdiRenderer = markdownIt({
      html: true,
      linkify: true,
      ...mdiOptions,
      replaceLink: this.mpl?.rewriteURL,
    });
    if (this.mpl?.rewriteURL) {
      this.mdiRenderer.use(markdownItReplaceLink);
    }
    this.mdiRenderer.use(markdownItFootnote);
    this.mdiRenderer.use(markdownItAnchor); // TODO: use callback to track headings?
    this.mdiRenderer.use(markdownItTitle, { level: 0 }); // TODO: grab excerpts too?
    if (this.mpl?.directiveExpectations) {
      this.mdiRenderer.use(markdownItDirective)
        // deno-lint-ignore no-explicit-any
        .use((md: any) => {
          for (
            const de of this.mpl!.directiveExpectations!.allowedDirectives()
          ) {
            md.inlineDirectives[de.identity] = (
              // deno-lint-ignore no-explicit-any
              state: any,
              // deno-lint-ignore no-explicit-any
              content: any,
              // deno-lint-ignore no-explicit-any
              dests: any,
              // deno-lint-ignore no-explicit-any
              attrs: any,
            ) => {
              const token = state.push("html_inline", "", 0);
              const directive: MarkdownContentInlineDirective<
                Record<string, string>
              > = {
                isMarkdownContentDirective: true,
                isMarkdownContentInlineDirective: true,
                markdownRenderEnv: state.env,
                identity: de.identity,
                content: content,
                destinations: dests
                  ? (Array.isArray(dests) ? dests : undefined)
                  : undefined,
                attributes:
                  typeof attrs === "object" && Object.keys(attrs).length > 0
                    ? attrs
                    : undefined,
              };
              const result = de.encountered(directive);
              token.content = typeof result === "string"
                ? result
                : JSON.stringify({
                  directive: de.identity,
                  content,
                  dests,
                  attrs,
                });
            };
          }
        });
    }
  }

  renderedMarkdownResource(
    resource: md.MarkdownResource,
    sourceText: string | undefined,
    defaultText: string,
  ): govn.HtmlSupplier {
    // we want resource to be available during rendering for directives
    const markdownRenderEnv = { resource };
    const html = this.mdiRenderer.render(
      sourceText || defaultText,
      markdownRenderEnv,
    );
    // deno-lint-ignore no-explicit-any
    delete (markdownRenderEnv as any).resource; // should not go into model
    // take each property in markdownRenderEnv and put it into resource.model
    m.mutateModelProperties(markdownRenderEnv, resource, {
      append: [["isContentAvailable", sourceText ? true : false]],
    });
    return {
      ...resource,
      html: this.mpl?.transformRendered
        ? this.mpl.transformRendered(html, resource)
        : html,
    };
  }

  async rendered(resource: md.MarkdownResource): Promise<govn.HtmlSupplier> {
    return this.renderedMarkdownResource(
      resource,
      await c.flexibleTextCustom(resource),
      "async text not available in resource",
    );
  }

  renderedSync(resource: md.MarkdownResource): govn.HtmlSupplier {
    return this.renderedMarkdownResource(
      resource,
      c.flexibleTextSyncCustom(resource),
      "sync text not available in resource",
    );
  }
}

export const defaultMarkdownStylesheetClassName = "md";
export const defaultMarkdownStyleTagUsingDataURI = mdStyle(
  defaultMarkdownStylesheetClassName,
);

export class MarkdownLayouts
  implements govn.LayoutStrategies<md.MarkdownResource, govn.HtmlSupplier> {
  readonly defaultLayoutStrategySupplier: DefaultMarkdownLayoutSupplier;
  readonly layouts: Map<govn.LayoutStrategyIdentity, MarkdownLayoutStrategy> =
    new Map();

  constructor(readonly mpl?: MarkdownLayoutPreferences) {
    const layoutStrategy = new TypicalMarkdownLayout(
      "html-in-md-div-with-style-as-data-URI",
      {
        // deno-fmt-ignore
        transformRendered: (rendered) => `${defaultMarkdownStyleTagUsingDataURI}
        <div class="${defaultMarkdownStylesheetClassName}">${rendered}</div>`,
        ...this.mpl,
      },
    );
    this.defaultLayoutStrategySupplier = {
      isDefaultLayoutStrategy: true,
      layoutStrategy,
    };
    this.layouts.set(layoutStrategy.identity, layoutStrategy);
  }

  layoutStrategy(
    name: govn.LayoutStrategyIdentity,
  ): MarkdownLayoutStrategy | undefined {
    return this.layouts.get(name);
  }

  diagnosticLayoutStrategy(
    layoutStrategyErrorDiagnostic: string,
    dl?: DefaultMarkdownLayoutSupplier,
  ): govn.ErrorLayoutStrategySupplier<md.MarkdownResource, govn.HtmlSupplier> {
    return {
      ...(dl || this.defaultLayoutStrategySupplier),
      isErrorLayoutStrategySupplier: true,
      layoutStrategyErrorDiagnostic,
    };
  }

  namedLayoutStrategy(
    name: govn.LayoutStrategyIdentity,
  ): govn.LayoutStrategySupplier<md.MarkdownResource, govn.HtmlSupplier> {
    const layoutStrategy = this.layoutStrategy(name);
    if (layoutStrategy) {
      const named: govn.NamedLayoutStrategySupplier<
        md.MarkdownResource,
        govn.HtmlSupplier
      > = {
        layoutStrategy,
        isNamedLayoutStrategyStrategySupplier: true,
        layoutStrategyIdentity: name,
      };
      return named;
    }
    return this.diagnosticLayoutStrategy(`layout named '${name}' not found`);
  }
}

export class MarkdownRenderStrategy
  implements govn.RenderStrategy<md.MarkdownResource, govn.HtmlSupplier> {
  readonly identity = "markdown";

  constructor(
    readonly layoutStrategies: MarkdownLayouts,
    readonly frontmatterPropNames = ["markdown", "mdrender"],
  ) {
  }

  frontmatterPropertyLayout(
    fmPropertyName: string,
    layoutName?: unknown,
  ):
    | govn.LayoutStrategySupplier<md.MarkdownResource, govn.HtmlSupplier>
    | undefined {
    if (!layoutName) return undefined;
    if (typeof layoutName === "string") {
      const layoutStrategy = layoutName
        ? this.layoutStrategies.layoutStrategy(layoutName)
        : undefined;
      if (layoutStrategy) {
        const named:
          & govn.NamedLayoutStrategySupplier<
            md.MarkdownResource,
            govn.HtmlSupplier
          >
          & govn.FrontmatterLayoutStrategySupplier<
            md.MarkdownResource,
            govn.HtmlSupplier
          > = {
            layoutStrategy,
            isNamedLayoutStrategyStrategySupplier: true,
            isInferredLayoutStrategySupplier: true,
            isFrontmatterLayoutStrategy: true,
            layoutStrategyIdentity: layoutName,
            frontmatterLayoutStrategyPropertyName: fmPropertyName,
          };
        return named;
      }
    }
  }

  inferredLayoutStrategy(
    s: Partial<
      | govn.FrontmatterSupplier<govn.UntypedFrontmatter>
      | govn.ModelSupplier<govn.UntypedModel>
    >,
  ): govn.LayoutStrategySupplier<md.MarkdownResource, govn.HtmlSupplier> {
    if (fm.isFrontmatterSupplier(s) && s.frontmatter) {
      for (const propName of this.frontmatterPropNames) {
        if (propName in s.frontmatter) {
          const layoutName = s.frontmatter[propName];
          const layout = this.frontmatterPropertyLayout(propName, layoutName);
          if (layout) return layout;
          return this.layoutStrategies.diagnosticLayoutStrategy(
            `frontmatter '${propName}' property '${s.frontmatter.mdrender}' not found in MarkdownRenderStrategy.frontmatterLayoutStrategy`,
          );
        }
        return this.layoutStrategies.diagnosticLayoutStrategy(
          `frontmatter property not found: ${
            this.frontmatterPropNames.map((pn) => `'${pn}'`).join(" or ")
          } in MarkdownRenderStrategy.frontmatterLayoutStrategy`,
        );
      }
    }
    return this.layoutStrategies.diagnosticLayoutStrategy(
      `neither frontmatter nor model available, using default in MarkdownRenderStrategy.frontmatterLayoutStrategy`,
    );
  }

  /**
   * Create an ansynchronous refinery which uses Frontmatter to drive a Markdown renderer
   * @returns async resource refinery which returns the resource plus a new `html` property
   */
  renderer(): govn.ResourceRefinery<md.MarkdownResource> {
    return async (resource) => {
      const lss = fm.isFrontmatterSupplier(resource)
        ? this.inferredLayoutStrategy(resource)
        : this.layoutStrategies.diagnosticLayoutStrategy(
          "Frontmatter not supplied to MarkdownRenderStrategy.renderer",
        );
      return await lss.layoutStrategy.rendered(
        resource,
      ) as (md.MarkdownResource & govn.HtmlSupplier);
    };
  }

  /**
   * Create a syncronous refinery which uses Frontmatter to drive a Markdown renderer
   * @returns sync resource refinery which returns the resource plus a new `html` property
   */
  rendererSync(): govn.ResourceRefinerySync<md.MarkdownResource> {
    return (resource) => {
      const lss = fm.isFrontmatterSupplier(resource)
        ? this.inferredLayoutStrategy(resource)
        : this.layoutStrategies.diagnosticLayoutStrategy(
          "Frontmatter not supplied to MarkdownRenderStrategy.renderer",
        );
      return lss.layoutStrategy.renderedSync(
        resource,
      ) as (md.MarkdownResource & govn.HtmlSupplier);
    };
  }
}
