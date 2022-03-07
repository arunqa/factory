import * as govn from "./governance.ts";
import * as f from "./fetch.ts";
import * as sse from "./event-source.ts";

export interface ServicBusEventSourceTunnelsSupplier {
  (onMessage: (event: MessageEvent) => void): Generator<sse.EventSourceTunnel>;
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
    readonly eventSourceError: govn.EventTargetEventNameStrategy;
    readonly eventSourceInvalidPayload: govn.EventTargetEventNameStrategy;
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
        const payloadSpecificName = `fetch-${identity}`;
        const universalName = `fetch`;
        return {
          payloadSpecificName,
          universalName,
          selectedName: identity == universalScopeID
            ? universalName
            : payloadSpecificName,
        };
      },
      fetchResponse: (payload) => {
        const identity = typeof payload === "string"
          ? payload
          : payload.payloadIdentity;
        const payloadSpecificName = `fetch-response-${identity}`;
        const universalName = `fetch-response`;
        return {
          payloadSpecificName,
          universalName,
          selectedName: identity == universalScopeID
            ? universalName
            : payloadSpecificName,
        };
      },
      fetchError: (payload) => {
        const identity = typeof payload === "string"
          ? payload
          : payload.payloadIdentity;
        const payloadSpecificName = `fetch-error-${identity}`;
        const universalName = `fetch-error`;
        return {
          payloadSpecificName,
          universalName,
          selectedName: identity == universalScopeID
            ? universalName
            : payloadSpecificName,
        };
      },
      eventSource: (payload) => {
        const identity = typeof payload === "string"
          ? payload
          : payload.payloadIdentity;
        const payloadSpecificName = `event-source-${identity}`;
        const universalName = `event-source`;
        return {
          payloadSpecificName,
          universalName,
          selectedName: identity == universalScopeID
            ? universalName
            : payloadSpecificName,
        };
      },
      eventSourceError: (payload) => {
        const identity = typeof payload === "string"
          ? payload
          : payload.payloadIdentity;
        const payloadSpecificName = `event-source-error-${identity}`;
        const universalName = `event-source-error`;
        return {
          payloadSpecificName,
          universalName,
          selectedName: identity == universalScopeID
            ? universalName
            : payloadSpecificName,
        };
      },
      eventSourceInvalidPayload: () => {
        // this is a special error which cannot be payload-specific because
        // it indicates an unsolicited server sent event could not be identified
        // as something we can handle (it will be ignored)
        const universalName = `event-source-invalid-payload`;
        return {
          payloadSpecificName: undefined,
          universalName,
          selectedName: universalName,
        };
      },
    },
    ...options,
  };
}

export class ServiceBus extends EventTarget
  implements f.FetchStrategy, sse.EventSourceStrategy {
  readonly tunnels: sse.EventSourceTunnel[] = [];
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
        const esDetail:
          // deno-lint-ignore no-explicit-any
          sse.EventSourceCustomEventDetail<any> = {
            eventSrcPayload,
          };
        this.dispatchNamingStrategyEvent(
          eventSrcPayload,
          govn.isIdentifiablePayload(eventSrcPayload)
            ? this.args.eventNameStrategy.eventSource
            : this.args.eventNameStrategy.eventSourceInvalidPayload,
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
    const names = strategy(id);
    if (names.payloadSpecificName) {
      this.dispatchEvent(
        new CustomEvent(names.payloadSpecificName, { detail }),
      );
    }
    this.dispatchEvent(
      new CustomEvent(names.universalName, {
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
    const names = this.args.eventNameStrategy.fetch(
      fetchPayloadID ?? this.args.eventNameStrategy.universalScopeID,
    );
    this.addEventListener(
      names.selectedName,
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
    const names = this.args.eventNameStrategy.fetchResponse(
      fetchRespPayloadID ?? this.args.eventNameStrategy.universalScopeID,
    );
    this.addEventListener(
      names.selectedName,
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
    const names = this.args.eventNameStrategy.fetchError(
      fetchPayloadID ?? this.args.eventNameStrategy.universalScopeID,
    );
    this.addEventListener(
      names.selectedName,
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
    observer: sse.EventSourceObserver<EventSourcePayload>,
    payloadID?: govn.PayloadIdentity,
  ): void {
    const names = this.args.eventNameStrategy.eventSource(
      payloadID ?? this.args.eventNameStrategy.universalScopeID,
    );
    this.addEventListener(
      names.selectedName,
      (event) => {
        const typedCustomEvent = event as unknown as {
          detail: sse.EventSourceCustomEventDetail<EventSourcePayload>;
        };
        const { eventSrcPayload } = typedCustomEvent.detail;
        observer(eventSrcPayload, this);
      },
    );
  }

  observeEventSourceError<
    EventSourcePayload extends govn.IdentifiablePayload,
  >(
    observer: sse.EventSourceErrorObserver<EventSourcePayload>,
    payloadID?: govn.PayloadIdentity,
  ) {
    const names = this.args.eventNameStrategy.eventSourceError(
      payloadID ?? this.args.eventNameStrategy.universalScopeID,
    );
    this.addEventListener(
      names.selectedName,
      (event) => {
        const typedCustomEvent = event as unknown as {
          // deno-lint-ignore no-explicit-any
          detail: sse.EventSourceCustomEventDetail<any> & govn.ErrorSupplier;
        };
        const { eventSrcPayload, error } = typedCustomEvent.detail;
        observer(error, eventSrcPayload, this);
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
  & sse.EventSourceProxy<PingEventSourcePayload> {
  const payloadIdentity = "ping";
  const proxy:
    & f.FetchProxy<
      PingFetchPayload,
      PingFetchRespPayload,
      Record<string, unknown>
    >
    & sse.EventSourceProxy<PingEventSourcePayload> = {
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
      isEventSourcePayload: (_rawJSON): _rawJSON is PingEventSourcePayload => {
        // TODO: we should really do some error checking
        return true;
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
        eventSrcStrategy.observeEventSource(
          (payload, ess) => {
            // EventSources are sent from server unsolicited so we need to type
            // it ourselves (this is different than the fetch models which are
            // already typed properly since they are not unsolicited)
            observer(proxy.prepareEventSourcePayload(payload), ess);
          },
          payloadIdentity,
        );
      },
      observeEventSourceError: (eventSrcStrategy, observer) => {
        eventSrcStrategy.observeEventSourceError(observer, payloadIdentity);
      },
    };
  return proxy;
}
