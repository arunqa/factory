import * as safety from "../safety/mod.ts";

export type PayloadIdentity = string;

export interface IdentifiablePayload {
  readonly payloadIdentity: PayloadIdentity; // use by observers
}

export const isIdentifiablePayload = safety.typeGuard<IdentifiablePayload>(
  "payloadIdentity",
);

export interface ErrorSupplier {
  readonly error: Error;
}

export interface EventTargetEventNameStrategy {
  (payload: PayloadIdentity | IdentifiablePayload | "universal"): {
    readonly payloadSpecificName?: string;
    readonly universalName: string;
    readonly selectedName: string;
  };
}

export interface EventSourceStrategy {
  readonly observeEventSource: <
    EventSourcePayload extends IdentifiablePayload,
  >(
    observer: EventSourceObserver<EventSourcePayload>,
    payloadID?: PayloadIdentity,
  ) => void;
  readonly observeEventSourceError: <
    EventSourcePayload extends IdentifiablePayload,
  >(
    observer: EventSourceErrorObserver<EventSourcePayload>,
    payloadID?: PayloadIdentity,
  ) => void;
}

export interface EventSourceService<
  EventSourcePayload extends IdentifiablePayload,
> {
  readonly isEventSourcePayload: (
    rawJSON: unknown,
  ) => rawJSON is EventSourcePayload;
  readonly prepareEventSourcePayload: (rawJSON: unknown) => EventSourcePayload;
  readonly observeEventSource: (
    ess: EventSourceStrategy,
    observer: EventSourceObserver<EventSourcePayload>,
  ) => void;
  readonly observeEventSourceError: (
    ess: EventSourceStrategy,
    observer: EventSourceErrorObserver<EventSourcePayload>,
  ) => void;
}

export interface EventSourceObserver<
  EventSourcePayload extends IdentifiablePayload,
> {
  (esp: EventSourcePayload, ess: EventSourceStrategy): void;
}

export interface EventSourceErrorObserver<
  EventSourcePayload extends IdentifiablePayload,
> {
  (
    error: Error,
    esp: EventSourcePayload,
    ess: EventSourceStrategy,
  ): void;
}

export interface FetchObserver<
  FetchPayload extends IdentifiablePayload,
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
  FetchPayload extends IdentifiablePayload,
  FetchRespPayload extends IdentifiablePayload,
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
  FetchPayload extends IdentifiablePayload,
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
    FetchPayload extends IdentifiablePayload,
    FetchRespPayload extends IdentifiablePayload,
    Context,
  >(
    sbfe: FetchService<FetchPayload, FetchRespPayload, Context>,
    ctx: Context,
  ) => void;
  readonly observeFetchEvent: <
    FetchPayload extends IdentifiablePayload,
    Context,
  >(
    observer: FetchObserver<FetchPayload, Context>,
    fetchPayloadID?: PayloadIdentity,
  ) => void;
  readonly observeFetchEventResponse: <
    FetchPayload extends IdentifiablePayload,
    FetchRespPayload extends IdentifiablePayload,
    Context,
  >(
    observer: FetchResponseObserver<
      FetchPayload,
      FetchRespPayload,
      Context
    >,
    fetchRespPayloadID?: PayloadIdentity,
  ) => void;
  readonly observeFetchEventError: <
    FetchPayload extends IdentifiablePayload,
    Context,
  >(
    observer: FetchErrorObserver<
      FetchPayload,
      Context
    >,
    fetchPayloadID?: PayloadIdentity,
  ) => void;
}

export interface FetchInit {
  readonly endpoint: string | Request | URL;
  readonly requestInit: RequestInit;
}

export interface FetchService<
  FetchPayload extends IdentifiablePayload,
  FetchRespPayload extends IdentifiablePayload,
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
  Payload extends IdentifiablePayload,
> {
  readonly fetchPayload: Payload;
}

export interface FetchRespPayloadSupplier<
  Payload extends IdentifiablePayload,
> {
  readonly fetchRespPayload: Payload;
}
