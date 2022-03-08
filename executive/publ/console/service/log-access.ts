import * as govn from "../../../../lib/service-bus/governance.ts";
import * as s from "../../static.ts";

export const logAccessPayloadIdentity = "logAccess" as const;

export interface LogAccess extends s.StaticServedTarget {
  readonly payloadIdentity: typeof logAccessPayloadIdentity;
}

export function isLogAccess(o: unknown): o is LogAccess {
  if (govn.isIdentifiablePayload(o)) {
    if (o.payloadIdentity == logAccessPayloadIdentity) {
      return true;
    }
  }
  return false;
}

export function logAccess(
  sfi: Omit<LogAccess, "payloadIdentity">,
): LogAccess {
  return {
    payloadIdentity: logAccessPayloadIdentity,
    ...sfi,
  };
}

export function logAccessService(): govn.EventSourceService<
  LogAccess
> {
  const proxy: govn.EventSourceService<LogAccess> = {
    isEventSourcePayload: (
      rawJSON,
    ): rawJSON is LogAccess => {
      // TODO: we should really do some error checking
      return isLogAccess(rawJSON);
    },
    prepareEventSourcePayload: (rawJSON) => {
      return rawJSON as LogAccess;
    },
    observeEventSource: (eventSrcStrategy, observer) => {
      eventSrcStrategy.observeEventSource(
        (payload, ess) => {
          // EventSources are sent from server unsolicited so we need to type
          // it ourselves (this is different than the fetch models which are
          // already typed properly since they are not unsolicited)
          observer(proxy.prepareEventSourcePayload(payload), ess);
        },
        logAccessPayloadIdentity,
      );
    },
    observeEventSourceError: (eventSrcStrategy, observer) => {
      eventSrcStrategy.observeEventSourceError(
        observer,
        logAccessPayloadIdentity,
      );
    },
  };
  return proxy;
}
