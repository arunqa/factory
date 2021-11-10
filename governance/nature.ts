import * as safety from "../lib/safety/mod.ts";
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

// deno-lint-ignore no-explicit-any
export interface StructuredDataInstanceSupplier<Model = any> {
  readonly structuredDataInstance: Model;
}

export interface StructuredDataResource extends
  NatureSupplier<
    MediaTypeNature<c.SerializedDataSupplier>
  >,
  StructuredDataInstanceSupplier,
  c.SerializedDataSupplier {
}

export interface PersistableStructuredDataResource extends
  NatureSupplier<
    & MediaTypeNature<c.SerializedDataSupplier>
    & p.FileSysPersistenceSupplier<StructuredDataResource>
  >,
  StructuredDataInstanceSupplier,
  c.SerializedDataSupplier {
}
