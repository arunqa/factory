import * as govn from "./governance.ts";
import * as f from "./fetch.ts";
import * as es from "./event-source.ts";

export interface ServicBusEventSourceTunnelsSupplier {
  (onMessage: (event: MessageEvent) => void): Generator<es.EventSourceTunnel>;
}

export interface ServiceBusArguments {
  readonly esTunnels?: ServicBusEventSourceTunnelsSupplier;
  readonly fetchBaseURL?: string;
  readonly eventNameStrategy: {
    readonly universalScopeID: "universal";
    readonly fetch: govn.EventTargetEventNameStrategy;
    readonly fetchResponse: govn.EventTargetEventNameStrategy;
    readonly fetchError: govn.EventTargetEventNameStrategy;
    readonly eventSource: govn.EventTargetEventNameStrategy;
  };
}

export function serviceBusArguments(
  options: Partial<ServiceBusArguments>,
): ServiceBusArguments {
  const universalScopeID = "universal";
  return {
    eventNameStrategy: {
      universalScopeID,
      fetch: (payload) => {
        const identity = typeof payload === "string"
          ? payload
          : payload.payloadIdentity;
        return identity == universalScopeID ? `fetch` : `fetch-${identity}`;
      },
      fetchResponse: (payload) => {
        const identity = typeof payload === "string"
          ? payload
          : payload.payloadIdentity;
        return identity == universalScopeID
          ? `fetch-response`
          : `fetch-response-${identity}`;
      },
      fetchError: (payload) => {
        const identity = typeof payload === "string"
          ? payload
          : payload.payloadIdentity;
        return identity == universalScopeID
          ? `fetch-error`
          : `fetch-error-${identity}`;
      },
      eventSource: (payload) => {
        const identity = typeof payload === "string"
          ? payload
          : payload.payloadIdentity;
        return identity == universalScopeID
          ? `event-source`
          : `event-source-${identity}`;
      },
    },
    ...options,
  };
}

