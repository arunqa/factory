import { fs } from "../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as c from "../../core/std/content.ts";
import * as r from "../../core/std/resource.ts";
import * as route from "../../core/std/route.ts";
import * as n from "../../core/std/nature.ts";
import * as render from "../../core/std/render.ts";
import * as persist from "../../core/std/persist.ts";

// ** TODO: ********************************************************************
// * do we need a more sophisticated render strategy for JSON like we have for *
// * HTML Design System? Could JSON be generalized for all types of rendering  *
// * like for iCal, RSS, XML, etc.? or, should it remain focused on JSON only? *
// *****************************************************************************

export interface JsonRenderContext
  extends Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>> {
  readonly routeTree: govn.RouteTree;
}

export interface JsonLayout<Resource>
  extends
    JsonRenderContext,
    Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>> {
  readonly resource: Resource;
  readonly activeRoute?: govn.Route;
}

export interface JsonTextProducer<Resource> {
  (layout: JsonLayout<Resource>): Promise<govn.JsonTextSupplier>;
}

export function jsonProducer(
  destRootPath: string,
  context: JsonRenderContext,
  fspEE?: govn.FileSysPersistenceEventsEmitter,
): govn.ResourceRefinery<govn.JsonTextSupplier> {
  const ns = persist.routePersistForceExtnNamingStrategy(".json");
  const producer = r.pipelineUnitsRefineryUntyped(
    async (resource) => {
      if (c.isJsonTextSupplier(resource)) {
        return resource;
      }
      if (c.isJsonInstanceSupplier(resource)) {
        if (c.isJsonTextSupplier(resource.jsonInstance)) {
          return resource.jsonInstance;
        }
        if (typeof resource.jsonInstance === "function") {
          const jiFunction = resource.jsonInstance as JsonTextProducer<unknown>;
          const layout: JsonLayout<govn.JsonInstanceSupplier> = {
            ...context,
            resource,
            activeRoute: route.isRouteSupplier(resource)
              ? resource.route
              : undefined,
          };
          const supplier = await jiFunction(layout);
          const result: govn.JsonInstanceSupplier & govn.JsonTextSupplier = {
            ...resource,
            ...supplier,
          };
          return result;
        }
        if (c.isJsonTextSupplier(resource.jsonInstance)) {
          return resource.jsonInstance;
        }
        const issue: govn.JsonTextSupplier = {
          jsonText: c.flexibleContent(
            "jsonProducer() was not able to produce JSON text",
          ),
        };
        return issue;
      }
      return resource;
    },
    async (resource) => {
      const layout: JsonLayout<govn.JsonResource> = {
        ...context,
        resource,
      };
      if (c.isJsonTextSupplier(resource)) {
        await persist.persistFlexibleFileCustom(
          resource.jsonText,
          ns(
            resource as unknown as govn.RouteSupplier<govn.RouteNode>,
            destRootPath,
          ),
          {
            ensureDirSync: fs.ensureDirSync,
            functionArgs: [layout],
            eventsEmitter: fspEE,
          },
        );
      }
      return resource;
    },
  );

  return async (resource) => {
    if (
      render.isRenderableMediaTypeResource(
        resource,
        n.jsonMediaTypeNature.mediaType,
      )
    ) {
      return await producer(resource);
    }
    // we cannot handle this type of rendering target, no change to resource
    return resource;
  };
}
