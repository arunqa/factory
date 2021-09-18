import { safety } from "../../deps.ts";
import * as govn from "../../../governance/mod.ts";
import * as fm from "../../std/frontmatter.ts";
import * as html from "../../render/html/mod.ts";
import * as contrib from "../contributions.ts";

export interface DesignSystemLayoutArgumentsSupplier {
  readonly layout:
    | govn.RenderStrategyIdentity
    | ({
      readonly identity?: govn.RenderStrategyIdentity;
    } & html.HtmlLayoutArguments);
}

export const isPotentialDesignSystemLayoutArgumentsSupplier = safety.typeGuard<
  DesignSystemLayoutArgumentsSupplier
>("layout");

export function isDesignSystemLayoutArgumentsSupplier(
  o: unknown,
): o is DesignSystemLayoutArgumentsSupplier {
  if (isPotentialDesignSystemLayoutArgumentsSupplier(o)) {
    if (typeof o.layout === "string") return true;
    if (typeof o.layout === "object") return true;
  }
  return false;
}

export interface DesignSystemArgumentsSupplier {
  readonly designSystem: DesignSystemLayoutArgumentsSupplier;
}

export const isPotentialDesignSystemArgumentsSupplier = safety.typeGuard<
  DesignSystemArgumentsSupplier
>("designSystem");

export interface KebabCaseDesignSystemArgumentsSupplier {
  readonly "design-system": DesignSystemLayoutArgumentsSupplier;
}

export const isKebabCaseDesignSystemArgumentsSupplier = safety.typeGuard<
  KebabCaseDesignSystemArgumentsSupplier
>("design-system");

export function isDesignSystemArgumentsSupplier(
  o: unknown,
): o is DesignSystemArgumentsSupplier {
  if (isPotentialDesignSystemArgumentsSupplier(o)) {
    if (isDesignSystemLayoutArgumentsSupplier(o.designSystem)) return true;
  }
  return false;
}

export function isFlexibleMutatedDesignSystemArgumentsSupplier(
  o: unknown,
): o is DesignSystemArgumentsSupplier {
  if (isKebabCaseDesignSystemArgumentsSupplier(o)) {
    // deno-lint-ignore no-explicit-any
    const mutatableO = o as any;
    mutatableO.designSystem = o["design-system"];
    delete mutatableO["design-system"];
  }
  return isDesignSystemArgumentsSupplier(o);
}

export class DesignSystemLayouts<Layout extends html.HtmlLayout>
  implements govn.LayoutStrategies<Layout, govn.HtmlSupplier> {
  readonly layouts: Map<
    govn.LayoutStrategyIdentity,
    html.HtmlLayoutStrategy<Layout>
  > = new Map();

  constructor(
    readonly defaultLayoutStrategySupplier: html.HtmlLayoutStrategySupplier<
      Layout
    >,
  ) {
  }

  layoutStrategy(
    name: govn.LayoutStrategyIdentity,
  ): html.HtmlLayoutStrategy<Layout> | undefined {
    return this.layouts.get(name);
  }

  diagnosticLayoutStrategy(
    layoutStrategyErrorDiagnostic: string,
    dl?: html.HtmlLayoutStrategySupplier<Layout>,
  ): govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier> {
    const result: govn.ErrorLayoutStrategySupplier<Layout, govn.HtmlSupplier> =
      {
        ...(dl || this.defaultLayoutStrategySupplier),
        isErrorLayoutStrategySupplier: true,
        layoutStrategyErrorDiagnostic,
      };
    return result;
  }

  namedLayoutStrategy(
    name: govn.LayoutStrategyIdentity,
  ): govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier> {
    const layoutStrategy = this.layoutStrategy(name);
    if (layoutStrategy) {
      const named: govn.NamedLayoutStrategySupplier<Layout, govn.HtmlSupplier> =
        {
          layoutStrategy,
          isNamedLayoutStrategyStrategySupplier: true,
          layoutStrategyIdentity: name,
        };
      return named;
    }
    return this.diagnosticLayoutStrategy(`layout named '${name}' not found`);
  }
}

