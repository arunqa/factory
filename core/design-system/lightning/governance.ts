import * as govn from "../../../governance/mod.ts";
import * as html from "../../render/html/mod.ts";
import * as l from "./layout/mod.ts";

export const indexUnitName = "index";

/**
 * Interface implemented by route tree nodes to add specific design system-
 * specific capabilities.
 */
export interface MutatableNavigationTreeNodeCapabilities {
  isContextBarRouteNode?: boolean;
  isIndexNode?: boolean;
}

export type NavigationTreeNodeCapabilities = Readonly<
  MutatableNavigationTreeNodeCapabilities
>;

/**
 * Used by Deno HTML modules as html: { text: LightningLayoutBodySupplier }
 */
export interface LightningLayoutBodySupplier {
  (layout: LightningLayout): string;
}

export interface LightningAssetLocations
  extends html.DesignSystemAssetLocations {
  readonly ldsIcons: html.DesignSystemAssetLocationSupplier; // specific to Lightning icons in SVG
}

export interface LightningNavigationNotification
  extends html.DesignSystemNotification {
  readonly icon?: l.IconIdentity;
}

// deno-lint-ignore no-empty-interface
export interface LightningNavigationNotifications
  extends html.DesignSystemNotifications<LightningNavigationNotification> {
}

export interface LightningNavigationNotificationSupplier {
  readonly ldsNavNotifications: LightningNavigationNotifications;
}

export interface LightningNavigation
  extends html.DesignSystemNavigation<LightningLayout> {
  readonly contextBarItems: (
    layout: LightningLayout,
  ) => govn.RouteNode[];
}

export interface LightningNavigationContext {
  readonly activeRoute?: govn.Route;
  readonly activeTreeNode?: govn.RouteTreeNode;
}

export type LightningContextBarSubject = string | [label: string, href: string];
export type LightningContextBarSubjectImageSrc = string | [
  src: string,
  href: string,
];

export interface LightningBranding {
  readonly contextBarSubject:
    | LightningContextBarSubject
    | ((
      lnc: LightningNavigationContext,
      assets: LightningAssetLocations,
    ) => LightningContextBarSubject);
  readonly contextBarSubjectImageSrc:
    | LightningContextBarSubjectImageSrc
    | ((
      assets: LightningAssetLocations,
      lnc: LightningNavigationContext,
    ) => LightningContextBarSubjectImageSrc);
}

// deno-lint-ignore no-empty-interface
export interface LightningLayoutText
  extends html.HtmlLayoutText<LightningLayout> {
}

export interface LightingDesignSystemContentAdapter
  extends
    html.DesignSystemContentAdapter<
      LightningLayout,
      LightningLayoutText,
      LightningAssetLocations,
      LightningNavigation
    > {
  readonly branding: LightningBranding;
}

export interface LightningLayout
  extends
    html.HtmlLayout<LightningLayoutText>,
    LightningNavigationContext,
    govn.ModelSupplier<govn.ContentModel> {
  readonly dsCtx: LightingDesignSystemContentAdapter;
}

// deno-lint-ignore no-empty-interface
export interface LightningLayoutStrategy<Layout extends LightningLayout>
  extends html.HtmlLayoutStrategy<Layout> {
}

export type LightningPartial = html.HtmlPartial<LightningLayout>;

// deno-lint-ignore no-empty-interface
export interface LightningTemplate extends
  html.TemplateLiteralHtmlLayout<
    html.HelperFunctionOrString<LightningLayout>,
    LightningLayout
  > {
}

// deno-lint-ignore no-empty-interface
export interface LightningDesignSystemFactory extends
  html.DesignSystemFactory<
    LightningLayout,
    LightningLayoutText,
    LightningAssetLocations,
    LightningNavigation
  > {
}
