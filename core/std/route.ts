import { log, path, safety } from "../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as c from "./content.ts";
import * as e from "./extension.ts";

export const [isRouteUnit, isRouteUnitsArray] = safety.typeGuards<
  govn.RouteUnit,
  govn.RouteUnit[]
>("unit", "label");

export const isRootRouteUnit = safety.typeGuard<govn.RootRouteUnit>(
  "isRootUnit",
  "unit",
  "label",
);

export const [isRouteNode, isRouteNodesArray] = safety
  .typeGuards<govn.RouteNode, govn.RouteNode[]>(
    "unit",
    "label",
    "level",
    "qualifiedPath",
  );

export const isParsedRouteConsumer = safety.typeGuard<govn.ParsedRouteConsumer>(
  "consumeParsedRoute",
);

export const isRedirectSupplier = safety.typeGuard<govn.RedirectSupplier>(
  "redirect",
);

export function isRedirectUrlSupplier(
  o: unknown,
): o is govn.RedirectUrlSupplier {
  return isRedirectSupplier(o) && typeof o.redirect === "string";
}

export function isRedirectNodeSupplier(
  o: unknown,
): o is govn.RedirectNodeSupplier {
  return isRedirectSupplier(o) && isRouteNode(o.redirect);
}

export function isRouteUnits<Unit extends govn.RouteUnit>(
  o: unknown,
): o is govn.RouteUnits<Unit> {
  const isType = safety.typeGuard<govn.RouteUnits>("units");
  if (isType(o) && (isRouteUnitsArray(o.units))) {
    return true;
  }
  return false;
}

export function isRoute<Unit extends govn.RouteNode>(
  o: unknown,
): o is govn.Route<Unit> {
  const isType = safety.typeGuard<govn.Route>("units");
  if (isType(o) && (isRouteNodesArray(o.units))) {
    return true;
  }
  return false;
}

export function isRouteUnitsSupplier(o: unknown): o is govn.RouteUnitsSupplier {
  const isType = safety.typeGuard<govn.RouteUnitsSupplier>("route");
  if (isType(o) && isRouteUnitsArray(o.route?.units)) {
    return true;
  }
  return false;
}

export function isParsedRouteSupplier(
  o: unknown,
): o is govn.ParsedRouteSupplier {
  // be liberal with routes coming from parsed sources like YAML/frontmatter
  // so that the parsed route consumers can make decisions about final values
  const isType = safety.typeGuard<govn.ParsedRouteSupplier>("route");
  return isType(o);
}

export function isRouteSupplier(
  o: unknown,
): o is govn.RouteSupplier {
  const isType = safety.typeGuard<govn.RouteSupplier>("route");
  if (isType(o) && isRouteNodesArray(o.route.units)) {
    return true;
  }
  return false;
}

export function routeModuleOrigin(
  moduleMetaURL: string,
  label: string,
): govn.ModuleRouteOrigin {
  return {
    isRouteOrigin: true,
    moduleMetaURL,
    label,
  };
}

export const isModuleRouteOrigin = safety.typeGuard<govn.ModuleRouteOrigin>(
  "isRouteOrigin",
  "moduleMetaURL",
  "label",
);

export function routeNodeLocation(
  ru: govn.RouteNode,
  options?: govn.RouteLocationOptions,
): govn.RouteLocation {
  const dest = ru.qualifiedPath;
  if (options) {
    if (options.routeLocation) {
      return options.routeLocation(ru, options.base);
    }
    if (options.routeURL) {
      const url = options.routeURL(ru, options.base);
      return url.toString();
    }
    if (options.base) {
      return `${options.base}${dest}`;
    }
  }
  return `${dest}`;
}

/**
 * Clone properties from parsed into dest if the property in parsed does not
 * already exist in dest.
 * @param parsed The parsed (source) route unit
 * @param dest The destination route unit
 * @returns The destination route unit
 */
export const inheritParsedProperties = (
  parsed: govn.RouteUnit,
  dest: govn.RouteUnit,
  exclude: string[],
): govn.RouteUnit => {
  if (typeof parsed === "object") {
    const source = parsed as unknown as Record<string, unknown>;
    const merged = dest as unknown as Record<string, unknown>;
    for (const prop in source) {
      if (!(prop in merged) && !(exclude.find((p) => p == prop))) {
        merged[prop] = e.deepClone(source[prop]);
      }
    }
    return merged as unknown as govn.RouteUnit;
  }
  return dest;
};

