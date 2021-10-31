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

export interface FileSysAfterPersistEventElaboration<Resource> {
  readonly contributor: c.FlexibleContent | c.FlexibleContentSync | string;
  readonly contribution:
    | "string"
    | "text"
    | "uint8array"
    | "writer";
  readonly unhandled?: boolean;
  readonly resource?: Resource;
}

export interface FileSysPersistEventsEmitterSupplier<Resource = unknown> {
  readonly fspEE: FileSysPersistenceEventsEmitter;
  readonly resource?: Resource;
}

export class FileSysPersistenceEventsEmitter extends events.EventEmitter<{
  afterPersistFlexibleFile(
    destFileName: string,
    elaboration: FileSysAfterPersistEventElaboration<unknown>,
  ): void;
  afterPersistFlexibleFileSync(
    destFileName: string,
    elaboration: FileSysAfterPersistEventElaboration<unknown>,
  ): void;
}> {}

export interface FileSysPersistenceSupplier<Resource> {
  readonly persistFileSysRefinery: (
    rootPath: LocalFileSystemDestinationRootPath,
    namingStrategy: LocalFileSystemNamingStrategy<route.RouteSupplier>,
    fspEES?: FileSysPersistEventsEmitterSupplier,
    ...functionArgs: unknown[]
  ) => r.ResourceRefinery<Resource>;
  readonly persistFileSys: (
    resource: Resource,
    rootPath: LocalFileSystemDestinationRootPath,
    namingStrategy: LocalFileSystemNamingStrategy<route.RouteSupplier>,
    fspEES?: FileSysPersistEventsEmitterSupplier,
    ...functionArgs: unknown[]
  ) => Promise<void>;
}
