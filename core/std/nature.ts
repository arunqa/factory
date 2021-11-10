import { fs } from "../deps.ts";
import * as safety from "../../lib/safety/mod.ts";
import * as govn from "../../governance/mod.ts";
import * as c from "./content.ts";
import * as p from "./persist.ts";

export const isNatureSupplier = safety.typeGuard<govn.NatureSupplier<unknown>>(
  "nature",
);

export const isMediaTypeNature = safety.typeGuard<
  govn.MediaTypeNature<unknown>
>(
  "mediaType",
  "guard",
);

export const textMediaTypeNature: govn.MediaTypeNature<govn.TextResource> = {
  mediaType: "text/plain",
  guard: (o: unknown): o is govn.TextResource => {
    if (
      isNatureSupplier(o) && isMediaTypeNature(o.nature) &&
      o.nature.mediaType === textMediaTypeNature.mediaType &&
      (c.isTextSupplier(o) && c.isTextSyncSupplier(o))
    ) {
      return true;
    }
    return false;
  },
};

export const htmlMediaTypeNature: govn.MediaTypeNature<govn.HtmlResource> = {
  mediaType: "text/html",
  guard: (o: unknown): o is govn.HtmlResource => {
    if (
      isNatureSupplier(o) && isMediaTypeNature(o.nature) &&
      o.nature.mediaType === htmlMediaTypeNature.mediaType &&
      c.isHtmlSupplier(o)
    ) {
      return true;
    }
    return false;
  },
};

export const jsonMediaTypeNature: govn.MediaTypeNature<
  govn.StructuredDataResource
> = {
  mediaType: "application/json",
  guard: (o: unknown): o is govn.StructuredDataResource => {
    if (
      isNatureSupplier(o) && isMediaTypeNature(o.nature) &&
      o.nature.mediaType === jsonMediaTypeNature.mediaType &&
      c.isSerializedDataSupplier(o)
    ) {
      return true;
    }
    return false;
  },
};

export const json5MediaTypeNature: govn.MediaTypeNature<
  govn.StructuredDataResource
> = {
  mediaType: "application/json5",
  guard: (o: unknown): o is govn.StructuredDataResource => {
    if (
      isNatureSupplier(o) && isMediaTypeNature(o.nature) &&
      o.nature.mediaType === json5MediaTypeNature.mediaType &&
      c.isSerializedDataSupplier(o)
    ) {
      return true;
    }
    return false;
  },
};

export const yamlMediaTypeNature: govn.MediaTypeNature<
  govn.StructuredDataResource
> = {
  mediaType: "text/vnd.yaml",
  guard: (o: unknown): o is govn.StructuredDataResource => {
    if (
      isNatureSupplier(o) && isMediaTypeNature(o.nature) &&
      o.nature.mediaType === yamlMediaTypeNature.mediaType &&
      c.isSerializedDataSupplier(o)
    ) {
      return true;
    }
    return false;
  },
};

export const tomlMediaTypeNature: govn.MediaTypeNature<
  govn.StructuredDataResource
> = {
  mediaType: "application/toml",
  guard: (o: unknown): o is govn.StructuredDataResource => {
    if (
      isNatureSupplier(o) && isMediaTypeNature(o.nature) &&
      o.nature.mediaType === tomlMediaTypeNature.mediaType &&
      c.isSerializedDataSupplier(o)
    ) {
      return true;
    }
    return false;
  },
};

export const prepareText: (
  text: string,
) => govn.FlexibleContent & govn.FlexibleContentSync = (text) => {
  return {
    text: text,
    textSync: text,
  };
};

export const prepareHTML: (text: string) => govn.HtmlSupplier = (
  text: string,
) => {
  const fc = c.flexibleContent(text);
  return {
    html: fc,
  };
};

export const prepareJSON: govn.StructuredDataSerializer = (
  instance,
  replacer,
) => {
  const fc = c.flexibleContent(JSON.stringify(instance, replacer));
  return {
    serializedData: fc,
  };
};

