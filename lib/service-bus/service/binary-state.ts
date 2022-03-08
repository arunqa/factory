import * as govn from "../governance.ts";

export interface BinaryStateServiceFetchPayload {
  payloadIdentity: string;
  state: "checked" | "unchecked";
}

export interface BinaryStateServiceFetchRespPayload {
  payloadIdentity: string;
  fetchPayload: BinaryStateServiceFetchPayload;
  fetchRespRawJSON: unknown;
}

export interface BinaryStateServiceEventSourcePayload {
  payloadIdentity: string;
  state: "checked" | "unchecked";
}

export function binaryStateService(
  endpointSupplier: (baseURL?: string) => string,
  identitySupplier: () => string,
  stateSupplier: () => "checked" | "unchecked",
):
  & govn.FetchService<
    BinaryStateServiceFetchPayload,
    BinaryStateServiceFetchRespPayload,
    Record<string, unknown>
  >
  & govn.EventSourceService<BinaryStateServiceEventSourcePayload> {
  const proxy:
    & govn.FetchService<
      BinaryStateServiceFetchPayload,
      BinaryStateServiceFetchRespPayload,
      Record<string, unknown>
    >
    & govn.EventSourceService<BinaryStateServiceEventSourcePayload> = {
      fetch: (fetchStrategy, ctx) => {
        fetchStrategy.fetch(proxy, ctx);
      },
      prepareContext: (ctx) => ctx,
      prepareFetchPayload: (ctx) => {
        return {
          payloadIdentity: identitySupplier(),
          state: stateSupplier(),
          ...ctx,
        };
      },
      prepareFetchResponsePayload: (fetchPayload, fetchRespRawJSON) => {
        // assume that JSON processing has already been done, we just need to "type" it
        return {
          payloadIdentity: fetchPayload.payloadIdentity,
          fetchPayload,
          fetchRespRawJSON,
        } as BinaryStateServiceFetchRespPayload;
      },
      isEventSourcePayload: (
        _rawJSON,
      ): _rawJSON is BinaryStateServiceEventSourcePayload => {
        // TODO: we should really do some error checking
        return true;
      },
      prepareEventSourcePayload: (rawJSON) => {
        return rawJSON as BinaryStateServiceEventSourcePayload;
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
        fetchStrategy.observeFetchEvent(observer, identitySupplier());
      },
      observeFetchResponse: (fetchStrategy, observer) => {
        fetchStrategy.observeFetchEventResponse(observer, identitySupplier());
      },
      observeFetchRespError: (fetchStrategy, observer) => {
        fetchStrategy.observeFetchEventError(observer, identitySupplier());
      },
      observeEventSource: (eventSrcStrategy, observer) => {
        eventSrcStrategy.observeEventSource(observer, identitySupplier());
      },
      observeEventSourceError: (eventSrcStrategy, observer) => {
        eventSrcStrategy.observeEventSourceError(observer, identitySupplier());
      },
    };
  return proxy;
}
