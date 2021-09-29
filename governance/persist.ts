import { events } from "../deps.ts";
import * as c from "./content.ts";
import * as r from "./resource.ts";
import * as route from "./route.ts";

export type LocalFileSystemDestinationRootPath = string;
export type LocalFileSystemDestination = string;

export interface LocalFileSystemNamingStrategy<Resource> {
  (product: Resource, destPath: string): LocalFileSystemDestination;
}

export interface FileSysPersistenceNamingStrategySupplier {
  readonly persistFileSysNamingStrategy: LocalFileSystemNamingStrategy<
    route.RouteSupplier
  >;
}

export class FileSysPersistenceEventsEmitter extends events.EventEmitter<{
  afterPersistFlexibleFile(
    destFileName: string,
    contributor: c.FlexibleContent | c.FlexibleContentSync | string,
    contribution:
      | "string"
      | "text"
      | "uint8array"
      | "writer",
    unhandled?: boolean,
  ): void;
  afterPersistFlexibleFileSync(
    destFileName: string,
    contributor: c.FlexibleContent | c.FlexibleContentSync | string,
    contribution:
      | "string"
      | "text"
      | "uint8array"
      | "writer",
    unhandled?: boolean,
  ): void;
}> {}

export interface FileSysPersistenceSupplier<Resource> {
  readonly persistFileSysRefinery: (
    rootPath: LocalFileSystemDestinationRootPath,
    namingStrategy: LocalFileSystemNamingStrategy<route.RouteSupplier>,
    fspEE?: FileSysPersistenceEventsEmitter,
    ...functionArgs: unknown[]
  ) => r.ResourceRefinery<Resource>;
  readonly persistFileSys: (
    resource: Resource,
    rootPath: LocalFileSystemDestinationRootPath,
    namingStrategy: LocalFileSystemNamingStrategy<route.RouteSupplier>,
    fspEE?: FileSysPersistenceEventsEmitter,
    ...functionArgs: unknown[]
  ) => Promise<void>;
}
