import { colors, fs, path, safety } from "../../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as c from "../../core/std/content.ts";

export type LocalFileSystemDestinationRootPath = string;
export type LocalFileSystemDestination = string;

export interface PersistOptions {
  readonly ensureDirSync?: (destFileName: string) => void;
  readonly unhandledSync?: govn.FlexibleContentSync;
  readonly unhandled?: govn.FlexibleContent;
  readonly functionArgs?: unknown[];
}

export interface LocalFileSystemNamingStrategy<Resource> {
  (product: Resource, destPath: string): LocalFileSystemDestination;
}

export function isFileSysPersistenceSupplier<Resource>(
  o: unknown,
): o is govn.FileSysPersistenceSupplier<Resource> {
  const isType = safety.typeGuard<
    govn.FileSysPersistenceSupplier<Resource>
  >("persistFileSys", "persistFileSysRefinery");
  return isType(o);
}

export const isFileSysTextPersistenceNamingStrategySupplier = safety.typeGuard<
  govn.FileSysPersistenceNamingStrategySupplier
>("persistFileSysNamingStrategy");

export function routePersistForceExtnNamingStrategy(
  fileExtn: string,
): LocalFileSystemNamingStrategy<govn.RouteSupplier> {
  return (resource, destPath) => {
    const routeUnit = resource.route.terminal;
    if (routeUnit) {
      const parentUnit = routeUnit.level > 0
        ? resource.route.units[routeUnit.level - 1]
        : undefined;
      const fileName = c.replaceExtn(routeUnit.unit, fileExtn);
      return parentUnit
        ? path.join(destPath, parentUnit.qualifiedPath, fileName)
        : path.join(destPath, fileName);
    }
    return "no_terminal_route_in_routePersistForceExtnNamingStrategy" +
      fileExtn;
  };
}

export function routePersistPrettyUrlHtmlNamingStrategy(
  isIndex: (unit: govn.RouteUnit) => boolean,
): LocalFileSystemNamingStrategy<govn.RouteSupplier> {
  const typical = routePersistForceExtnNamingStrategy(".html");
  return (resource, destPath) => {
    const routeUnit = resource.route.terminal;
    if (routeUnit) {
      if (isIndex(routeUnit)) return typical(resource, destPath);
      return path.join(destPath, routeUnit.qualifiedPath, "index.html");
    }
    return "no_terminal_route_in_routePersistPrettyUrlHtmlNamingStrategy.html";
  };
}

export async function persistFlexibleFileCustom(
  contributor: govn.FlexibleContent | govn.FlexibleContentSync | string,
  destFileName: LocalFileSystemDestination,
  options?: PersistOptions,
): Promise<false | "string" | "text" | "uint8array" | "writer"> {
  // always ensure in sync mode, never async
  if (options?.ensureDirSync) {
    options?.ensureDirSync(path.dirname(destFileName));
  }
  if (typeof contributor === "string") {
    await Deno.writeTextFile(destFileName, contributor);
    return "string";
  }
  if (c.isTextSupplier(contributor)) {
    await Deno.writeTextFile(
      destFileName,
      typeof contributor.text === "string"
        ? contributor.text
        : await contributor.text(...(options?.functionArgs || [])),
    );
    return "text";
  }
  if (c.isUint8ArraySupplier(contributor)) {
    await Deno.writeFile(
      destFileName,
      typeof contributor.uint8Array === "function"
        ? await contributor.uint8Array(...(options?.functionArgs || []))
        : contributor.uint8Array,
    );
    return "uint8array";
  }
  if (c.isContentSupplier(contributor)) {
    const file = await Deno.open(destFileName, { write: true, create: true });
    await contributor.content(file);
    file.close();
    return "writer";
  }
  const syncResult = persistFlexibleFileSyncCustom(
    contributor,
    destFileName,
    options,
  );
  if (syncResult) return syncResult;
  if (options?.unhandled) {
    return await persistFlexibleFileCustom(options?.unhandled, destFileName, {
      ...options,
      unhandled: undefined,
    });
  }
  return false;
}

export function persistFlexibleFileSyncCustom(
  contributor: govn.FlexibleContentSync | govn.FlexibleContent | string,
  destFileName: LocalFileSystemDestination,
  options?: PersistOptions,
): false | "string" | "text" | "uint8array" | "writer" {
  if (options?.ensureDirSync) {
    options?.ensureDirSync(path.dirname(destFileName));
  }
  if (typeof contributor === "string") {
    Deno.writeTextFileSync(destFileName, contributor);
    return "string";
  }
  if (c.isTextSyncSupplier(contributor)) {
    Deno.writeTextFileSync(
      destFileName,
      typeof contributor.textSync === "string"
        ? contributor.textSync
        : contributor.textSync(...(options?.functionArgs || [])),
    );
    return "text";
  }
  if (c.isUint8ArraySyncSupplier(contributor)) {
    Deno.writeFileSync(
      destFileName,
      typeof contributor.uint8ArraySync === "function"
        ? contributor.uint8ArraySync(...(options?.functionArgs || []))
        : contributor.uint8ArraySync,
    );
    return "uint8array";
  }
  if (c.isContentSyncSupplier(contributor)) {
    const file = Deno.openSync(destFileName, { write: true, create: true });
    contributor.contentSync(file);
    file.close();
    return "writer";
  }
  if (options?.unhandledSync) {
    return persistFlexibleFileSyncCustom(options.unhandledSync, destFileName, {
      ...options,
      unhandledSync: undefined,
    });
  }
  return false;
}

export async function linkAssets(
  originRootPath: string,
  destRootPath: string,
  ...globs: {
    readonly glob: string;
    readonly options?: fs.ExpandGlobOptions;
    readonly include?: (we: fs.WalkEntry) => boolean;
    readonly hardlink?: boolean;
  }[]
) {
  for (const g of globs) {
    const options: fs.ExpandGlobOptions = {
      root: originRootPath,
      includeDirs: false,
      globstar: true,
      ...g.options,
    };
    for await (
      const a of fs.expandGlob(g.glob, options)
    ) {
      const include = g.include ? g.include(a) : a.isFile;
      if (include) {
        const relPath = path.relative(
          g.options?.root || originRootPath,
          a.path,
        );
        const dest = path.join(destRootPath, relPath);
        if (!fs.existsSync(dest)) {
          if (g.hardlink) {
            await fs.ensureLink(a.path, dest);
          } else {
            await fs.ensureSymlink(a.path, dest);
          }
        } else {
          console.warn(
            `unable to symlink ${a.path} to ${dest}: cannot overwrite destination`,
          );
        }
      }
    }
  }
}

export async function symlinkDirectoryChildren(
  originRootPath: string,
  destRootPath: string,
  maxDepth = 1,
) {
  if (fs.existsSync(originRootPath)) {
    for await (
      const we of fs.walk(originRootPath, {
        maxDepth,
        includeDirs: true,
        includeFiles: true,
      })
    ) {
      if (we.path === originRootPath) continue;
      await fs.ensureSymlink(
        path.resolve(we.path),
        path.join(destRootPath, we.name),
      );
    }
  } else {
    console.warn(
      colors.red(
        `Unable to symlinkDirectoryChildren of ${
          colors.brightRed(originRootPath)
        } to ${destRootPath}: path not found`,
      ),
    );
  }
}
