import * as safety from "../../../lib/safety/mod.ts";
import * as git from "../../../lib/git/mod.ts";
import * as ws from "../../../lib/workspace/mod.ts";
import * as govn from "../../../governance/mod.ts";
import * as fm from "../../std/frontmatter.ts";
import * as html from "../../render/html/mod.ts";
import * as contrib from "../contributions.ts";
import * as m from "../../../core/std/model.ts";
import * as r from "../../../core/std/resource.ts";
import * as route from "../../../core/std/route.ts";
import * as render from "../../../core/std/render.ts";
import * as nature from "../../../core/std/nature.ts";
import * as persist from "../../../core/std/persist.ts";
import * as rtree from "../../../core/std/route-tree.ts";
import * as notif from "../../../lib/notification/mod.ts";
import * as k from "../../../lib/knowledge/mod.ts";

export const indexUnitName = "index";

export interface MutableNavigationTreeIndexNode {
  isIndexNode: boolean;
}

export const isMutableNavigationTreeIndexNode = safety.typeGuard<
  MutableNavigationTreeIndexNode
>();

export type NavigationTreeIndexNode = Readonly<MutableNavigationTreeIndexNode>;

export const isNavigationTreeIndexNode = safety.typeGuard<
  NavigationTreeIndexNode
>();

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

export function designSystemTemplate(
  identity: string,
  location: govn.LocationSupplier,
) {
  return html.htmlLayoutTemplate<
    html.HelperFunctionOrString<html.HtmlLayout>,
    html.HtmlLayout
  >(identity, location);
}

export const typicalDesignSystemBodyPartial: html.HtmlPartial<html.HtmlLayout> =
  (_, body) => body || "<!-- no design system body -->";

export const designSystemNoDecorationPage = designSystemTemplate(
  "ds/page/no-decoration",
  { moduleImportMetaURL: import.meta.url },
)`${typicalDesignSystemBodyPartial}`;

