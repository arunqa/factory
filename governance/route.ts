import * as r from "./resource.ts";
import * as n from "./nature.ts";
import * as e from "./extension.ts";
import * as render from "./render.ts";
import * as fm from "./frontmatter.ts";
import * as git from "../lib/git/mod.ts";

export type RouteUnitName = string;
export type RouteRelativeURL = string;
export type RouteLocation = string;
export type TargetableRouteIdentity = string;

export interface RouteUnitLabelSupplier {
  readonly label: string;
}

export type RouteAliasURL = string;

export type TargetableRouteIdentityOrRelPath = string;

export type RouteAlias =
  | TargetableRouteIdentityOrRelPath
  | ({
    readonly routeIdOrPath: TargetableRouteIdentityOrRelPath;
  } & Partial<RouteUnitLabelSupplier>);

export interface RedirectUrlSupplier {
  readonly redirect: RouteAliasURL;
}

export interface RedirectNodeSupplier {
  readonly redirect: RouteNode;
}

export type RedirectSupplier = RedirectUrlSupplier | RedirectNodeSupplier;

/**
 * RouteUnit is supplied by resources and are enhanced using RouteNode instances
 * to supply enough information to generate tree nodes. A multi-step process is
 * used so that resourcescan declare their minimal unit's structure without
 * knowing the entire node path or tree. A resource only needs to know where it
 * wants to be located in a route and then the tree management code will
 * compute levels, URLs, and other properties needed for terminal resources.
 */
export interface RouteUnit
  extends RouteUnitLabelSupplier, Partial<e.ExtensionsSupplier> {
  readonly unit: RouteUnitName;
  readonly hint?: string;
  readonly isIntermediate?: boolean;
  readonly aliases?: RouteAlias[];
  readonly targetableID?: TargetableRouteIdentity;
  readonly location?: (
    baseOrOptions?: RouteLocation | RouteLocationOptions,
  ) => RouteLocation;
}

export interface RouteTargetsSupplier {
  readonly targetableRouteNode: (
    ID: TargetableRouteIdentity,
  ) => RouteNode | undefined;
  readonly targetableRoute: (
    ID: TargetableRouteIdentity,
  ) => Route | undefined;
}

export interface RootRouteUnit extends RouteUnit {
  readonly isRootUnit: true;
}

export interface RouteUrlSupplier {
  readonly routeURL: (
    route: RouteNode,
    base?: RouteLocation,
  ) => URL;
}

export interface RouteLocationSupplier {
  readonly routeLocation: (
    route: RouteNode,
    base?: RouteLocation,
  ) => RouteLocation;
}

export interface RouteLocationOptions
  extends Partial<RouteUrlSupplier>, Partial<RouteLocationSupplier> {
  readonly base?: RouteLocation;
}

/**
 * RouteNode is a computed (generated) object created by pre-processing route
 * units and adding level, qualifiedPath, etc.
 */
export interface RouteNode extends RouteUnit {
  readonly level: number;
  readonly qualifiedPath: RouteLocation; // does not include unit
  readonly resolve: (
    relative: RouteLocation,
    noMatch?: (
      endIndex: number,
      parseError?: boolean,
    ) => RouteUnit,
  ) => RouteUnit | undefined;
  readonly location: (
    baseOrOptions?: RouteLocation | RouteLocationOptions,
  ) => RouteLocation;
  readonly inRoute: (route: Route) => boolean;
  readonly lastModifiedAt?: Date;
  readonly createdAt?: Date;
}

/**
 * Before pre-processing, a Route is comprised of RouteUnit but after pre-
 * processing, it's comprised of RouteNode.
 */
export interface RouteUnits<Unit extends RouteUnit = RouteUnit> {
  readonly units: Unit[];
  readonly terminal?: Unit;
}

export interface Route<Unit extends RouteNode = RouteNode>
  extends
    RouteUnits<Unit>,
    ParsedRouteConsumer,
    // deno-lint-ignore no-explicit-any
    Partial<n.NatureSupplier<any>>,
    // deno-lint-ignore no-explicit-any
    Partial<render.RenderTargetsSupplier<any>> {
  readonly inRoute: (
    unit: RouteNode,
  ) => RouteNode | undefined;
  readonly parent: Route<Unit> | undefined;
  readonly targetableID?: TargetableRouteIdentity;
}

export interface RouteUnitsSupplier<Unit extends RouteUnit = RouteUnit> {
  readonly route: RouteUnits<Unit>;
}

export interface ParsedRouteConsumer {
  readonly consumeParsedRoute: (
    rs: ParsedRouteSupplier | fm.UntypedFrontmatter,
  ) => ParsedRouteSupplier | fm.UntypedFrontmatter;
}

export interface ParsedRouteSupplier<Unit extends RouteUnit = RouteUnit> {
  readonly route: RouteUnits<Unit> | Unit;
}

export interface RouteSupplier<Unit extends RouteNode = RouteNode>
  extends RouteUnitsSupplier<Unit> {
  readonly route: Route<Unit>;
}

export interface RouteGitRemoteResolver<Remote> {
  (route: Route, branch: git.GitBranch): Remote | undefined;
}

export interface RouteFactory {
  readonly route: (rs: RouteUnit | RouteUnits | RouteUnitsSupplier) => Route;
  readonly childRoute: (
    child: RouteUnit,
    rs:
      | Route
      | RouteSupplier,
    replaceTerminal?: boolean,
  ) => Route;
}

export interface RouteTreeNode extends RouteNode, Partial<RouteSupplier> {
  readonly owner: RouteTree;
  readonly ancestors: RouteTreeNode[];
  readonly parent?: RouteTreeNode;
  readonly children: RouteTreeNode[];
  readonly select: (selector: string) => RouteTreeNode | undefined;
  readonly walk: (
    inspector: (entry: RouteTreeNode) => boolean,
  ) => RouteTreeNode | void;
}

export interface RouteTree extends RouteTargetsSupplier {
  readonly node: (location: RouteLocation) => RouteTreeNode | undefined;
  readonly items: RouteTreeNode[];
  readonly walkNodes: (
    inspector: (entry: RouteTreeNode) => boolean,
    maxLevel?: number,
  ) => RouteTreeNode | void;
  readonly filterNodes: (
    inspector: (entry: RouteTreeNode) => boolean,
    maxLevel?: number,
  ) => Iterable<RouteTreeNode>;
  readonly organize: (
    order: (a: RouteTreeNode, b: RouteTreeNode) => number,
  ) => void;
}

export interface RouteTreeSupplier<Tree extends RouteTree = RouteTree> {
  readonly routeTree: Tree;
}

export interface RouteTreeConsumer {
  readonly consumeRouteTree: (
    suppliers: r.ResourcesSupplier<RouteSupplier>,
  ) => Promise<void>;
}
