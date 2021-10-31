import { fs, safety } from "../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as c from "../../core/std/content.ts";
import * as n from "../../core/std/nature.ts";
import * as persist from "../../core/std/persist.ts";

export interface DelimitedTextSupplier<State> {
  readonly isDelimitedTextSupplier: true;
  readonly header?: string | ((rc: State) => string[]);
  readonly rows:
    | string[]
    | ((rc: State) => Iterable<string[]>);
}

export const isDelimitedTextSupplier = safety.typeGuard<
  DelimitedTextSupplier<unknown>
>(
  "isDelimitedTextSupplier",
  "rows",
);

export interface DelimitedTextResource<State>
  extends DelimitedTextSupplier<State>, govn.TextResource {
}

export const isDelimitedTextResource = safety.typeGuard<
  DelimitedTextResource<unknown>
>(
  "nature",
  "text",
  "textSync",
  "isDelimitedTextSupplier",
  "rows",
);

export interface DelimitedTextProducerArguments<State> {
  readonly destRootPath: string;
  readonly state: State;
  readonly nature: govn.MediaTypeNature<govn.TextResource>;
  readonly namingStrategy: persist.LocalFileSystemNamingStrategy<
    govn.RouteSupplier<govn.RouteNode>
  >;
  readonly rowRenderer: (row: string[], state: State) => string;
  readonly headerRenderer?: (header: string[], state: State) => string;
  readonly rowsDelim: string;
  readonly eventsEmitter?: govn.FileSysPersistEventsEmitterSupplier;
}

export function delimitedTextProducer<State>(
  {
    destRootPath,
    state,
    nature,
    namingStrategy: ns,
    rowRenderer,
    headerRenderer,
    rowsDelim,
    eventsEmitter,
  }: DelimitedTextProducerArguments<State>,
  // deno-lint-ignore no-explicit-any
): govn.ResourceRefinery<any> {
  return async (resource) => {
    let csvResource: DelimitedTextResource<State> | undefined;
    if (isDelimitedTextResource(resource)) {
      csvResource = resource;
    } else if (isDelimitedTextSupplier(resource)) {
      let rowsText: string[];
      if (typeof resource.rows === "function") {
        rowsText = [];
        const rows = resource.rows(state);
        for (const row of rows) {
          rowsText.push(rowRenderer(row, state));
        }
      } else {
        rowsText = Array.from(resource.rows);
      }
      if (headerRenderer && resource.header) {
        if (typeof resource.header === "string") {
          rowsText.unshift(resource.header);
        } else {
          rowsText.unshift(headerRenderer(resource.header(state), state));
        }
      }
      const text = rowsText.join(rowsDelim);
      csvResource = {
        ...resource,
        nature,
        text,
        textSync: text,
      };
    }
    if (csvResource) {
      await persist.persistFlexibleFileCustom(
        csvResource,
        ns(
          csvResource as unknown as govn.RouteSupplier<govn.RouteNode>,
          destRootPath,
        ),
        {
          ensureDirSync: fs.ensureDirSync,
          functionArgs: [state],
          eventsEmitter,
        },
      );
      return csvResource;
    }
    return resource; // we cannot handle this type of rendering target, no change to resource
  };
}

export const csvMediaTypeNature: govn.MediaTypeNature<
  DelimitedTextResource<unknown>
> = {
  mediaType: "text/csv",
  // deno-lint-ignore no-explicit-any
  guard: (o: unknown): o is DelimitedTextResource<any> => {
    if (
      n.isNatureSupplier(o) && n.isMediaTypeNature(o.nature) &&
      o.nature.mediaType === csvMediaTypeNature.mediaType &&
      isDelimitedTextSupplier(o)
    ) {
      return true;
    }
    return false;
  },
};

export const csvContentNature:
  & govn.MediaTypeNature<DelimitedTextResource<unknown>>
  & govn.TextSuppliersFactory
  & govn.FileSysPersistenceSupplier<DelimitedTextResource<unknown>> = {
    mediaType: csvMediaTypeNature.mediaType,
    guard: csvMediaTypeNature.guard,
    prepareText: n.prepareText,
    persistFileSysRefinery: (
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      return async (resource) => {
        if (c.isTextSupplier(resource)) {
          await persist.persistFlexibleFileCustom(
            resource,
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
      if (c.isTextSupplier(resource)) {
        await persist.persistFlexibleFileCustom(
          resource,
          namingStrategy(
            resource as unknown as govn.RouteSupplier<govn.RouteNode>,
            rootPath,
          ),
          { ensureDirSync: fs.ensureDirSync, eventsEmitter, functionArgs },
        );
      }
    },
  };

export function csvProducer<State>(
  destRootPath: string,
  state: State,
  eventsEmitter?: govn.FileSysPersistEventsEmitterSupplier,
): govn.ResourceRefinery<DelimitedTextResource<State>> {
  return delimitedTextProducer({
    destRootPath,
    state,
    nature: csvMediaTypeNature,
    namingStrategy: persist.routePersistForceExtnNamingStrategy(".csv"),
    rowRenderer: () => "",
    headerRenderer: () => "",
    rowsDelim: "\n",
    eventsEmitter,
  });
}
