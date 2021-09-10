import { safety } from "../deps.ts";
import * as c from "./content.ts";
import * as p from "./persist.ts";

export interface NatureSupplier<Nature> {
  readonly nature: Nature;
}

export type MediaTypeIdentity = string;

export interface MediaTypeNature<Resource> {
  readonly mediaType: MediaTypeIdentity;
  readonly guard: safety.TypeGuard<Resource>;
}

export interface TextResource
  extends
    c.TextSupplier,
    c.TextSyncSupplier,
    NatureSupplier<MediaTypeNature<c.TextSupplier & c.TextSyncSupplier>> {
}

export interface PersistableTextResource
  extends
    c.TextSupplier,
    c.TextSyncSupplier,
    NatureSupplier<
      & MediaTypeNature<c.TextSupplier & c.TextSyncSupplier>
      & p.FileSysPersistenceSupplier<TextResource>
    > {
}

export interface HtmlResource extends
  c.HtmlSupplier,
  NatureSupplier<
    MediaTypeNature<c.HtmlSupplier>
  > {
}

export interface PersistableHtmlResource extends
  c.HtmlSupplier,
  NatureSupplier<
    & MediaTypeNature<c.HtmlSupplier>
    & p.FileSysPersistenceSupplier<HtmlResource>
  > {
}

export interface JsonInstanceSupplier {
  // deno-lint-ignore no-explicit-any
  readonly jsonInstance: any;
}

export interface JsonResource extends
  NatureSupplier<
    MediaTypeNature<c.JsonTextSupplier>
  >,
  JsonInstanceSupplier,
  c.JsonTextSupplier {
}

export interface PersistableJsonResource extends
  NatureSupplier<
    & MediaTypeNature<c.JsonTextSupplier>
    & p.FileSysPersistenceSupplier<JsonResource>
  >,
  JsonInstanceSupplier,
  c.JsonTextSupplier {
}
