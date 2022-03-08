import * as govn from "../../../../lib/service-bus/governance.ts";

export const uaOpenWindowPayloadIdentity = "uaOpenWindow" as const;

export interface UserAgentOpenWindow {
  readonly payloadIdentity: typeof uaOpenWindowPayloadIdentity;
  readonly location: string;
  readonly target: string;
}

export function isUserAgentOpenWindow(o: unknown): o is UserAgentOpenWindow {
  if (govn.isIdentifiablePayload(o)) {
    if (o.payloadIdentity == uaOpenWindowPayloadIdentity) {
      return true;
    }
  }
  return false;
}

export function userAgentOpenWindow(
  sfi: Omit<UserAgentOpenWindow, "payloadIdentity">,
): UserAgentOpenWindow {
  return {
    payloadIdentity: uaOpenWindowPayloadIdentity,
    ...sfi,
  };
}

export function userAgentOpenWindowService(): govn.EventSourceService<
  UserAgentOpenWindow
> {
  const proxy: govn.EventSourceService<UserAgentOpenWindow> = {
    isEventSourcePayload: (
      rawJSON,
    ): rawJSON is UserAgentOpenWindow => {
      // TODO: we should really do some error checking
      return isUserAgentOpenWindow(rawJSON);
    },
    prepareEventSourcePayload: (rawJSON) => {
      return rawJSON as UserAgentOpenWindow;
    },
    observeEventSource: (eventSrcStrategy, observer) => {
      eventSrcStrategy.observeEventSource(
        (payload, ess) => {
          // EventSources are sent from server unsolicited so we need to type
          // it ourselves (this is different than the fetch models which are
          // already typed properly since they are not unsolicited)
          observer(proxy.prepareEventSourcePayload(payload), ess);
        },
        uaOpenWindowPayloadIdentity,
      );
    },
    observeEventSourceError: (eventSrcStrategy, observer) => {
      eventSrcStrategy.observeEventSourceError(
        observer,
        uaOpenWindowPayloadIdentity,
      );
    },
  };
  return proxy;
}
