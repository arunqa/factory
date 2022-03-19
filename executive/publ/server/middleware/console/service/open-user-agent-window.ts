import * as govn from "../../../../../../lib/service-bus/governance.ts";

export const uaOpenWindowPayloadIdentity = "uaOpenWindow" as const;

export interface UserAgentOpenWindow {
  readonly payloadIdentity: typeof uaOpenWindowPayloadIdentity;
  readonly location: string;
  readonly target: string;
}

export interface ValidateUserAgentOpenWindow
  extends govn.ValidatedPayload, UserAgentOpenWindow {
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
  ValidateUserAgentOpenWindow
> {
  const service:
    & govn.EventSourceService<ValidateUserAgentOpenWindow>
    & govn.WebSocketReceiveService<ValidateUserAgentOpenWindow> = {
      serviceIdentity: uaOpenWindowPayloadIdentity,
      payloadIdentity: uaOpenWindowPayloadIdentity,
      isEventSourcePayload: (
        rawJSON,
      ): rawJSON is ValidateUserAgentOpenWindow => {
        // TODO: we should really do some error checking
        return isUserAgentOpenWindow(rawJSON);
      },
      prepareEventSourcePayload: (rawJSON) => {
        return rawJSON as ValidateUserAgentOpenWindow;
      },
      isWebSocketReceivePayload: (
        _rawJSON,
      ): _rawJSON is ValidateUserAgentOpenWindow => true,
      prepareWebSocketReceivePayload: (rawJSON) => {
        // TODO: we should really do some error checking
        const validated = rawJSON as govn.MutatableValidatedPayload;
        validated.isValidatedPayload = true;
        validated.isValidPayload = true;
        return validated as ValidateUserAgentOpenWindow;
      },
    };
  return service;
}
