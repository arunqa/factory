import { fs, path, safety } from "../../deps.ts";
import * as govn from "../../../governance/mod.ts";
import * as html from "../../render/html/mod.ts";
import * as c from "../../../core/std/content.ts";
import * as r from "../../../core/std/resource.ts";
import * as m from "../../../core/std/model.ts";
import * as fm from "../../../core/std/frontmatter.ts";
import * as ldsGovn from "./governance.ts";
import * as l from "./layout/mod.ts";
import * as route from "../../../core/std/route.ts";
import * as rtree from "../../../core/std/route-tree.ts";
import * as render from "../../../core/std/render.ts";
import * as nature from "../../../core/std/nature.ts";
import * as persist from "../../../core/std/persist.ts";

export class LightingDesignSystemLayouts<
  Layout extends ldsGovn.LightningLayout,
> extends html.DesignSystemLayouts<Layout> {
  constructor() {
    super({ layoutStrategy: l.defaultPage });
    l.autoRegisterPages.forEach((l) => this.layouts.set(l.identity, l));
  }
}

export const isLightningNavigationNotificationSupplier = safety.typeGuard<
  ldsGovn.LightningNavigationNotificationSupplier
>("ldsNavNotification");

export class LightingDesignSystemNavigation
  implements ldsGovn.LightningNavigation {
  constructor(
    readonly prettyURLs: boolean,
    readonly routeTree: rtree.TypicalRouteTree,
    readonly home = "/", // TODO: adjust for base location etc.
  ) {
  }

  contextBarItems(_layout: ldsGovn.LightningLayout): govn.RouteNode[] {
    return this.routeTree.items.length > 0 ? this.routeTree.items : [];
  }

  contentTree(layout: ldsGovn.LightningLayout): govn.RouteTreeNode | undefined {
    return layout.activeTreeNode?.parent;
  }

  location(unit: govn.RouteNode): string {
    if (this.prettyURLs) {
      const loc = unit.qualifiedPath === "/index" ? "/" : unit.location();
      return loc.endsWith("/index")
        ? loc.endsWith("/") ? `${loc}..` : `${loc}/..`
        : (loc.endsWith("/") ? loc : `${loc}/`);
    }
    return unit.qualifiedPath === "/index" ? "/" : unit.location();
  }

  redirectUrl(
    rs: govn.RedirectSupplier,
  ): govn.RouteLocation | undefined {
    return route.isRedirectUrlSupplier(rs)
      ? rs.redirect
      : this.location(rs.redirect);
  }

  notification(
    node: govn.RouteTreeNode,
  ): ldsGovn.LightningNavigationNotification | undefined {
    if (isLightningNavigationNotificationSupplier(node.route)) {
      return node.route.ldsNavNotification;
    }
  }

  clientCargoValue(_layout: html.HtmlLayout) {
    let locationJsFn = "";
    if (this.prettyURLs) {
      locationJsFn = `{
          const loc = unit.qualifiedPath === "/index" ? "/" : unit.location();
          return loc.endsWith("/index")
            ? loc.endsWith("/") ? \`\${loc}..\` : \`\${loc}/..\`
            : (loc.endsWith("/") ? loc : \`\${loc}/\`);
        }`;
    } else {
      locationJsFn = `unit.qualifiedPath === "/index" ? "/" : unit.location()`;
    }
    return `{
      location: (unit) => ${locationJsFn}
    }`;
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
  readonly lightningAssetsBaseURL = "/lightning";
  readonly lightningAssetsPathUnits = ["lightning"];
  constructor(
    readonly emptyContentModelLayoutSS:
      & govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier>
      & govn.ModelLayoutStrategySupplier<Layout, govn.HtmlSupplier> = {
        layoutStrategy: l.innerIndexAutoPage,
        isInferredLayoutStrategySupplier: true,
        isModelLayoutStrategy: true,
        modelLayoutStrategyDiagnostic: "no content available",
      },
  ) {
    super("LightningDS", new LightingDesignSystemLayouts());
  }

  /**
   * All images, stylesheets, scripts, and other "assets" will be symlink'd
   * so that they can be available in the published artifacts but can easily
   * be modified during development using any local web server without any
   * special "development server".
   * @param destRootPath where to place the assets on the file system
   */
  async symlinkAssets(destRootPath: string) {
    const dsPath = path.dirname(import.meta.url).substr("file://".length);
    for (const entry of ["images", "styles", "scripts"]) {
      await fs.ensureSymlink(
        path.join(dsPath, entry),
        path.join(destRootPath, ...this.lightningAssetsPathUnits, entry),
      );
    }
  }

  assets(
    base = "", // should NOT be terminated by / since assets will be prefixed by /
    inherit?: Partial<ldsGovn.AssetLocations>,
  ): ldsGovn.AssetLocations {
    return {
      ldsIcons: (relURL) =>
        `${this.lightningAssetsBaseURL}/images/slds-icons${relURL}`,
      dsImage: (relURL) => `${this.lightningAssetsBaseURL}/images${relURL}`,
      dsScript: (relURL) => `${this.lightningAssetsBaseURL}/scripts${relURL}`,
      dsStylesheet: (relURL) =>
        `${this.lightningAssetsBaseURL}/styles${relURL}`,
      image: (relURL) => `${base}${relURL}`,
      favIcon: (relURL) => `${base}/favicons${relURL}`,
      script: (relURL) => `${base}${relURL}`,
      stylesheet: (relURL) => `${base}${relURL}`,
      brandImage: (relURL) => `${base}/brand${relURL}`,
      brandFavIcon: (relURL) => `${base}/brand/favicons${relURL}`,
      brandScript: (relURL) => `${base}/brand${relURL}`,
      brandStylesheet: (relURL) => `${base}/brand${relURL}`,
      clientCargoValue: () => {
        return `{
          assetsBaseAbsURL() { return "${base}" },
          ldsIcons(relURL) { return \`\${this.assetsBaseAbsURL()}${this.lightningAssetsBaseURL}/images/slds-icons\${relURL}\`; },
          dsImage(relURL) { return \`\${this.assetsBaseAbsURL()}${this.lightningAssetsBaseURL}/images\${relURL}\`; },
          dsScript(relURL) { return  \`\${this.assetsBaseAbsURL()}${this.lightningAssetsBaseURL}/scripts\${relURL}\`; },
          dsStylesheet(relURL) { return \`\${this.assetsBaseAbsURL()}${this.lightningAssetsBaseURL}/styles\${relURL}\`; },
          image(relURL) { return \`\${this.assetsBaseAbsURL()}\${relURL}\`; },
          favIcon(relURL) { return \`\${this.assetsBaseAbsURL()}/favicon/\${relURL}\`; },
          script(relURL) { return \`\${this.assetsBaseAbsURL()}\${relURL}\`; },
          stylesheet(relURL) { return \`\${this.assetsBaseAbsURL()}\${relURL}\`; },
          brandImage(relURL) { return this.image(\`/brand/\${relURL}\`); },
          brandScript(relURL) { return this.script(\`/brand/\${relURL}\`); },
          brandStylesheet(relURL) { return this.stylesheet(\`/brand/\${relURL}\`); },
          brandFavIcon(relURL) { return this.favIcon(\`/brand/\${relURL}\`); },
        }`;
      },
      ...inherit,
    };
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
    dsArgs: ldsGovn.LightingDesignSystemArguments,
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
      ? dsArgs.navigation.routeTree.node(activeRoute?.terminal.qualifiedPath)
      : undefined;
    const model = c.contentModel(
      defaultContentModel,
      activeTreeNode,
      activeRoute,
      bodySource,
    );
    const result: ldsGovn.LightningLayout = {
      dsArgs,
      bodySource,
      model,
      layoutText: dsArgs.layoutText,
      designSystem: this,
      layoutSS,
      frontmatter,
      activeRoute,
      activeTreeNode,
      contributions: this.contributions(),
      clientCargoPropertyName: "clientLayout",
      ...layoutArgs,
    };
    return result as Layout; // TODO: consider not casting to type
  }

  pageRenderer(
    dsArgs: ldsGovn.LightingDesignSystemArguments,
    refine?: govn.ResourceRefinery<html.HtmlLayoutBody>,
  ): govn.ResourceRefinery<govn.HtmlSupplier> {
    return async (resource) => {
      const lss =
        fm.isFrontmatterSupplier(resource) || m.isModelSupplier(resource)
          ? this.inferredLayoutStrategy(resource)
          : this.layoutStrategies.diagnosticLayoutStrategy(
            "Neither frontmatter nor model supplied to LightingDesignSystem.pageRenderer",
          );
      return await lss.layoutStrategy.rendered(this.layout(
        refine ? await refine(resource) : resource,
        lss,
        dsArgs,
      ));
    };
  }

  pageRendererSync(
    dsArgs: ldsGovn.LightingDesignSystemArguments,
    refine?: govn.ResourceRefinerySync<html.HtmlLayoutBody>,
  ): govn.ResourceRefinerySync<govn.HtmlSupplier> {
    return (resource) => {
      const lss =
        fm.isFrontmatterSupplier(resource) || m.isModelSupplier(resource)
          ? this.inferredLayoutStrategy(resource)
          : this.layoutStrategies.diagnosticLayoutStrategy(
            "Neither frontmatter nor model supplied to LightingDesignSystem.pageRendererSync",
          );
      return lss.layoutStrategy.renderedSync(this.layout(
        refine ? refine(resource) : resource,
        lss,
        dsArgs,
      ));
    };
  }

  prettyUrlsHtmlProducer(
    destRootPath: string,
    dsArgs: ldsGovn.LightingDesignSystemArguments,
  ): govn.ResourceRefinery<govn.HtmlSupplier> {
    const producer = r.pipelineUnitsRefineryUntyped(
      this.pageRenderer(dsArgs),
      nature.htmlContentNature.persistFileSysRefinery(
        destRootPath,
        persist.routePersistPrettyUrlHtmlNamingStrategy((ru) =>
          ru.unit === ldsGovn.indexUnitName
        ),
      ),
    );

    return async (resource) => {
      if (
        render.isRenderableMediaTypeResource(
          resource,
          nature.htmlMediaTypeNature.mediaType,
        )
      ) {
        return await producer(resource);
      }
      // we cannot handle this type of rendering target, no change to resource
      return resource;
    };
  }
}