export function layoutFrontmatter(
  layout: DesignSystemLayoutArgumentsSupplier,
):
  & govn.UntypedFrontmatter
  & DesignSystemLayoutArgumentsSupplier {
  return layout as
    & govn.UntypedFrontmatter
    & DesignSystemLayoutArgumentsSupplier;
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
    this.layouts.set(
      designSystemNoDecorationPage.identity,
      designSystemNoDecorationPage,
    );
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

export type DesignSystemAssetURL = string;

export interface DesignSystemAssetLocationSupplier {
  (relURL: DesignSystemAssetURL): DesignSystemAssetURL;
}

export interface DesignSystemAssetLocations
  extends html.HtmlLayoutClientCargoValueSupplier {
  readonly dsImage: DesignSystemAssetLocationSupplier; // design system
  readonly dsScript: DesignSystemAssetLocationSupplier; // design system
  readonly dsStylesheet: DesignSystemAssetLocationSupplier; // design system
  readonly dsComponent: DesignSystemAssetLocationSupplier; // design system
  readonly uImage: DesignSystemAssetLocationSupplier; // universal design system
  readonly uScript: DesignSystemAssetLocationSupplier; // universal design system
  readonly uStylesheet: DesignSystemAssetLocationSupplier; // universal design system
  readonly uComponent: DesignSystemAssetLocationSupplier; // universal design system
  readonly image: DesignSystemAssetLocationSupplier; // local site
  readonly favIcon: DesignSystemAssetLocationSupplier; // local site
  readonly script: DesignSystemAssetLocationSupplier; // local site
  readonly stylesheet: DesignSystemAssetLocationSupplier; // local site
  readonly component: DesignSystemAssetLocationSupplier; // local site
  readonly brandImage: DesignSystemAssetLocationSupplier; // white label ("brandable")
  readonly brandScript: DesignSystemAssetLocationSupplier; // white label ("brandable")
  readonly brandStylesheet: DesignSystemAssetLocationSupplier; // white label ("brandable")
  readonly brandComponent: DesignSystemAssetLocationSupplier; // white label ("brandable")
  readonly brandFavIcon: DesignSystemAssetLocationSupplier; // white label ("brandable")
}

// deno-lint-ignore no-empty-interface
export interface DesignSystemNotification extends notif.Notification {
}

// deno-lint-ignore no-empty-interface
export interface DesignSystemNotifications<T extends DesignSystemNotification>
  extends notif.Notifications<T> {
}

export interface DesignSystemNavigationStrategy<
  Layout extends html.HtmlLayout,
> extends govn.RouteTreeSupplier, html.HtmlLayoutClientCargoValueSupplier {
  readonly home: govn.RouteLocation;
  readonly contentTree: (
    layout: Layout,
  ) => govn.RouteTreeNode | undefined;
  readonly location: (unit: govn.RouteNode) => govn.RouteLocation;
  readonly redirectUrl: (
    rs: govn.RedirectSupplier,
  ) => govn.RouteLocation | undefined;
  readonly notifications: <Notification extends DesignSystemNotification>(
    unit: govn.RouteTreeNode,
  ) => DesignSystemNotifications<Notification> | undefined;
  readonly descendantsNotifications: <
    Notification extends DesignSystemNotification,
  >(
    unit: govn.RouteTreeNode,
  ) => DesignSystemNotifications<Notification> | undefined;
}

export interface DesignSystemLintDiagnostic<Layout extends html.HtmlLayout>
  extends govn.LintDiagnostic {
  readonly layout: Layout;
}

export const isDesignSystemLintDiagnostic = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  DesignSystemLintDiagnostic<any>
>("rule", "layout");

export interface DesignSystemLintReporter<Layout extends html.HtmlLayout>
  extends govn.LintReporter<DesignSystemLintDiagnostic<Layout>> {
  readonly diagnostic: (
    rule: govn.LintRule,
    layout: Layout,
  ) => DesignSystemLintDiagnostic<Layout>;
  readonly diagsShouldBeTemporary: govn.LintRule;
}

export interface DesignSystemLayoutContribsInitializer<
  Layout extends html.HtmlLayout,
> {
  (layout: Omit<Layout, "contributions">): html.HtmlLayoutContributions;
}

export interface DesignSystemContentStrategy<
  Layout extends html.HtmlLayout,
  LayoutText extends html.HtmlLayoutText<Layout>,
  AssetLocations extends DesignSystemAssetLocations,
  Navigation extends DesignSystemNavigationStrategy<Layout>,
  OperationalCtxClientCargo = unknown,
> {
  readonly git?: git.GitExecutive;
  readonly mGitResolvers?: git.ManagedGitResolvers<string>;
  readonly routeGitRemoteResolver?: govn.RouteGitRemoteResolver<
    html.GitRemoteAnchor
  >;
  readonly wsEditorResolver?: ws.WorkspaceEditorTargetResolver<
    ws.WorkspaceEditorTarget
  >;
  readonly wsEditorRouteResolver?: govn.RouteWorkspaceEditorResolver<
    ws.WorkspaceEditorTarget
  >;
  readonly layoutText: LayoutText;
  readonly assets: AssetLocations;
  readonly navigation: Navigation;
  readonly termsManager?: k.TermsManager;
  readonly renderedAt: Date;
  readonly lintReporter?: DesignSystemLintReporter<Layout>;
  readonly initContributions?: DesignSystemLayoutContribsInitializer<Layout>;
  readonly operationalCtxClientCargo: OperationalCtxClientCargo;
}

export type UntypedDesignSystemContentStrategy = DesignSystemContentStrategy<
  // deno-lint-ignore no-explicit-any
  any,
  // deno-lint-ignore no-explicit-any
  any,
  // deno-lint-ignore no-explicit-any
  any,
  // deno-lint-ignore no-explicit-any
  any
>;

export interface DesignSystemFactory<
  Layout extends html.HtmlLayout,
  LayoutText extends html.HtmlLayoutText<Layout>,
  AssetLocations extends DesignSystemAssetLocations,
  Navigation extends DesignSystemNavigationStrategy<Layout>,
> {
  readonly designSystem: html.DesignSystem<Layout>;
  readonly contentStrategy: html.DesignSystemContentStrategy<
    Layout,
    LayoutText,
    AssetLocations,
    Navigation
  >;
}

export class DesignSystemNavigation<Layout extends html.HtmlLayout>
  implements html.DesignSystemNavigationStrategy<Layout> {
  constructor(
    readonly prettyURLs: boolean,
    readonly routeTree: rtree.TypicalRouteTree,
    readonly home = "/", // TODO: adjust for base location etc.
  ) {
  }

  contentTree(layout: Layout): govn.RouteTreeNode | undefined {
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

  notifications<
    Notifications extends DesignSystemNotifications<DesignSystemNotification>,
  >(
    node: govn.RouteTreeNode,
  ): Notifications | undefined {
    if (notif.isNotificationsSupplier(node)) {
      return node.notifications as Notifications;
    }
  }

  descendantsNotifications<Notification extends DesignSystemNotification>(
    node: govn.RouteTreeNode,
  ): DesignSystemNotifications<Notification> | undefined {
    const notifications = (parentRTN: govn.RouteTreeNode) => {
      const accumulate: Notification[] = [];
      parentRTN.walk((rtn) => {
        if (notif.isNotificationsSupplier<Notification>(rtn)) {
          for (const lnn of rtn.notifications.collection) {
            let found = false;
            for (const lnnA of accumulate) {
              if (lnnA.identity == lnn.identity) {
                lnnA.count(lnnA.count() + lnn.count());
                found = true;
                break;
              }
            }
            if (!found) {
              let count = lnn.count();
              accumulate.push({
                ...lnn,
                count: (set) => (set ? (count = set) : count),
              });
            }
          }
        }
        return true;
      });
      if (notif.isNotificationsSupplier<Notification>(parentRTN)) {
        for (const lnn of parentRTN.notifications.collection) {
          let found = false;
          for (const lnnA of accumulate) {
            if (lnnA.identity == lnn.identity) {
              lnnA.count(lnnA.count() + lnn.count());
              found = true;
              break;
            }
          }
          if (!found) {
            let count = lnn.count();
            accumulate.push({
              ...lnn,
              count: (set) => (set ? (count = set) : count),
            });
          }
        }
      }
      return accumulate;
    };

    const collection = notifications(node);
    if (collection.length > 0) {
      return { collection } as DesignSystemNotifications<Notification>;
    }
    return undefined;
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

// deno-lint-ignore no-explicit-any
export type DesignSystemDirective = govn.DirectiveExpectation<any, any>;

export abstract class DesignSystem<Layout extends html.HtmlLayout>
  implements
    govn.RenderStrategy<Layout, govn.HtmlSupplier>,
    govn.DirectiveExpectationsSupplier<DesignSystemDirective> {
  readonly prettyUrlIndexUnitName = "index";
  constructor(
    readonly identity: govn.RenderStrategyIdentity,
    readonly location: govn.LocationSupplier,
    readonly layoutStrategies: DesignSystemLayouts<Layout>,
    readonly dsAssetsBaseURL: string,
    readonly universalAssetsBaseURL: string,
  ) {
  }

  abstract layout(
    body: html.HtmlLayoutBody | (() => html.HtmlLayoutBody),
    supplier: html.HtmlLayoutStrategySupplier<Layout>,
    contentStrategy: UntypedDesignSystemContentStrategy,
    ...args: unknown[]
  ): Layout;

  abstract allowedDirectives(
    filter?: (DE: DesignSystemDirective) => boolean,
  ): DesignSystemDirective[];

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

  /**
   * Server-side and client-side access to asset locators. For image, favIcon,
   * script, and stylesheet that is app-specific (meaning managed outside of
   * the design-system) those locations are relative to base. For design system
   * specific dsImage, dsScript, dsComponent, etc. they are relative to the
   * design system's chosen conventions.
   * @param base base URL for non-design-system-specific URLs
   * @param inherit any settings to inherit
   * @returns functions which will locate assets on server and client
   */
  assets(
    base = "", // should NOT be terminated by / since assets will be prefixed by /
    inherit?: Partial<html.DesignSystemAssetLocations>,
  ): html.DesignSystemAssetLocations {
    // these must match, precisely, what is in design system Javascript rfLayout()
    return {
      dsImage: (relURL) => `${this.dsAssetsBaseURL}/image${relURL}`,
      dsScript: (relURL) => `${this.dsAssetsBaseURL}/script${relURL}`,
      dsStylesheet: (relURL) => `${this.dsAssetsBaseURL}/style${relURL}`,
      dsComponent: (relURL) => `${this.dsAssetsBaseURL}/component${relURL}`,
      uImage: (relURL) => `${this.universalAssetsBaseURL}/image${relURL}`,
      uScript: (relURL) => `${this.universalAssetsBaseURL}/script${relURL}`,
      uStylesheet: (relURL) => `${this.universalAssetsBaseURL}/style${relURL}`,
      uComponent: (relURL) =>
        `${this.universalAssetsBaseURL}/component${relURL}`,
      image: (relURL) => `${base}${relURL}`,
      favIcon: (relURL) => `${base}${relURL}`,
      script: (relURL) => `${base}${relURL}`,
      stylesheet: (relURL) => `${base}${relURL}`,
      component: (relURL) => `${base}${relURL}`,
      brandImage: (relURL) => `${base}/brand${relURL}`,
      brandFavIcon: (relURL) => `${base}/brand${relURL}`,
      brandScript: (relURL) => `${base}/brand${relURL}`,
      brandStylesheet: (relURL) => `${base}/brand${relURL}`,
      brandComponent: (relURL) => `${base}/brand${relURL}`,
      ...inherit,
    };
  }

  pageRenderer(
    contentStrategy: UntypedDesignSystemContentStrategy,
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
        contentStrategy,
      ));
    };
  }

  pageRendererSync(
    contentStrategy: UntypedDesignSystemContentStrategy,
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
        contentStrategy,
      ));
    };
  }

  prettyUrlsHtmlProducer(
    destRootPath: string,
    contentStrategy: UntypedDesignSystemContentStrategy,
    options?: {
      readonly fspEE?: govn.FileSysPersistEventsEmitterSupplier;
      readonly memoize?: (
        resource: govn.HtmlSupplier,
        producer: (replay: govn.HtmlSupplier) => Promise<govn.HtmlSupplier>,
      ) => Promise<void>;
    },
  ): govn.ResourceRefinery<govn.HtmlSupplier> {
    const producer = r.pipelineUnitsRefineryUntyped(
      this.pageRenderer(contentStrategy),
      nature.htmlContentNature.persistFileSysRefinery(
        destRootPath,
        persist.routePersistPrettyUrlHtmlNamingStrategy((ru) =>
          ru.unit === this.prettyUrlIndexUnitName
        ),
        options?.fspEE,
      ),
    );

    return async (resource) => {
      if (
        render.isRenderableMediaTypeResource(
          resource,
          nature.htmlMediaTypeNature.mediaType,
        )
      ) {
        if (options?.memoize) {
          options?.memoize(resource, async (replay) => {
            return await producer(replay);
          });
        }
        return await producer(resource);
      }
      // we cannot handle this type of rendering target, no change to resource
      return resource;
    };
  }
}
