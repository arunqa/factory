import { fs, safety } from "../deps.ts";
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

export const jsonMediaTypeNature: govn.MediaTypeNature<govn.JsonResource> = {
  mediaType: "application/json",
  guard: (o: unknown): o is govn.JsonResource => {
    if (
      isNatureSupplier(o) && isMediaTypeNature(o.nature) &&
      o.nature.mediaType === jsonMediaTypeNature.mediaType &&
      c.isJsonTextSupplier(o)
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

export const prepareJSON: (
  // deno-lint-ignore no-explicit-any
  instance: any,
  // deno-lint-ignore no-explicit-any
  replacer?: (this: any, key: string, value: any) => any,
) => govn.JsonTextSupplier = (
  instance,
  replacer,
) => {
  const fc = c.flexibleContent(JSON.stringify(instance, replacer));
  return {
    jsonText: fc,
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
            { ensureDirSync: fs.ensureDirSync, functionArgs, eventsEmitter },
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

export const jsonContentNature:
  & govn.MediaTypeNature<govn.JsonResource>
  & govn.JsonSuppliersFactory
  & govn.FileSysPersistenceSupplier<govn.JsonResource> = {
    mediaType: jsonMediaTypeNature.mediaType,
    guard: jsonMediaTypeNature.guard,
    prepareJSON,
    persistFileSysRefinery: (
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      return async (resource) => {
        if (c.isJsonTextSupplier(resource)) {
          await p.persistFlexibleFileCustom(
            resource.jsonText,
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
      if (c.isJsonTextSupplier(resource)) {
        await p.persistFlexibleFileCustom(
          resource.jsonText,
          namingStrategy(
            resource as unknown as govn.RouteSupplier<govn.RouteNode>,
            rootPath,
          ),
          { ensureDirSync: fs.ensureDirSync, eventsEmitter, functionArgs },
        );
      }
    },
  };
