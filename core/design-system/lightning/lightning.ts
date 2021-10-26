import { safety } from "../../deps.ts";
import * as govn from "../../../governance/mod.ts";
import * as html from "../../render/html/mod.ts";
import * as c from "../../../core/std/content.ts";
import * as m from "../../../core/std/model.ts";
import * as fm from "../../../core/std/frontmatter.ts";
import * as ldsGovn from "./governance.ts";
import * as l from "./layout/mod.ts";
import * as direc from "./directive/mod.ts";
import * as route from "../../../core/std/route.ts";
import * as rtree from "../../../core/std/route-tree.ts";

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
>("ldsNavNotifications");

/**
 * See if source is already a LightningNavigationNotificationSupplier and, if
 * it is, return source.ldsNavNotifications. If it's not already a supplier,
 * mutate source into a supplier by giving it an empty collection and returning
 * it.
 * @param source the instance to check
 * @param notFound the return value of this function will be assigned if source is not already a LightningNavigationNotificationSupplier
 * @param found the return value of this function will be assigned if source is already a LightningNavigationNotificationSupplier
 * @returns value of either found or notFound
 */
export function prepareNotifications(
  source: unknown,
  notFound: () => ldsGovn.LightningNavigationNotifications,
  found?: ((
    lnn: ldsGovn.LightningNavigationNotifications,
  ) => ldsGovn.LightningNavigationNotifications),
  assignmentFailed?: (diagnostic: string) => void,
): ldsGovn.LightningNavigationNotifications {
  const result = isLightningNavigationNotificationSupplier(source)
    ? (found ? found(source.ldsNavNotifications) : source.ldsNavNotifications)
    : // deno-lint-ignore no-explicit-any
      ((source as any).ldsNavNotifications = notFound());
  if (assignmentFailed && !isLightningNavigationNotificationSupplier(source)) {
    assignmentFailed(
      "isLightningNavigationNotificationSupplier(source) is false in lds.prepareNotifications. This should never happen.",
    );
  }
  return result;
}

/**
 * Add notification to dest if it doesn't exist or increment count if it does
 * @param dest the instance to mutate
 * @param notification the notification to add
 * @returns dest
 */
export function mergeNotifications(
  notification: ldsGovn.LightningNavigationNotification,
  dest: ldsGovn.LightningNavigationNotifications,
): ldsGovn.LightningNavigationNotifications {
  const existing = dest.collection.find((n) =>
    n.identity == notification.identity
  );
  if (existing) {
    existing.count(existing.count() + notification.count());
  } else {
    dest.collection.push(notification);
  }
  return dest;
}
/**
 * See if dest is already a LightningNavigationNotificationSupplier and, if
 * it is, add source.ldsNavNotifications collection items to it. If it's not
 * already a supplier, mutate dest into a supplier by giving it the source.
 * @param source the notifications to assign
 * @param dest the instance to mutate and turn into a LightningNavigationNotificationSupplier
 * @returns dest as LightningNavigationNotificationSupplier
 */
export function referenceNotifications(
  source: ldsGovn.LightningNavigationNotificationSupplier,
  dest: unknown,
): ldsGovn.LightningNavigationNotificationSupplier {
  if (isLightningNavigationNotificationSupplier(dest)) {
    for (const lnn of source.ldsNavNotifications.collection) {
      mergeNotifications(lnn, dest.ldsNavNotifications);
    }
  } else {
    // deno-lint-ignore no-explicit-any
    (dest as any).ldsNavNotifications = source.ldsNavNotifications;
  }
  return dest as ldsGovn.LightningNavigationNotificationSupplier;
}

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

  notifications<Notifications extends html.DesignSystemNotifications>(
    node: govn.RouteTreeNode,
  ): Notifications | undefined {
    if (isLightningNavigationNotificationSupplier(node)) {
      return node.ldsNavNotifications as Notifications;
    }
  }

  descendantsNotifications<
    Notifications extends html.DesignSystemNotifications,
  >(
    node: govn.RouteTreeNode,
  ): Notifications | undefined {
    const notifications = (parentRTN: govn.RouteTreeNode) => {
      const accumulate: ldsGovn.LightningNavigationNotification[] = [];
      parentRTN.walk((rtn) => {
        if (isLightningNavigationNotificationSupplier(rtn)) {
          for (const lnn of rtn.ldsNavNotifications.collection) {
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
      if (isLightningNavigationNotificationSupplier(parentRTN)) {
        for (const lnn of parentRTN.ldsNavNotifications.collection) {
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
      return { collection } as Notifications;
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
  readonly directives = [
    new direc.ActionItemDirective(),
    ...direc.allCustomElements,
  ];
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
    super("LightningDS", new LightingDesignSystemLayouts(), "/lightning");
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
    dsCtx: ldsGovn.LightingDesignSystemContentAdapter,
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
      ? dsCtx.navigation.routeTree.node(activeRoute?.terminal.qualifiedPath)
      : undefined;
    const model = c.contentModel(
      defaultContentModel,
      activeTreeNode,
      activeRoute,
      bodySource,
    );
    const result: ldsGovn.LightningLayout = {
      dsCtx,
      bodySource,
      model,
      layoutText: dsCtx.layoutText,
      designSystem: this,
      layoutSS,
      frontmatter,
      activeRoute,
      activeTreeNode,
      contributions: this.contributions(),
      clientCargoPropertyName: "clientLayout",
      origin: html.htmlLayoutOriginDataAttrs,
      ...layoutArgs,
    };
    return result as Layout; // TODO: consider not casting to type
  }
}
