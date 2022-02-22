import * as govn from "../../../governance/mod.ts";
import * as html from "../../render/html/mod.ts";
import * as direc from "../../render/markdown/directive/mod.ts";
import * as c from "../../../core/std/content.ts";
import * as m from "../../../core/std/model.ts";
import * as fm from "../../../core/std/frontmatter.ts";
import * as ldsGovn from "./governance.ts";
import * as l from "./layout/mod.ts";
import * as ldsDirec from "./directive/mod.ts";
import * as route from "../../../core/std/route.ts";

export class LightingDesignSystemLayouts<
  Layout extends ldsGovn.LightningLayout,
> extends html.DesignSystemLayouts<Layout> {
  constructor() {
    super({ layoutStrategy: l.defaultPage });
    l.autoRegisterPages.forEach((l) => this.layouts.set(l.identity, l));
  }
}

export class LightingDesignSystemNavigation
  extends html.DesignSystemNavigation<ldsGovn.LightningLayout>
  implements ldsGovn.LightningNavigation {
  contextBarItems(_layout: ldsGovn.LightningLayout): govn.RouteNode[] {
    return this.routeTree.items.length > 0 ? this.routeTree.items : [];
  }
}

export class LightingDesignSystemText implements ldsGovn.LightningLayoutText {
  /**
   * Supply the <title> tag text from a inheritable set of model suppliers.
   * @param layout the active layout where the title will be rendered
   * @returns title text from first model found or from the frontmatter.title or the terminal route unit
   */
  title(layout: ldsGovn.LightningLayout) {
    const fmTitle = layout.frontmatter?.title;
    if (fmTitle) return String(fmTitle);
    const title: () => string = () => {
      if (layout.activeRoute?.terminal) {
        return layout.activeRoute?.terminal.label;
      }
      return "(no frontmatter, terminal route, or model title)";
    };
    const model = m.model<{ readonly title: string }>(
      () => {
        return { title: title() };
      },
      layout.activeTreeNode,
      layout.activeRoute,
      layout.bodySource,
    );
    return model.title || title();
  }
}

const defaultContentModel: () => govn.ContentModel = () => {
  return { isContentModel: true, isContentAvailable: false };
};

export class LightingDesignSystem<Layout extends ldsGovn.LightningLayout>
  extends html.DesignSystem<Layout> {
  readonly lightningAssetsPathUnits = ["lightning"];
  // deno-lint-ignore no-explicit-any
  readonly directives: govn.DirectiveExpectation<any, any>[] = [
    new ldsDirec.ActionItemDirective(),
    ...direc.allCustomElements,
  ];
  constructor(
    readonly extnManager: govn.ExtensionsManager,
    readonly universalAssetsBaseURL: string,
    readonly operationalCtxBaseURL: string,
    readonly emptyContentModelLayoutSS:
      & govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier>
      & govn.ModelLayoutStrategySupplier<Layout, govn.HtmlSupplier> = {
        layoutStrategy: l.innerIndexAutoPage,
        isInferredLayoutStrategySupplier: true,
        isModelLayoutStrategy: true,
        modelLayoutStrategyDiagnostic: "no content available",
      },
  ) {
    super(
      "LightningDS",
      new LightingDesignSystemLayouts(),
      "/lightning",
      universalAssetsBaseURL,
      operationalCtxBaseURL,
    );
    this.directives.push(
      new direc.ProxiedContentInfuseInterpolateDirective(this.extnManager),
    );
  }

  allowedDirectives(filter?: (DE: html.DesignSystemDirective) => boolean) {
    return filter ? this.directives.filter(filter) : this.directives;
  }

  assets(
    base = "", // should NOT be terminated by / since assets will be prefixed by /
    inherit?: Partial<html.DesignSystemAssetLocations>,
  ): ldsGovn.LightningAssetLocations {
    const dsAssets = super.assets(base, inherit);
    const ldsAssets: ldsGovn.LightningAssetLocations = {
      ...dsAssets,
      ldsIcons: (relURL) => `${this.dsAssetsBaseURL}/image/slds-icons${relURL}`,
      clientCargoValue: () => {
        return `{
          ${
          this.clientCargoAssetsJS(
            base,
            `ldsIcons(relURL) { return \`\${this.assetsBaseAbsURL()}${this.dsAssetsBaseURL}/image/slds-icons\${relURL}\`; }`,
          ).join(",\n          ")
        }
        }`;
      },
    };
    return ldsAssets;
  }

  inferredLayoutStrategy(
    s: Partial<
      | govn.FrontmatterSupplier<govn.UntypedFrontmatter>
      | govn.ModelSupplier<govn.UntypedModel>
    >,
  ): govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier> {
    if (c.isContentModelSupplier(s) && !s.model.isContentAvailable) {
      return this.emptyContentModelLayoutSS;
    }
    return super.inferredLayoutStrategy(s);
  }

  layout(
    body: html.HtmlLayoutBody | (() => html.HtmlLayoutBody),
    layoutSS: html.HtmlLayoutStrategySupplier<Layout>,
    contentStrategy: ldsGovn.LightingDesignSystemContentStrategy,
  ): Layout {
    const bodySource = typeof body === "function" ? body() : body;
    const frontmatter = fm.isFrontmatterSupplier(bodySource)
      ? bodySource.frontmatter
      : undefined;
    const layoutArgs = this.frontmatterLayoutArgs(frontmatter);
    const activeRoute = route.isRouteSupplier(bodySource)
      ? bodySource.route
      : undefined;
    const activeTreeNode = activeRoute?.terminal
      ? contentStrategy.navigation.routeTree.node(
        activeRoute?.terminal.qualifiedPath,
      )
      : undefined;
    const model = c.contentModel(
      defaultContentModel,
      activeTreeNode,
      activeRoute,
      bodySource,
    );
    const result: ldsGovn.LightningLayout = {
      contentStrategy,
      bodySource,
      model,
      layoutText: contentStrategy.layoutText,
      designSystem: this,
      layoutSS,
      frontmatter,
      activeRoute,
      activeTreeNode,
      contributions: contentStrategy.initContributions
        ? contentStrategy.initContributions({
          contentStrategy,
          bodySource,
          model,
          layoutText: contentStrategy.layoutText,
          designSystem: this,
          layoutSS,
          frontmatter,
          activeRoute,
          activeTreeNode,
          clientCargoPropertyName: "clientLayout",
          clientLifecycleEventEmitterSingletonIdentity: "rfUserAgentLifecycle",
          origin: html.htmlLayoutOriginDataAttrs,
          ...layoutArgs,
        })
        : this.contributions(),
      clientCargoPropertyName: "clientLayout",
      clientLifecycleEventEmitterSingletonIdentity: "rfUserAgentLifecycle",
      origin: html.htmlLayoutOriginDataAttrs,
      ...layoutArgs,
    };
    if (contentStrategy.lintReporter && layoutArgs?.diagnostics) {
      (result as unknown as govn.Lintable).lint = (reporter) => {
        reporter.report(
          contentStrategy.lintReporter!.diagnostic(
            contentStrategy.lintReporter!.diagsShouldBeTemporary,
            result,
          ),
        );
      };
    }
    return result as Layout; // TODO: consider not casting to type
  }
}
