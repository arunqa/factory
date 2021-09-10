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

export interface FileSysPersistenceSupplier<Resource> {
  readonly persistFileSysRefinery: (
    rootPath: LocalFileSystemDestinationRootPath,
    namingStrategy: LocalFileSystemNamingStrategy<route.RouteSupplier>,
    ...functionArgs: unknown[]
  ) => r.ResourceRefinery<Resource>;
  readonly persistFileSys: (
    resource: Resource,
    rootPath: LocalFileSystemDestinationRootPath,
    namingStrategy: LocalFileSystemNamingStrategy<route.RouteSupplier>,
    ...functionArgs: unknown[]
  ) => Promise<void>;
}
