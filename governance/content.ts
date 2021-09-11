import { safety } from "../deps.ts";

export interface ContentModel {
  readonly isContentModel: true;
  readonly isContentAvailable: boolean;
}

export type HTML = string;

export interface MediaTypeSupplier {
  readonly mediaType: string;
}

export type FlexibleText =
  | string
  // deno-lint-ignore no-explicit-any
  | ((...args: any[]) => string);

export interface TextSupplier {
  // deno-lint-ignore no-explicit-any
  readonly text: string | ((...args: any[]) => Promise<string>);
}

export interface TextSyncSupplier {
  readonly textSync: FlexibleText;
}

export interface Uint8ArraySupplier {
  readonly uint8Array:
    | Uint8Array
    // deno-lint-ignore no-explicit-any
    | ((...args: any[]) => Promise<Uint8Array>);
}

export interface Uint8ArraySyncSupplier {
  // deno-lint-ignore no-explicit-any
  readonly uint8ArraySync: Uint8Array | ((...args: any[]) => Uint8Array);
}

export interface ContentSupplier {
  readonly content: (writer: Deno.Writer) => Promise<number>;
}

export interface ContentSyncSupplier {
  readonly contentSync: (writer: Deno.WriterSync) => number;
}

export interface HtmlSupplier {
  readonly html: FlexibleContent | FlexibleContentSync | string;
}

export interface JsonTextSupplier {
  readonly jsonText: FlexibleContent | FlexibleContentSync | string;
}

export interface DiagnosticsSupplier {
  readonly diagnostics: FlexibleContent | FlexibleContentSync | string;
}

export interface OptionalFlexibleContent
  extends
    Partial<TextSupplier>,
    Partial<Uint8ArraySupplier>,
    Partial<ContentSupplier> {
}

export type FlexibleContent = safety.RequireAtLeastOne<
  OptionalFlexibleContent & OptionalFlexibleContentSync,
  | "text"
  | "uint8Array"
  | "content"
  | "textSync"
  | "uint8ArraySync"
  | "contentSync"
>;

export interface OptionalFlexibleContentSync
  extends
    Partial<TextSyncSupplier>,
    Partial<Uint8ArraySyncSupplier>,
    Partial<ContentSyncSupplier> {
}

export type FlexibleContentSync = safety.RequireAtLeastOne<
  OptionalFlexibleContentSync,
  | "textSync"
  | "uint8ArraySync"
  | "contentSync"
>;

export type PersistFileSysDestination = string;

export interface TextSuppliersFactory {
  readonly prepareText: (text: string) => FlexibleContent & FlexibleContentSync;
}

export interface HtmlSuppliersFactory {
  readonly prepareHTML: (text: string) => HtmlSupplier;
}

export interface JsonSuppliersFactory {
  readonly prepareJSON: (
    // deno-lint-ignore no-explicit-any
    instance: any,
    // deno-lint-ignore no-explicit-any
    replacer?: (this: any, key: string, value: any) => any,
  ) => JsonTextSupplier;
}