export function consumeParsedRoute(
  src: govn.ParsedRouteSupplier<govn.RouteUnit> | govn.UntypedFrontmatter,
  dest: govn.Route | govn.RouteSupplier,
) {
  const destUnits = isRouteSupplier(dest) ? dest.route.units : dest.units;
  if (typeof src?.route === "object") {
    const parsed = src.route as unknown as govn.RouteUnit;
    if (destUnits.length > 0) {
      const activeUnitIndex = destUnits.length - 1;
      const destUnit = destUnits[activeUnitIndex];
      if (parsed.unit) {
        // deno-lint-ignore no-explicit-any
        (destUnit.unit as any) = parsed.unit;
        if (activeUnitIndex > 0) {
          const parentUnit = destUnits[activeUnitIndex - 1];
          // deno-lint-ignore no-explicit-any
          (destUnit.qualifiedPath as any) = parentUnit.qualifiedPath + "/" +
            destUnit.unit;
        } else {
          // deno-lint-ignore no-explicit-any
          (destUnit.qualifiedPath as any) = "/" + destUnit.unit;
        }
      }
      const parsedUntyped = src.route as Record<string, unknown>;
      if (parsedUntyped.alias || parsedUntyped.aliases) {
        // these are more convenient than using routeAliases.target
        const mergeAlias = (alias: Record<string, string>) => {
          let aliases = destUnit.aliases;
          if (!aliases) {
            aliases = [];
            // deno-lint-ignore no-explicit-any
            (destUnit.aliases as any) = aliases;
          }
          if (typeof alias === "string") {
            aliases.push(alias);
          } else {
            if (typeof alias === "object") {
              const routeIdOrPath = alias.path || alias.routeIdOrPath;
              if (routeIdOrPath && typeof routeIdOrPath === "string") {
                const spec: govn.RouteAlias = { routeIdOrPath, ...alias };
                // deno-lint-ignore no-explicit-any
                delete (spec as any).path;
                aliases.push(spec);
              }
            }
          }
        };
        if (parsedUntyped.alias) {
          mergeAlias(parsedUntyped.alias as unknown as Record<string, string>);
        } else if (
          parsedUntyped.aliases && Array.isArray(parsedUntyped.aliases)
        ) {
          const aliases = parsedUntyped.aliases as unknown as Record<
            string,
            string
          >[];
          for (const alias of aliases) {
            mergeAlias(alias);
          }
        }
      }
      // deno-lint-ignore no-explicit-any
      if (parsed.label) (destUnit as any).label = parsed.label;
      inheritParsedProperties(parsed, destUnit, ["alias", "aliases"]);
    }
  }
  return src;
}

export const emptyRoute: govn.Route = {
  units: [],
  consumeParsedRoute: (pr) => pr,
  inRoute: () => undefined,
  parent: undefined,
};

export const emptyRouteSupplier: govn.RouteSupplier = {
  route: emptyRoute,
};

/**
 * Convert relative path to absolute
 * @param base the path that `relative` is relative to
 * @param relative the path relative to `base` (can be ./, ../.., etc.)
 * @returns
 */
export function absolutePath(base: string, relative: string) {
  const stack = base.split("/");
  const parts = relative.split("/");
  stack.pop(); // remove current file name (or empty string)
  // (omit if "base" is the current folder without trailing slash)
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] == ".") {
      continue;
    }
    if (parts[i] == "..") {
      stack.pop();
    } else {
      stack.push(parts[i]);
    }
  }
  return stack.join("/");
}

/**
 * Convert relative path to absolute
 * @param base the path that `relative` is relative to
 * @param relative the path relative to `base` (can be ./, ../.., etc.)
 * @returns
 */
export function resolveRouteUnit(
  relative: string,
  currentUnitIndex: number,
  route: govn.Route,
  noMatch?: (endIndex: number, parseError?: boolean) => govn.RouteUnit,
): govn.RouteUnit | undefined {
  let unitIndex = currentUnitIndex;
  const parts = relative.split("/");
  // (omit if "base" is the current folder without trailing slash)
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] == "." || parts[i] == "") {
      continue;
    }
    if (parts[i] == "..") {
      unitIndex--;
    } else {
      return noMatch ? noMatch(unitIndex, true) : undefined;
    }
  }
  if (unitIndex >= 0 && unitIndex < route.units.length) {
    return route.units[unitIndex];
  }
  return noMatch ? noMatch(unitIndex) : undefined;
}

