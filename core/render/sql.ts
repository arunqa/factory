import { fs } from "../deps.ts";
import * as safety from "../../lib/safety/mod.ts";
import * as govn from "../../governance/mod.ts";
import * as persist from "../../core/std/persist.ts";

export interface SqlFileResource extends govn.TextResource {
  readonly isSqlFileResource: true;
}

export const isSqlFileResource = safety.typeGuard<SqlFileResource>(
  "nature",
  "text",
  "textSync",
  "isSqlFileResource",
);

export function sqlFileProducer<State>(
  destRootPath: string,
  state: State,
  options?: {
    readonly namingStrategy?: persist.LocalFileSystemNamingStrategy<
      govn.RouteSupplier<govn.RouteNode>
    >;
    readonly eventsEmitter?: govn.FileSysPersistenceEventsEmitter;
  },
  // deno-lint-ignore no-explicit-any
): govn.ResourceRefinery<any> {
  const namingStrategy = options?.namingStrategy ||
    persist.routePersistForceExtnNamingStrategy(".sql");
  return async (resource) => {
    if (isSqlFileResource(resource)) {
      await persist.persistResourceFile(
        resource,
        resource,
        namingStrategy(
          resource as unknown as govn.RouteSupplier<govn.RouteNode>,
          destRootPath,
        ),
        {
          ensureDirSync: fs.ensureDirSync,
          functionArgs: [state],
          eventsEmitter: options?.eventsEmitter,
        },
      );
    }
    return resource;
  };
}
