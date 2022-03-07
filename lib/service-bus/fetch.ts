import * as govn from "./governance.ts";

export interface FetchObserver<
  FetchPayload extends govn.IdentifiablePayload,
  Context,
> {
  (
    fp: FetchPayload,
    ri: RequestInit,
    ctx: Context,
    fs: FetchStrategy,
  ): void;
}

export interface FetchResponseObserver<
  FetchPayload extends govn.IdentifiablePayload,
  FetchRespPayload extends govn.IdentifiablePayload,
  Context,
> {
  (
    frp: FetchRespPayload,
    fp: FetchPayload,
    ctx: Context,
    fs: FetchStrategy,
  ): void;
}

export interface FetchErrorObserver<
  FetchPayload extends govn.IdentifiablePayload,
  Context,
> {
  (
    error: Error,
    ri: RequestInit,
    fp: FetchPayload,
    ctx: Context,
    fs: FetchStrategy,
  ): void;
}

export interface FetchStrategy {
  readonly fetch: <
    FetchPayload extends govn.IdentifiablePayload,
    FetchRespPayload extends govn.IdentifiablePayload,
    Context,
  >(
    sbfe: FetchProxy<FetchPayload, FetchRespPayload, Context>,
    ctx: Context,
  ) => void;
  readonly observeFetchEvent: <
    FetchPayload extends govn.IdentifiablePayload,
    Context,
  >(
    observer: FetchObserver<FetchPayload, Context>,
    fetchPayloadID?: govn.PayloadIdentity,
  ) => void;
  readonly observeFetchEventResponse: <
    FetchPayload extends govn.IdentifiablePayload,
    FetchRespPayload extends govn.IdentifiablePayload,
    Context,
  >(
    observer: FetchResponseObserver<
      FetchPayload,
      FetchRespPayload,
      Context
    >,
    fetchRespPayloadID?: govn.PayloadIdentity,
  ) => void;
  readonly observeFetchEventError: <
    FetchPayload extends govn.IdentifiablePayload,
    Context,
  >(
    observer: FetchErrorObserver<
      FetchPayload,
      Context
    >,
    fetchPayloadID?: govn.PayloadIdentity,
  ) => void;
}

export interface FetchInit {
  readonly endpoint: string | Request | URL;
  readonly requestInit: RequestInit;
}

export interface FetchProxy<
  FetchPayload extends govn.IdentifiablePayload,
  FetchRespPayload extends govn.IdentifiablePayload,
  Context,
> {
  readonly fetch: (sb: FetchStrategy, ctx: Context) => void;
  readonly prepareContext: (ctx: Context, sb: FetchStrategy) => Context;
  readonly prepareFetchPayload: (
    ctx: Context,
    fs: FetchStrategy,
  ) => FetchPayload;
  readonly prepareFetchResponsePayload: (
    fp: FetchPayload,
    fetchRespRawJSON: unknown,
    ctx: Context,
    fs: FetchStrategy,
  ) => FetchRespPayload;
  readonly prepareFetch: (
    baseURL: string | undefined,
    payload: FetchPayload,
    ctx: Context,
    fs: FetchStrategy,
  ) => FetchInit;
  readonly observeFetch: (
    fs: FetchStrategy,
    observer: FetchObserver<
      FetchPayload,
      Context
    >,
  ) => void;
  readonly observeFetchResponse: (
    fs: FetchStrategy,
    observer: FetchResponseObserver<
      FetchPayload,
      FetchRespPayload,
      Context
    >,
  ) => void;
  readonly observeFetchRespError: (
    fs: FetchStrategy,
    observer: FetchErrorObserver<
      FetchPayload,
      Context
    >,
  ) => void;
}

export interface FetchCustomEventDetail<Context> {
  readonly context: Context;
  readonly fetchStrategy: FetchStrategy;
}

export interface FetchPayloadSupplier<
  Payload extends govn.IdentifiablePayload,
> {
  readonly fetchPayload: Payload;
}

export interface FetchRespPayloadSupplier<
  Payload extends govn.IdentifiablePayload,
> {
  readonly fetchRespPayload: Payload;
}
