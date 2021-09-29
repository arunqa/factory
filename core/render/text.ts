import { fs, safety } from "../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as persist from "../../core/std/persist.ts";

export interface TextFileResource extends govn.TextResource {
  readonly isTextFileResource: true;
}

export const isTextFileResource = safety.typeGuard<TextFileResource>(
  "nature",
  "text",
  "textSync",
  "isTextFileResource",
);

export function textFileProducer<State>(
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
    persist.routePersistForceExtnNamingStrategy(".txt");
  return async (resource) => {
    if (isTextFileResource(resource)) {
      await persist.persistFlexibleFileCustom(
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
