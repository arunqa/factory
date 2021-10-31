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

export interface StructureDataRenderContext
  extends Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>> {
  readonly routeTree: govn.RouteTree;
}

export interface StructuredDataLayout<Resource>
  extends
    StructureDataRenderContext,
    Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>> {
  readonly resource: Resource;
  readonly mediaTypeNature: govn.MediaTypeNature<govn.StructuredDataResource>;
  readonly activeRoute?: govn.Route;
}

export interface StructuredDataTextProducer<Resource> {
  (
    layout: StructuredDataLayout<Resource>,
  ): Promise<govn.SerializedDataSupplier>;
}

export function structuredDataTextProducer(
  mediaTypeNature: govn.MediaTypeNature<govn.StructuredDataResource>,
  destRootPath: string,
  namingStrategy: persist.LocalFileSystemNamingStrategy<
    govn.RouteSupplier<govn.RouteNode>
  >,
  context: StructureDataRenderContext,
  fspEE?: govn.FileSysPersistEventsEmitterSupplier,
): govn.ResourceRefinery<govn.SerializedDataSupplier> {
  const producer = r.pipelineUnitsRefineryUntyped(
    async (resource) => {
      if (c.isSerializedDataSupplier(resource)) {
        return resource;
      }
      if (c.isStructuredDataInstanceSupplier(resource)) {
        if (c.isSerializedDataSupplier(resource.structuredDataInstance)) {
          return resource.structuredDataInstance;
        }
        if (typeof resource.structuredDataInstance === "function") {
          const stdpFunction = resource
            .structuredDataInstance as StructuredDataTextProducer<unknown>;
          const layout: StructuredDataLayout<
            govn.StructuredDataInstanceSupplier
          > = {
            ...context,
            mediaTypeNature,
            resource,
            activeRoute: route.isRouteSupplier(resource)
              ? resource.route
              : undefined,
          };
          const supplier = await stdpFunction(layout);
          const result:
            & govn.StructuredDataInstanceSupplier
            & govn.SerializedDataSupplier = {
              ...resource,
              ...supplier,
            };
          return result;
        }
        if (c.isSerializedDataSupplier(resource.structuredDataInstance)) {
          return resource.structuredDataInstance;
        }
        const issue: govn.SerializedDataSupplier = {
          serializedData: c.flexibleContent(
            "structuredDataTextProducer() was not able to serialize data",
          ),
        };
        return issue;
      }
      return resource;
    },
    async (resource) => {
      const layout: StructuredDataLayout<govn.StructuredDataResource> = {
        ...context,
        mediaTypeNature,
        resource,
      };
      if (c.isSerializedDataSupplier(resource)) {
        await persist.persistFlexibleFileCustom(
          resource.serializedData,
          namingStrategy(
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
        mediaTypeNature.mediaType,
      )
    ) {
      return await producer(resource);
    }
    // we cannot handle this type of rendering target, no change to resource
    return resource;
  };
}

export function jsonTextProducer(
  destRootPath: string,
  context: StructureDataRenderContext,
  fspEE?: govn.FileSysPersistEventsEmitterSupplier,
): govn.ResourceRefinery<govn.SerializedDataSupplier> {
  return structuredDataTextProducer(
    n.jsonMediaTypeNature,
    destRootPath,
    persist.routePersistForceExtnNamingStrategy(".json"),
    context,
    fspEE,
  );
}