export class ServiceBus extends EventTarget
  implements f.FetchStrategy, es.EventSourceStrategy {
  readonly tunnels: es.EventSourceTunnel[] = [];
  readonly eventListenersLog: {
    name: string;
    hook: EventListenerOrEventListenerObject | null;
  }[] = [];

  constructor(readonly args: ServiceBusArguments) {
    super();
    if (args.esTunnels) this.registerEventSourceTunnels(args.esTunnels);
  }

  registerEventSourceTunnels(ests: ServicBusEventSourceTunnelsSupplier) {
    for (
      const tunnel of ests((event) => {
        const eventSrcPayload = JSON.parse(event.data);
        console.log(
          "[registerEventSourceTunnels]",
          "eventSrcPayload",
          eventSrcPayload,
        );
        const esDetail:
          // deno-lint-ignore no-explicit-any
          es.EventSourceCustomEventDetail<any> = {
            eventSrcPayload,
          };
        this.dispatchNamingStrategyEvent(
          eventSrcPayload,
          this.args.eventNameStrategy.eventSource,
          esDetail,
        );
      })
    ) {
      this.tunnels.push(tunnel);
    }
  }

  dispatchNamingStrategyEvent(
    id: govn.PayloadIdentity | govn.IdentifiablePayload,
    strategy: govn.EventTargetEventNameStrategy,
    detail: unknown,
  ) {
    this.dispatchEvent(new CustomEvent(strategy(id), { detail }));
    this.dispatchEvent(
      new CustomEvent(strategy(this.args.eventNameStrategy.universalScopeID), {
        detail,
      }),
    );
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions | undefined,
  ) {
    super.addEventListener(type, listener, options);
    this.eventListenersLog.push({ name: type, hook: listener });
  }

  fetch<
    UserAgentPayload extends govn.IdentifiablePayload,
    ServerRespPayload extends govn.IdentifiablePayload,
    Context,
  >(
    uase: f.FetchProxy<UserAgentPayload, ServerRespPayload, Context>,
    suggestedCtx: Context,
  ): void {
    const transactionID = "TODO:UUIDv5?"; // tokens, user agent strings, etc.
    const clientProvenance = "ServiceBus.fetch";
    const ctx = { ...suggestedCtx, transactionID, clientProvenance };
    const fetchPayload = uase.prepareFetchPayload(ctx, this);
    const fetchInit = uase.prepareFetch(
      this.args.fetchBaseURL,
      fetchPayload,
      ctx,
      this,
    );
    const fetchDetail:
      & f.FetchCustomEventDetail<Context>
      & f.FetchInit
      & f.FetchPayloadSupplier<UserAgentPayload> = {
        ...fetchInit,
        fetchPayload,
        context: ctx,
        fetchStrategy: this,
      };
    this.dispatchNamingStrategyEvent(
      fetchPayload,
      this.args.eventNameStrategy.fetch,
      fetchDetail,
    );

    fetch(fetchInit.endpoint, fetchInit.requestInit)
      .then((res) => res.json())
      .then((fetchRespRawJSON) => {
        const fetchRespPayload = uase.prepareFetchResponsePayload(
          fetchPayload,
          fetchRespRawJSON,
          ctx,
          this,
        );
        const fetchRespDetail:
          & f.FetchCustomEventDetail<Context>
          & f.FetchPayloadSupplier<UserAgentPayload>
          & f.FetchRespPayloadSupplier<ServerRespPayload> = {
            fetchPayload,
            fetchRespPayload,
            context: ctx,
            fetchStrategy: this,
          };
        this.dispatchNamingStrategyEvent(
          fetchPayload,
          this.args.eventNameStrategy.fetchResponse,
          fetchRespDetail,
        );
      }).catch((error) => {
        const fetchErrorDetail:
          & f.FetchCustomEventDetail<Context>
          & f.FetchInit
          & f.FetchPayloadSupplier<UserAgentPayload>
          & govn.ErrorSupplier = {
            ...fetchInit,
            fetchPayload,
            context: ctx,
            error,
            fetchStrategy: this,
          };
        this.dispatchNamingStrategyEvent(
          fetchPayload,
          this.args.eventNameStrategy.fetchError,
          fetchErrorDetail,
        );
        console.error(`${fetchInit.endpoint} POST error`, error, fetchInit);
      });
  }

  observeFetchEvent<
    FetchPayload extends govn.IdentifiablePayload,
    Context,
  >(
    observer: f.FetchObserver<FetchPayload, Context>,
    fetchPayloadID?: govn.PayloadIdentity,
  ): void {
    this.addEventListener(
      this.args.eventNameStrategy.fetch(
        fetchPayloadID ?? this.args.eventNameStrategy.universalScopeID,
      ),
      (event) => {
        const typedCustomEvent = event as unknown as {
          detail:
            & f.FetchCustomEventDetail<Context>
            & f.FetchInit
            & f.FetchPayloadSupplier<FetchPayload>;
        };
        const { fetchPayload, requestInit, context, fetchStrategy } =
          typedCustomEvent.detail;
        observer(fetchPayload, requestInit, context, fetchStrategy);
      },
    );
  }

  observeFetchEventResponse<
    FetchPayload extends govn.IdentifiablePayload,
    FetchRespPayload extends govn.IdentifiablePayload,
    Context,
  >(
    observer: f.FetchResponseObserver<
      FetchPayload,
      FetchRespPayload,
      Context
    >,
    fetchRespPayloadID?: govn.PayloadIdentity,
  ): void {
    this.addEventListener(
      this.args.eventNameStrategy.fetchResponse(
        fetchRespPayloadID ?? this.args.eventNameStrategy.universalScopeID,
      ),
      (event) => {
        const typedCustomEvent = event as unknown as {
          detail:
            & f.FetchCustomEventDetail<Context>
            & f.FetchRespPayloadSupplier<FetchRespPayload>
            & f.FetchPayloadSupplier<FetchPayload>;
        };
        const { fetchPayload, fetchRespPayload, context, fetchStrategy } =
          typedCustomEvent.detail;
        observer(fetchRespPayload, fetchPayload, context, fetchStrategy);
      },
    );
  }

  observeFetchEventError<
    FetchPayload extends govn.IdentifiablePayload,
    Context,
  >(
    observer: f.FetchErrorObserver<
      FetchPayload,
      Context
    >,
    fetchPayloadID?: govn.PayloadIdentity,
  ): void {
    this.addEventListener(
      this.args.eventNameStrategy.fetchError(
        fetchPayloadID ?? this.args.eventNameStrategy.universalScopeID,
      ),
      (event) => {
        const typedCustomEvent = event as unknown as {
          detail:
            & f.FetchCustomEventDetail<Context>
            & f.FetchInit
            & f.FetchPayloadSupplier<FetchPayload>
            & govn.ErrorSupplier;
        };
        const { fetchPayload, error, requestInit, context, fetchStrategy } =
          typedCustomEvent.detail;
        observer(error, requestInit, fetchPayload, context, fetchStrategy);
      },
    );
  }

  observeEventSource<
    EventSourcePayload extends govn.IdentifiablePayload,
  >(
    observer: es.EventSourceObserver<EventSourcePayload>,
    payloadID?: govn.PayloadIdentity,
  ): void {
    this.addEventListener(
      this.args.eventNameStrategy.eventSource(
        payloadID ?? this.args.eventNameStrategy.universalScopeID,
      ),
      (event) => {
        const typedCustomEvent = event as unknown as {
          detail: es.EventSourceCustomEventDetail<EventSourcePayload>;
        };
        const { eventSrcPayload } = typedCustomEvent.detail;
        observer(eventSrcPayload, this);
      },
    );
  }
}

