import * as govn from "../../../governance/mod.ts";
import * as git from "../../../lib/git/mod.ts";
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
  readonly dsComponent: AssetLocationSupplier; // design system
  readonly image: AssetLocationSupplier; // local site
  readonly favIcon: AssetLocationSupplier; // local site
  readonly script: AssetLocationSupplier; // local site
  readonly stylesheet: AssetLocationSupplier; // local site
  readonly component: AssetLocationSupplier; // local site
  readonly brandImage: AssetLocationSupplier; // white label ("brandable")
  readonly brandScript: AssetLocationSupplier; // white label ("brandable")
  readonly brandStylesheet: AssetLocationSupplier; // white label ("brandable")
  readonly brandComponent: AssetLocationSupplier; // white label ("brandable")
  readonly brandFavIcon: AssetLocationSupplier; // white label ("brandable")
}

export type LightningNavigationNotificationIdentity = string;

export interface LightningNavigationNotification {
  readonly identity: LightningNavigationNotificationIdentity;
  readonly count: (set?: number) => number;
  readonly icon?: l.IconIdentity;
  readonly assistiveText?: string;
}

export interface LightningNavigationNotifications {
  readonly collection: LightningNavigationNotification[];
}

export interface LightningNavigationNotificationSupplier {
  readonly ldsNavNotifications: LightningNavigationNotifications;
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
  readonly notifications: (
    unit: govn.RouteTreeNode,
  ) => LightningNavigationNotifications | undefined;
  readonly descendantsNotifications: (
    unit: govn.RouteTreeNode,
  ) => LightningNavigationNotifications | undefined;
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
  readonly git?: git.GitExecutive;
  readonly mGitResolvers: git.ManagedGitResolvers;
  readonly routeGitRemoteResolver: govn.RouteGitRemoteResolver<
    html.GitRemoteAnchor
  >;
  readonly layoutText: LightningLayoutText;
  readonly navigation: LightningNavigation;
  readonly assets: AssetLocations;
  readonly branding: LightningBranding;
  readonly renderedAt: Date;
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
