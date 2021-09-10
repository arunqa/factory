import * as govn from "../../../governance/mod.ts";
import * as html from "../../render/html/mod.ts";
import * as contrib from "../contributions.ts";

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

  frontmatterPropertyLayoutStrategy(
    fmPropertyName: string,
    strategyName?: unknown,
  ):
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
          & govn.FrontmatterLayoutStrategySupplier<Layout, govn.HtmlSupplier> =
            {
              layoutStrategy,
              isNamedLayoutStrategyStrategySupplier: true,
              isFrontmatterLayoutStrategy: true,
              layoutStrategyIdentity: strategyName,
              frontmatterLayoutStrategyPropertyName: fmPropertyName,
            };
        return named;
      }
    }
  }

  frontmatterLayoutStrategy(
    fms: Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>>,
  ): govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier> {
    const sourceMap = `(${import.meta.url}::frontmatterLayoutStrategy)`;
    if (fms.frontmatter) {
      if ("layout" in fms.frontmatter) {
        const name = typeof fms.frontmatter.layout === "string"
          ? fms.frontmatter.layout
          : // deno-lint-ignore no-explicit-any
            (fms.frontmatter.layout as any)?.identity;
        const layout = this.frontmatterPropertyLayoutStrategy("layout", name);
        if (layout) return layout;
        return this.layoutStrategies.diagnosticLayoutStrategy(
          `frontmatter 'layout' property '${name}' not found ${sourceMap}`,
        );
      }
      if ("design-system" in fms.frontmatter) {
        const ds = fms.frontmatter["design-system"];
        if (ds && typeof ds === "object" && "layout" in ds) {
          // deno-lint-ignore no-explicit-any
          const identity = (ds as any).layout;
          const layout = this.frontmatterPropertyLayoutStrategy(
            "design-system.layout",
            identity,
          );
          if (layout) return layout;
          return this.layoutStrategies.diagnosticLayoutStrategy(
            `frontmatter 'designSystem.layout' property '${identity}' not found ${sourceMap}`,
          );
        }
      }
      return this.layoutStrategies.diagnosticLayoutStrategy(
        `frontmatter 'layout' or 'designSystem.layout' property not available, using default ${sourceMap}`,
      );
    }
    return this.layoutStrategies.diagnosticLayoutStrategy(
      `frontmatter not available, using default ${sourceMap}`,
    );
  }

  // Might consider [zod](https://denopkg.com/colinhacks/zod/deno/lib/mod.ts) for
  // safer parsing?
  frontmatterLayoutArgs(
    utfm?: govn.UntypedFrontmatter,
  ): html.HtmlLayoutArguments | undefined {
    let diagnostics: html.HtmlLayoutDiagnosticsRequest | undefined;
    let redirectConsoleToHTML: boolean | undefined;
    if (utfm && "layout" in utfm) {
      if (typeof utfm.layout === "object") {
        const layoutArgs = utfm.layout as Record<string, unknown>;
        if (
          layoutArgs.diagnostics &&
          (typeof layoutArgs.diagnostics === "boolean" ||
            typeof layoutArgs.diagnostics === "string")
        ) {
          // deno-lint-ignore no-explicit-any
          diagnostics = layoutArgs.diagnostics as any;
        }
        if (typeof layoutArgs.redirectConsoleToHTML === "boolean") {
          redirectConsoleToHTML = layoutArgs.redirectConsoleToHTML;
        }
      }
    }
    return {
      diagnostics,
      redirectConsoleToHTML,
    };
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
