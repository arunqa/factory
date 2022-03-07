import * as mod from "./mod.ts";

export interface BinaryStateProxyFetchPayload {
  payloadIdentity: string;
  state: "checked" | "unchecked";
}

export interface BinaryStateProxyFetchRespPayload {
  payloadIdentity: string;
  fetchPayload: BinaryStateProxyFetchPayload;
  fetchRespRawJSON: unknown;
}

export interface BinaryStateProxyEventSourcePayload {
  payloadIdentity: string;
  state: "checked" | "unchecked";
}

export function binaryStateServerProxy(
  endpointSupplier: (baseURL?: string) => string,
  identitySupplier: () => string,
  stateSupplier: () => "checked" | "unchecked",
):
  & mod.FetchProxy<
    BinaryStateProxyFetchPayload,
    BinaryStateProxyFetchRespPayload,
    Record<string, unknown>
  >
  & mod.EventSourceProxy<BinaryStateProxyEventSourcePayload> {
  const proxy:
    & mod.FetchProxy<
      BinaryStateProxyFetchPayload,
      BinaryStateProxyFetchRespPayload,
      Record<string, unknown>
    >
    & mod.EventSourceProxy<BinaryStateProxyEventSourcePayload> = {
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
        } as BinaryStateProxyFetchRespPayload;
      },
      prepareEventSourcePayload: (rawJSON) => {
        return rawJSON as BinaryStateProxyEventSourcePayload;
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
    };
  return proxy;
}
