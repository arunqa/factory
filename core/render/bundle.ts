import { fs } from "../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as br from "../../core/resource/module/bundle.ts";
import * as p from "../../core/std/persist.ts";

export function bundleProducer<State>(
  destRootPath: string,
  state: State,
  options?: {
    readonly namingStrategy?: p.LocalFileSystemNamingStrategy<
      govn.RouteSupplier<govn.RouteNode>
    >;
    readonly eventsEmitter?: govn.FileSysPersistenceEventsEmitter;
  },
  // deno-lint-ignore no-explicit-any
): govn.ResourceRefinery<any> {
  const namingStrategy = options?.namingStrategy ||
    p.routePersistForceExtnNamingStrategy(".js");
  return async (resource) => {
    if (br.isBundleResource(resource)) {
      await p.persistResourceFile(
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