export interface PingFetchPayload {
  payloadIdentity: "ping";
}

export interface PingFetchRespPayload {
  payloadIdentity: "ping";
  fetchPayload: PingFetchPayload;
  fetchRespRawJSON: unknown;
}

export interface PingEventSourcePayload {
  payloadIdentity: "ping";
}

export function pingServerProxy(
  endpointSupplier: (baseURL?: string) => string,
):
  & f.FetchProxy<
    PingFetchPayload,
    PingFetchRespPayload,
    Record<string, unknown>
  >
  & es.EventSourceProxy<PingEventSourcePayload> {
  const payloadIdentity = "ping";
  const proxy:
    & f.FetchProxy<
      PingFetchPayload,
      PingFetchRespPayload,
      Record<string, unknown>
    >
    & es.EventSourceProxy<PingEventSourcePayload> = {
      fetch: (fetchStrategy, ctx) => {
        fetchStrategy.fetch(proxy, ctx);
      },
      prepareContext: (ctx) => ctx,
      prepareFetchPayload: (ctx) => {
        return {
          payloadIdentity,
          ...ctx,
        };
      },
      prepareFetchResponsePayload: (fetchPayload, fetchRespRawJSON) => {
        // assume that JSON processing has already been done, we just need to "type" it
        return {
          payloadIdentity: fetchPayload.payloadIdentity,
          fetchPayload,
          fetchRespRawJSON,
        } as PingFetchRespPayload;
      },
      prepareEventSourcePayload: (rawJSON) => {
        return rawJSON as PingEventSourcePayload;
      },
      prepareFetch: (baseURL, payload) => {
        return {
          endpoint: endpointSupplier(baseURL), // we accept the suggested endpoint
          requestInit: {
            method: "POST",
            body: JSON.stringify(payload),
          },
        };
      },
      observeFetch: (fetchStrategy, observer) => {
        fetchStrategy.observeFetchEvent(observer, payloadIdentity);
      },
      observeFetchResponse: (fetchStrategy, observer) => {
        fetchStrategy.observeFetchEventResponse(observer, payloadIdentity);
      },
      observeFetchRespError: (fetchStrategy, observer) => {
        fetchStrategy.observeFetchEventError(observer, payloadIdentity);
      },
      observeEventSource: (eventSrcStrategy, observer) => {
        eventSrcStrategy.observeEventSource(observer, payloadIdentity);
      },
    };
  return proxy;
}