export interface RouteLocationResolver {
  (
    node: govn.RouteNode,
    options?: govn.RouteLocationOptions,
  ): govn.RouteLocation;
}

export function defaultRouteLocationResolver(
  resolverOptions?: {
    readonly defaultOptions?: govn.RouteLocationOptions;
    readonly enhance?: (
      suggested: govn.RouteLocation,
      node: govn.RouteNode,
      options?: govn.RouteLocationOptions,
    ) => govn.RouteLocation;
  },
): RouteLocationResolver {
  const enhance = resolverOptions?.enhance;
  return enhance
    ? ((node, options) => {
      // first run the default behavior
      const result = routeNodeLocation(
        node,
        options || resolverOptions?.defaultOptions,
      );
      // now wrap the customization
      return enhance(result, node, options || resolverOptions?.defaultOptions);
    })
    : routeNodeLocation;
}

export class TypicalRouteFactory implements govn.RouteFactory {
  constructor(
    readonly routeLocationResolver: RouteLocationResolver,
  ) {
  }
  /**
   * Return a units array and accessor suitable for preparing routes. This
   * method may be overridden to replace accessor or otherwise modify the route
   * units.
   * @param rus The instance to extract the units array and accessor from
   * @returns The units array and accessor which route constructor can use
   */
  routeUnits(
    rs: govn.RouteUnit | govn.RouteUnits | govn.RouteUnitsSupplier,
  ): [units: govn.RouteUnit[], accessor: (index: number) => govn.RouteUnit] {
    const units = isRouteUnitsSupplier(rs)
      ? rs.route.units
      : (isRouteUnits(rs) ? rs.units : [rs]);
    const accessor: (index: number) => govn.RouteUnit = (index) => {
      return units[index];
    };
    return [units, accessor];
  }

  route(
    rs: govn.RouteUnit | govn.RouteUnits | govn.RouteUnitsSupplier,
  ): govn.Route {
    const [units, accessor] = this.routeUnits(rs);
    const hierUnits: govn.RouteNode[] = [];
    const terminalIndex = units.length - 1;
    const parentIndex = terminalIndex - 1;
    let qualifiedPath = "";
    for (let i = 0; i < units.length; i++) {
      const component = accessor(i);
      qualifiedPath += "/" + component.unit;
      const node: govn.RouteNode = {
        level: i,
        qualifiedPath,
        resolve: (relative) => resolveRouteUnit(relative, i, result),
        location: (options) => this.routeLocationResolver(node, options),
        isIntermediate: i < terminalIndex,
        inRoute: (route) => route.inRoute(node) ? true : false,
        ...component,
      };
      hierUnits.push(node);
    }
    const parent = parentIndex >= 0
      ? this.route({ units: hierUnits.slice(0, parentIndex) })
      : undefined;
    const result: govn.Route = {
      units: hierUnits,
      consumeParsedRoute: (pr) => consumeParsedRoute(pr, result),
      terminal: hierUnits.length > 0 ? hierUnits[terminalIndex] : undefined,
      inRoute: (unit) => {
        return hierUnits.find((u) => u.qualifiedPath == unit.qualifiedPath);
      },
      parent,
    };
    return result;
  }

