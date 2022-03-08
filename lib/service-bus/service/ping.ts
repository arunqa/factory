import * as govn from "../governance.ts";

export const pingPayloadIdentity = "ping" as const;

export interface PingFetchPayload {
  payloadIdentity: typeof pingPayloadIdentity;
}

export interface PingFetchRespPayload {
  payloadIdentity: typeof pingPayloadIdentity;
  fetchPayload: PingFetchPayload;
  fetchRespRawJSON: unknown;
}

export interface PingEventSourcePayload {
  payloadIdentity: typeof pingPayloadIdentity;
}

export function isPingPayload(
  o: unknown,
): o is PingFetchPayload | PingEventSourcePayload {
  if (govn.isIdentifiablePayload(o)) {
    if (o.payloadIdentity == pingPayloadIdentity) {
      return true;
    }
  }
  return false;
}

export function pingPayload(): PingFetchPayload | PingEventSourcePayload {
  return { payloadIdentity: pingPayloadIdentity };
}

export function pingService(
  endpointSupplier: (baseURL?: string) => string,
):
  & govn.FetchService<
    PingFetchPayload,
    PingFetchRespPayload,
    Record<string, unknown>
  >
  & govn.EventSourceService<PingEventSourcePayload> {
  const proxy:
    & govn.FetchService<
      PingFetchPayload,
      PingFetchRespPayload,
      Record<string, unknown>
    >
    & govn.EventSourceService<PingEventSourcePayload> = {
      fetch: (fetchStrategy, ctx) => {
        fetchStrategy.fetch(proxy, ctx);
      },
      prepareContext: (ctx) => ctx,
      prepareFetchPayload: (ctx) => {
        return {
          payloadIdentity: pingPayloadIdentity,
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
        fetchStrategy.observeFetchEvent(observer, pingPayloadIdentity);
      },
      observeFetchResponse: (fetchStrategy, observer) => {
        fetchStrategy.observeFetchEventResponse(observer, pingPayloadIdentity);
      },
      observeFetchRespError: (fetchStrategy, observer) => {
        fetchStrategy.observeFetchEventError(observer, pingPayloadIdentity);
      },
      observeEventSource: (eventSrcStrategy, observer) => {
        eventSrcStrategy.observeEventSource(
          (payload, ess) => {
            // EventSources are sent from server unsolicited so we need to type
            // it ourselves (this is different than the fetch models which are
            // already typed properly since they are not unsolicited)
            observer(proxy.prepareEventSourcePayload(payload), ess);
          },
          pingPayloadIdentity,
        );
      },
      observeEventSourceError: (eventSrcStrategy, observer) => {
        eventSrcStrategy.observeEventSourceError(observer, pingPayloadIdentity);
      },
    };
  return proxy;
}
