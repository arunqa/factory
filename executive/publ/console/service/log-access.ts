import * as govn from "../../../../lib/service-bus/governance.ts";
import * as s from "../../static.ts";

export const logAccessPayloadIdentity = "logAccess" as const;

export interface LogAccess extends s.StaticServedTarget {
  readonly payloadIdentity: typeof logAccessPayloadIdentity;
}

export interface ValidatedLogAccess extends LogAccess, govn.ValidatedPayload {
}

export function isLogAccess(o: unknown): o is LogAccess {
  if (govn.isIdentifiablePayload(o)) {
    if (o.payloadIdentity == logAccessPayloadIdentity) {
      return true;
    }
  }
  return false;
}

export function logAccess(sfi: s.StaticServedTarget): LogAccess {
  return {
    payloadIdentity: logAccessPayloadIdentity,
    ...sfi,
  };
}

export function logAccessService(): govn.EventSourceService<
  ValidatedLogAccess
> {
  const service:
    & govn.EventSourceService<ValidatedLogAccess>
    & govn.WebSocketReceiveService<ValidatedLogAccess> = {
      serviceIdentity: logAccessPayloadIdentity,
      payloadIdentity: logAccessPayloadIdentity,
      isEventSourcePayload: (
        rawJSON,
      ): rawJSON is ValidatedLogAccess => {
        // TODO: we should really do some error checking
        return isLogAccess(rawJSON);
      },
      prepareEventSourcePayload: (rawJSON) => {
        // TODO: we should really do some error checking
        const validated = rawJSON as govn.MutatableValidatedPayload;
        validated.isValidatedPayload = true;
        validated.isValidPayload = true;
        return validated as ValidatedLogAccess;
      },
      // TODO: we should really do some error checking
      isWebSocketReceivePayload: (
        _rawJSON,
      ): _rawJSON is ValidatedLogAccess => true,
      prepareWebSocketReceivePayload: (rawJSON) => {
        // TODO: we should really do some error checking
        const validated = rawJSON as govn.MutatableValidatedPayload;
        validated.isValidatedPayload = true;
        validated.isValidPayload = true;
        return validated as ValidatedLogAccess;
      },
    };
  return service;
}