  childRoute(
    child: govn.RouteUnit,
    rs:
      | govn.Route
      | govn.RouteSupplier,
    replaceTerminal?: boolean,
  ): govn.Route {
    const rh = isRouteSupplier(rs) ? rs.route : rs;
    const hierUnits = [...rh.units];
    let terminalIndex = -1;
    let qualifiedPath = "";
    if (replaceTerminal) {
      if (hierUnits.length > 1) {
        const grandparent = hierUnits[hierUnits.length - 2];
        terminalIndex = hierUnits.length - 1;
        qualifiedPath = grandparent.qualifiedPath;
        hierUnits[hierUnits.length - 2] = {
          ...grandparent,
          isIntermediate: true,
        };
      } else {
        terminalIndex = 0;
      }
    } else {
      if (hierUnits.length > 0) {
        const parent = hierUnits[hierUnits.length - 1];
        terminalIndex = hierUnits.length;
        qualifiedPath = parent.qualifiedPath;
        hierUnits[hierUnits.length - 1] = {
          ...parent,
          isIntermediate: true,
        };
      } else {
        terminalIndex = 0;
      }
    }
    qualifiedPath += "/" + child.unit;
    const node: govn.RouteNode = {
      level: terminalIndex,
      qualifiedPath,
      resolve: (relative) => resolveRouteUnit(relative, terminalIndex, result),
      location: (options) => this.routeLocationResolver(node, options),
      isIntermediate: false,
      inRoute: (route) => route.inRoute(node) ? true : false,
      ...child,
    };
    hierUnits[terminalIndex] = node;
    const parent = terminalIndex - 1 >= 0
      ? this.route({ units: hierUnits.slice(0, terminalIndex - 1) })
      : undefined;
    const result: govn.Route = {
      units: hierUnits,
      consumeParsedRoute: (pr) => consumeParsedRoute(pr, result),
      terminal: hierUnits.length > 0 ? hierUnits[terminalIndex] : undefined,
      inRoute: (unit) => {
        return hierUnits.find((u) => u.qualifiedPath == unit.qualifiedPath);
      },
      parent,
    };
    return result;
  }
}

export type FileExtnModifiers = string[];

export interface ParsedFileSysRoute {
  readonly parsedPath: path.ParsedPath;
  readonly routeUnit: govn.RouteUnit;
  readonly modifiers?: FileExtnModifiers;
}

export interface FileSysRouteParser {
  (
    fileSysPath: string | ParsedFileSysRoute,
    commonAncestor: string,
  ): ParsedFileSysRoute;
}

/**
 * Parses a file system path and returns the unit and label as the name of the
 * file. If there are any extra extensions in the file they are returned as
 * "modifiers".
 * @param fsp
 * @returns
 */
export const typicalFileSysRouteParser: FileSysRouteParser = (fsp) => {
  let parsedPath: path.ParsedPath;
  let modifiers: string[] | undefined;
  if (typeof fsp === "string") {
    parsedPath = path.parse(fsp);
    if (parsedPath.name.indexOf(".") > 0) {
      modifiers = [];
      let ppn = parsedPath.name;
      let modifier = path.extname(ppn);
      while (modifier && modifier.length > 0) {
        modifiers.push(modifier);
        ppn = ppn.substring(0, ppn.length - modifier.length);
        modifier = path.extname(ppn);
      }
      parsedPath.name = ppn;
    }
    return {
      parsedPath,
      modifiers,
      routeUnit: { unit: parsedPath.name, label: parsedPath.name },
    };
  }
  return fsp; // no transformation
};

/**
 * Parses a file system path and returns the unit as the name of the file and
 * the label as a human-friendly version of the file name.
 * @param fsp
 * @returns
 */
export const humanFriendlyFileSysRouteParser: FileSysRouteParser = (
  fsp,
  ca,
) => {
  const typical = typicalFileSysRouteParser(fsp, ca);
  return {
    parsedPath: typical.parsedPath,
    modifiers: typical.modifiers,
    routeUnit: {
      ...typical.routeUnit,
      label: c.humanFriendlyPhrase(typical.parsedPath.name),
    },
  };
};

export interface FileSysRouteOptions {
  readonly fsRouteFactory: FileSysRouteFactory;
  readonly routeParser: FileSysRouteParser;
  readonly extensionsManager: govn.ExtensionsManager;
  readonly log: log.Logger;
}

export interface FileSysRouteNode extends govn.RouteNode {
  readonly fileSysPath: string;
  readonly fileSysPathParts: path.ParsedPath;
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly isSymlink: boolean;
  readonly size: number;
}

export const isFileSysRouteUnit = safety.typeGuard<FileSysRouteNode>(
  "fileSysPath",
  "qualifiedPath",
  "isDirectory",
  "isFile",
  "isSymlink",
  "size",
  "level",
  "resolve",
);

export type FileSysRoute = govn.Route<FileSysRouteNode>;

export class FileSysRouteFactory extends TypicalRouteFactory {
  readonly cache = new Map<string, FileSysRoute>();

