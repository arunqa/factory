import * as govn from "../../../governance/mod.ts";
import * as html from "../../render/html/mod.ts";

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

export type AssetURL = string;

export interface AssetLocationSupplier {
  (relURL: AssetURL): AssetURL;
}

export interface AssetLocations
  extends html.HtmlLayoutClientCargoValueSupplier {
  readonly ldsIcons: AssetLocationSupplier; // specific to Lightning icons in SVG
  readonly dsImage: AssetLocationSupplier; // design system
  readonly dsScript: AssetLocationSupplier; // design system
  readonly dsStylesheet: AssetLocationSupplier; // design system
  readonly image: AssetLocationSupplier; // local site
  readonly favIcon: AssetLocationSupplier; // local site
  readonly script: AssetLocationSupplier; // local site
  readonly stylesheet: AssetLocationSupplier; // local site
  readonly brandImage: AssetLocationSupplier; // white label ("brandable")
  readonly brandScript: AssetLocationSupplier; // white label ("brandable")
  readonly brandStylesheet: AssetLocationSupplier; // white label ("brandable")
  readonly brandFavIcon: AssetLocationSupplier; // white label ("brandable")
}

export interface LightningNavigationNotification {
  readonly count: number;
  readonly assistiveText?: string;
}

export interface LightningNavigationNotificationSupplier {
  readonly ldsNavNotification: LightningNavigationNotification;
}

export interface ContextBarRouteNode extends govn.RouteNode {
  readonly isContextBarRouteNode: boolean;
}

export interface LightningNavigation
  extends govn.RouteTreeSupplier, html.HtmlLayoutClientCargoValueSupplier {
  readonly home: govn.RouteLocation;
  readonly contextBarItems: (
    layout: LightningLayout,
  ) => govn.RouteNode[];
  readonly contentTree: (
    layout: LightningLayout,
  ) => govn.RouteTreeNode | undefined;
  readonly location: (unit: govn.RouteNode) => govn.RouteLocation;
  readonly redirectUrl: (
    rs: govn.RedirectSupplier,
  ) => govn.RouteLocation | undefined;
  readonly notification: (
    unit: govn.RouteTreeNode,
  ) => LightningNavigationNotification | undefined;
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
      assets: AssetLocations,
    ) => LightningContextBarSubject);
  readonly contextBarSubjectImageSrc:
    | LightningContextBarSubjectImageSrc
    | ((
      assets: AssetLocations,
      lnc: LightningNavigationContext,
    ) => LightningContextBarSubjectImageSrc);
}

// deno-lint-ignore no-empty-interface
export interface LightningLayoutText
  extends html.HtmlLayoutText<LightningLayout> {
}

export interface LightingDesignSystemArguments {
  readonly git?: govn.GitExecutive;
  readonly gitCache?: govn.GitExecutive;
  readonly layoutText: LightningLayoutText;
  readonly navigation: LightningNavigation;
  readonly assets: AssetLocations;
  readonly branding: LightningBranding;
}

export interface LightningLayout
  extends
    html.HtmlLayout<LightningLayoutText>,
    LightningNavigationContext,
    govn.ModelSupplier<govn.ContentModel> {
  readonly dsArgs: LightingDesignSystemArguments;
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
