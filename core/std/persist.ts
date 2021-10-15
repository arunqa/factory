import { path, safety } from "../../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as c from "../../core/std/content.ts";

export type LocalFileSystemDestinationRootPath = string;
export type LocalFileSystemDestination = string;

export interface PersistOptions {
  readonly ensureDirSync?: (destFileName: string) => void;
  readonly unhandledSync?: govn.FlexibleContentSync;
  readonly unhandled?: govn.FlexibleContent;
  readonly functionArgs?: unknown[];
  readonly eventsEmitter?: govn.FileSysPersistenceEventsEmitter;
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
  const fspEE = options?.eventsEmitter;
  // always ensure in sync mode, never async
  if (options?.ensureDirSync) {
    options?.ensureDirSync(path.dirname(destFileName));
  }
  if (typeof contributor === "string") {
    await Deno.writeTextFile(destFileName, contributor);
    if (fspEE) {
      await fspEE.emit(
        "afterPersistFlexibleFile",
        destFileName,
        contributor,
        "string",
      );
    }
    return "string";
  }
  if (c.isTextSupplier(contributor)) {
    await Deno.writeTextFile(
      destFileName,
      typeof contributor.text === "string"
        ? contributor.text
        : await contributor.text(...(options?.functionArgs || [])),
    );
    if (fspEE) {
      await fspEE.emit(
        "afterPersistFlexibleFile",
        destFileName,
        contributor,
        "text",
      );
    }
    return "text";
  }
  if (c.isUint8ArraySupplier(contributor)) {
    await Deno.writeFile(
      destFileName,
      typeof contributor.uint8Array === "function"
        ? await contributor.uint8Array(...(options?.functionArgs || []))
        : contributor.uint8Array,
    );
    if (fspEE) {
      await fspEE.emit(
        "afterPersistFlexibleFile",
        destFileName,
        contributor,
        "uint8array",
      );
    }
    return "uint8array";
  }
  if (c.isContentSupplier(contributor)) {
    const file = await Deno.open(destFileName, { write: true, create: true });
    await contributor.content(file);
    file.close();
    if (fspEE) {
      await fspEE.emit(
        "afterPersistFlexibleFile",
        destFileName,
        contributor,
        "writer",
      );
    }
    return "writer";
  }
  const syncResult = persistFlexibleFileSyncCustom(
    contributor,
    destFileName,
    options,
  );
  if (syncResult) return syncResult;
  if (options?.unhandled) {
    const recursed = await persistFlexibleFileCustom(
      options?.unhandled,
      destFileName,
      {
        ...options,
        unhandled: undefined,
      },
    );
    if (recursed && fspEE) {
      await fspEE.emit(
        "afterPersistFlexibleFile",
        destFileName,
        contributor,
        recursed,
        true,
      );
    }
    return recursed;
  }
  return false;
}

export function persistFlexibleFileSyncCustom(
  contributor: govn.FlexibleContentSync | govn.FlexibleContent | string,
  destFileName: LocalFileSystemDestination,
  options?: PersistOptions,
): false | "string" | "text" | "uint8array" | "writer" {
  const fspEE = options?.eventsEmitter;
  if (options?.ensureDirSync) {
    options?.ensureDirSync(path.dirname(destFileName));
  }
  if (typeof contributor === "string") {
    Deno.writeTextFileSync(destFileName, contributor);
    if (fspEE) {
      fspEE.emitSync(
        "afterPersistFlexibleFileSync",
        destFileName,
        contributor,
        "string",
      );
    }
    return "string";
  }
  if (c.isTextSyncSupplier(contributor)) {
    Deno.writeTextFileSync(
      destFileName,
      typeof contributor.textSync === "string"
        ? contributor.textSync
        : contributor.textSync(...(options?.functionArgs || [])),
    );
    if (fspEE) {
      fspEE.emitSync(
        "afterPersistFlexibleFileSync",
        destFileName,
        contributor,
        "text",
      );
    }
    return "text";
  }
  if (c.isUint8ArraySyncSupplier(contributor)) {
    Deno.writeFileSync(
      destFileName,
      typeof contributor.uint8ArraySync === "function"
        ? contributor.uint8ArraySync(...(options?.functionArgs || []))
        : contributor.uint8ArraySync,
    );
    if (fspEE) {
      fspEE.emitSync(
        "afterPersistFlexibleFileSync",
        destFileName,
        contributor,
        "uint8array",
      );
    }
    return "uint8array";
  }
  if (c.isContentSyncSupplier(contributor)) {
    const file = Deno.openSync(destFileName, { write: true, create: true });
    contributor.contentSync(file);
    file.close();
    if (fspEE) {
      fspEE.emitSync(
        "afterPersistFlexibleFileSync",
        destFileName,
        contributor,
        "writer",
      );
    }
    return "writer";
  }
  if (options?.unhandledSync) {
    const recursed = persistFlexibleFileSyncCustom(
      options.unhandledSync,
      destFileName,
      {
        ...options,
        unhandledSync: undefined,
      },
    );
    if (recursed && fspEE) {
      fspEE.emitSync(
        "afterPersistFlexibleFileSync",
        destFileName,
        contributor,
        "writer",
        true,
      );
    }
    return recursed;
  }
  return false;
}