export abstract class DesignSystem<Layout extends html.HtmlLayout>
  implements govn.RenderStrategy<Layout, govn.HtmlSupplier> {
  constructor(
    readonly identity: govn.RenderStrategyIdentity,
    readonly layoutStrategies: DesignSystemLayouts<Layout>,
  ) {
  }

  abstract symlinkAssets(destRootPath: string): Promise<void>;
  abstract layout(
    body: html.HtmlLayoutBody | (() => html.HtmlLayoutBody),
    supplier: html.HtmlLayoutStrategySupplier<Layout>,
    ...args: unknown[]
  ): Layout;

  frontmatterLayoutStrategy(
    layoutArgs: DesignSystemLayoutArgumentsSupplier,
    fmPropertyName: string,
  ):
    | govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier>
    | undefined {
    const strategyName = typeof layoutArgs.layout == "string"
      ? layoutArgs.layout
      : layoutArgs.layout.identity;
    if (!strategyName) return undefined;
    if (typeof strategyName === "string") {
      const layoutStrategy = strategyName
        ? this.layoutStrategies.layoutStrategy(strategyName)
        : undefined;
      if (layoutStrategy) {
        const named:
          & govn.NamedLayoutStrategySupplier<Layout, govn.HtmlSupplier>
          & govn.FrontmatterLayoutStrategySupplier<Layout, govn.HtmlSupplier> =
            {
              layoutStrategy,
              isNamedLayoutStrategyStrategySupplier: true,
              isInferredLayoutStrategySupplier: true,
              isFrontmatterLayoutStrategy: true,
              layoutStrategyIdentity: strategyName,
              frontmatterLayoutStrategyPropertyName: fmPropertyName,
            };
        return named;
      }
    }
  }

  modelLayoutStrategy(diagnostic: string, strategyName?: unknown):
    | govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier>
    | undefined {
    if (!strategyName) return undefined;
    if (typeof strategyName === "string") {
      const layoutStrategy = strategyName
        ? this.layoutStrategies.layoutStrategy(strategyName)
        : undefined;
      if (layoutStrategy) {
        const named:
          & govn.NamedLayoutStrategySupplier<Layout, govn.HtmlSupplier>
          & govn.ModelLayoutStrategySupplier<Layout, govn.HtmlSupplier> = {
            layoutStrategy,
            isNamedLayoutStrategyStrategySupplier: true,
            isInferredLayoutStrategySupplier: true,
            isModelLayoutStrategy: true,
            layoutStrategyIdentity: strategyName,
            modelLayoutStrategyDiagnostic: diagnostic,
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
  ): govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier> {
    const sourceMap = `(${import.meta.url}::inferredLayoutStrategy)`;
    if (fm.isFrontmatterSupplier(s)) {
      if (isDesignSystemLayoutArgumentsSupplier(s.frontmatter)) {
        const layout = this.frontmatterLayoutStrategy(s.frontmatter, "layout");
        if (layout) return layout;
        return this.layoutStrategies.diagnosticLayoutStrategy(
          `frontmatter 'layout' not found ${sourceMap}`,
        );
      }
      if (isFlexibleMutatedDesignSystemArgumentsSupplier(s.frontmatter)) {
        const layout = this.frontmatterLayoutStrategy(
          s.frontmatter.designSystem,
          "design-system.layout",
        );
        if (layout) return layout;
        return this.layoutStrategies.diagnosticLayoutStrategy(
          `frontmatter 'design-system.layout' not found ${sourceMap}`,
        );
      }
      return this.layoutStrategies.diagnosticLayoutStrategy(
        `frontmatter 'layout' or 'designSystem.layout' property not available, using default ${sourceMap}`,
      );
    }
    return this.layoutStrategies.diagnosticLayoutStrategy(
      `neither frontmatter nor model available, using default ${sourceMap}`,
    );
  }

  frontmatterLayoutArgs(
    utfm?: govn.UntypedFrontmatter,
  ): html.HtmlLayoutArguments | undefined {
    if (isDesignSystemLayoutArgumentsSupplier(utfm)) {
      return typeof utfm.layout === "string" ? undefined : utfm.layout;
    }
    if (isFlexibleMutatedDesignSystemArgumentsSupplier(utfm)) {
      return typeof utfm.designSystem.layout === "string"
        ? undefined
        : utfm.designSystem.layout;
    }
  }

  contributions(): html.HtmlLayoutContributions {
    return {
      scripts: contrib.contributions("<!-- scripts contrib -->"),
      stylesheets: contrib.contributions("<!-- stylesheets contrib -->"),
      head: contrib.contributions("<!-- head contrib -->"),
      body: contrib.contributions("<!-- body contrib -->"),
      diagnostics: contrib.contributions("<!-- diagnostics contrib -->"),
    };
  }
}