  /**
   * Determine all route units between fileSysPath and commonAncestor. Both
   * commonAncestor and fileSysPath should be valid (must exist) and be absolute
   * paths (not relative). commonAncestor should be a directory but fileSysPath
   * should be file.
   * @param fileSysPath absolute path the single unit whose route we're computing, must be a child of commonAncestor
   * @param commonAncestor absolute path of the ancestor path, must be a known ancestor of fileSysPath
   * @param pathParser which path parser we should use
   * @returns the full set of route units between fileSysPath and commonAncestor
   */
  async fsRoute(
    fileSysPath: string,
    commonAncestor: string,
    rps: FileSysRouteOptions,
  ): Promise<FileSysRoute> {
    const found = this.cache.get(fileSysPath);
    if (found) return found;

    if (fileSysPath == commonAncestor) {
      return {
        units: [],
        consumeParsedRoute: (pr) => pr,
        inRoute: (unit) => {
          return result.units.find((u) =>
            u.qualifiedPath == unit.qualifiedPath
          );
        },
        parent: undefined,
      };
    }

    const { parsedPath: fileSysPathParts, routeUnit: parsedUnit } = rps
      .routeParser(fileSysPath, commonAncestor);
    const qualifiedPath = path.relative(
      commonAncestor,
      path.join(fileSysPathParts.dir, parsedUnit.unit),
    );
    const parent = await this.fsRoute(
      path.dirname(fileSysPath),
      commonAncestor,
      rps,
    );
    const result: FileSysRoute = {
      units: qualifiedPath.length > 0
        ? [
          ...(await this.fsRoute(
            fileSysPathParts.dir,
            commonAncestor,
            rps,
          )).units,
        ]
        : [],
      consumeParsedRoute: (pr) => consumeParsedRoute(pr, result),
      inRoute: (unit) => {
        return result.units.find((u) => u.qualifiedPath == unit.qualifiedPath);
      },
      parent,
    };
    const level = result.units.length;
    const stat = Deno.statSync(fileSysPath);
    const routeUnit: FileSysRouteNode = {
      ...parsedUnit,
      fileSysPath,
      fileSysPathParts,
      qualifiedPath: qualifiedPath.startsWith("/")
        ? qualifiedPath
        : `/${qualifiedPath}`,
      level,
      isDirectory: stat.isDirectory,
      isFile: stat.isFile,
      isSymlink: stat.isSymlink,
      size: stat.size,
      isIntermediate: stat.isDirectory,
      lastModifiedAt: stat.mtime || undefined,
      createdAt: stat.birthtime || undefined,
      resolve: (relative) => resolveRouteUnit(relative, level, result),
      location: (options) => this.routeLocationResolver(routeUnit, options),
      inRoute: (route) => route.inRoute(routeUnit) ? true : false,
    };
    result.units.push(routeUnit);
    // deno-lint-ignore no-explicit-any
    (result as any).terminal = routeUnit;
    this.cache.set(fileSysPath, result);
    return result;
  }
}

export interface SlugifyOptions {
  lowercase: boolean;
  alphanumeric: boolean;
  separator: string;
  replace: {
    [index: string]: string;
  };
}

// Default options
const defaultSlugifyOptions: SlugifyOptions = {
  alphanumeric: true,
  lowercase: true,
  separator: "-",
  replace: {
    "Ð": "D", // eth
    "ð": "d",
    "Đ": "D", // crossed D
    "đ": "d",
    "ø": "o",
    "ß": "ss",
    "æ": "ae",
    "œ": "oe",
  },
};

export function slugifier(
  options: SlugifyOptions = defaultSlugifyOptions,
): (string: string) => string {
  const { lowercase, alphanumeric, separator, replace } = options;

  return function (text) {
    if (lowercase) text = text.toLowerCase();

    text = text.replaceAll(/[^a-z\d.-]/giu, (char) => {
      if (char in replace) return replace[char];

      if (alphanumeric) {
        char = char.normalize("NFKD").replaceAll(/[\u0300-\u036F]/g, "");
      }
      char = /[\p{L}\u0300-\u036F]/u.test(char) ? char : "-";
      return alphanumeric && /[^\w-]/.test(char) ? "" : char;
    });

    if (lowercase) text = text.toLowerCase();
    return text
      .replaceAll(/(?<=^|[/.])-+(?=[^.-])|(?<=[^.-])-+(?=$|[.])/g, "")
      .replaceAll(/-+/g, separator);
  };
}
