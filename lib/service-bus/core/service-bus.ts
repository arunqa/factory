import * as govn from "../governance.ts";
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
  implements govn.FetchStrategy, govn.EventSourceStrategy {
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
    uase: govn.FetchService<UserAgentPayload, ServerRespPayload, Context>,
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
      & govn.FetchCustomEventDetail<Context>
      & govn.FetchInit
      & govn.FetchPayloadSupplier<UserAgentPayload> = {
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
      .then((resp) => {
        if (resp.ok) {
          resp.json().then((fetchRespRawJSON) => {
            const fetchRespPayload = uase.prepareFetchResponsePayload(
              fetchPayload,
              fetchRespRawJSON,
              ctx,
              this,
            );
            const fetchRespDetail:
              & govn.FetchCustomEventDetail<Context>
              & govn.FetchPayloadSupplier<UserAgentPayload>
              & govn.FetchRespPayloadSupplier<ServerRespPayload> = {
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
          });
        } else {
          const fetchErrorDetail:
            & govn.FetchCustomEventDetail<Context>
            & govn.FetchInit
            & govn.FetchPayloadSupplier<UserAgentPayload>
            & govn.ErrorSupplier = {
              ...fetchInit,
              fetchPayload,
              context: ctx,
              error: new Error(
                `${fetchInit.endpoint} invalid HTTP status ${resp.status} (${resp.statusText})`,
              ),
              fetchStrategy: this,
            };
          this.dispatchNamingStrategyEvent(
            fetchPayload,
            this.args.eventNameStrategy.fetchError,
            fetchErrorDetail,
          );
        }
      }).catch((error) => {
        const fetchErrorDetail:
          & govn.FetchCustomEventDetail<Context>
          & govn.FetchInit
          & govn.FetchPayloadSupplier<UserAgentPayload>
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
    observer: govn.FetchObserver<FetchPayload, Context>,
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
            & govn.FetchCustomEventDetail<Context>
            & govn.FetchInit
            & govn.FetchPayloadSupplier<FetchPayload>;
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
    observer: govn.FetchResponseObserver<
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
            & govn.FetchCustomEventDetail<Context>
            & govn.FetchRespPayloadSupplier<FetchRespPayload>
            & govn.FetchPayloadSupplier<FetchPayload>;
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
    observer: govn.FetchErrorObserver<
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
            & govn.FetchCustomEventDetail<Context>
            & govn.FetchInit
            & govn.FetchPayloadSupplier<FetchPayload>
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
    observer: govn.EventSourceObserver<EventSourcePayload>,
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
    observer: govn.EventSourceErrorObserver<EventSourcePayload>,
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