export const textContentNature:
  & govn.MediaTypeNature<govn.TextResource>
  & govn.TextSuppliersFactory
  & govn.HtmlSuppliersFactory
  & govn.FileSysPersistenceSupplier<govn.TextResource> = {
    mediaType: textMediaTypeNature.mediaType,
    guard: textMediaTypeNature.guard,
    prepareText,
    prepareHTML,
    persistFileSysRefinery: (
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      return async (resource) => {
        if (c.isTextSupplier(resource)) {
          await p.persistFlexibleFileCustom(
            resource,
            namingStrategy(
              resource as unknown as govn.RouteSupplier<govn.RouteNode>,
              rootPath,
            ),
            {
              ensureDirSync: fs.ensureDirSync,
              functionArgs,
              eventsEmitter,
            },
          );
        }
        return resource;
      };
    },
    persistFileSys: async (
      resource,
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      if (c.isTextSupplier(resource)) {
        await p.persistFlexibleFileCustom(
          resource,
          namingStrategy(
            resource as unknown as govn.RouteSupplier<govn.RouteNode>,
            rootPath,
          ),
          { ensureDirSync: fs.ensureDirSync, functionArgs, eventsEmitter },
        );
      }
    },
  };

export const htmlContentNature:
  & govn.MediaTypeNature<govn.HtmlResource>
  & govn.HtmlSuppliersFactory
  & govn.FileSysPersistenceSupplier<govn.HtmlResource> = {
    mediaType: htmlMediaTypeNature.mediaType,
    guard: htmlMediaTypeNature.guard,
    prepareHTML,
    persistFileSysRefinery: (
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      return async (resource) => {
        if (c.isHtmlSupplier(resource)) {
          await p.persistFlexibleFileCustom(
            resource.html,
            namingStrategy(
              resource as unknown as govn.RouteSupplier<govn.RouteNode>,
              rootPath,
            ),
            {
              ensureDirSync: fs.ensureDirSync,
              functionArgs,
              eventsEmitter: eventsEmitter
                ? { ...eventsEmitter, resource }
                : undefined,
            },
          );
        }
        return resource;
      };
    },
    persistFileSys: async (
      resource,
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      if (c.isHtmlSupplier(resource)) {
        await p.persistFlexibleFileCustom(
          resource.html,
          namingStrategy(
            resource as unknown as govn.RouteSupplier<govn.RouteNode>,
            rootPath,
          ),
          { ensureDirSync: fs.ensureDirSync, functionArgs, eventsEmitter },
        );
      }
    },
  };

export function structuredDataContentNature(
  mtNature: govn.MediaTypeNature<govn.StructuredDataResource>,
  prepareStructuredData: govn.StructuredDataSerializer,
):
  & govn.MediaTypeNature<govn.StructuredDataResource>
  & govn.StructuredDataFactory
  & govn.FileSysPersistenceSupplier<govn.StructuredDataResource> {
  return {
    mediaType: mtNature.mediaType,
    guard: mtNature.guard,
    prepareStructuredData,
    persistFileSysRefinery: (
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      return async (resource) => {
        if (c.isSerializedDataSupplier(resource)) {
          await p.persistFlexibleFileCustom(
            resource.serializedData,
            namingStrategy(
              resource as unknown as govn.RouteSupplier<govn.RouteNode>,
              rootPath,
            ),
            { ensureDirSync: fs.ensureDirSync, eventsEmitter, functionArgs },
          );
        }
        return resource;
      };
    },
    persistFileSys: async (
      resource,
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      if (c.isSerializedDataSupplier(resource)) {
        await p.persistFlexibleFileCustom(
          resource.serializedData,
          namingStrategy(
            resource as unknown as govn.RouteSupplier<govn.RouteNode>,
            rootPath,
          ),
          { ensureDirSync: fs.ensureDirSync, eventsEmitter, functionArgs },
        );
      }
    },
  };
}

export const jsonContentNature = structuredDataContentNature(
  jsonMediaTypeNature,
  prepareJSON,
);
