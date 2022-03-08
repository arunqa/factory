import * as govn from "../governance.ts";

export const serverFileImpactPayloadIdentity = "serverFileImpact" as const;

export interface MutatableServerFileImpact {
  readonly payloadIdentity: typeof serverFileImpactPayloadIdentity;
  // the absolute path and filename of the file that was impacted on the server
  serverFsAbsPathAndFileName: string;
  // if this file was being served by the server, the file's relative URL in user agent
  relativeUserAgentLocation?: string;
}

// deno-lint-ignore no-empty-interface
export interface ServerFileImpact extends Readonly<MutatableServerFileImpact> {
}

export function isServerFileImpact(o: unknown): o is ServerFileImpact {
  if (govn.isIdentifiablePayload(o)) {
    if (o.payloadIdentity == serverFileImpactPayloadIdentity) {
      return true;
    }
  }
  return false;
}

export function serverFileImpact(
  sfi: Omit<ServerFileImpact, "payloadIdentity">,
): ServerFileImpact {
  return {
    payloadIdentity: serverFileImpactPayloadIdentity,
    ...sfi,
  };
}

export function serverFileImpactService(): govn.EventSourceService<
  ServerFileImpact
> {
  const proxy: govn.EventSourceService<ServerFileImpact> = {
    isEventSourcePayload: (
      rawJSON,
    ): rawJSON is ServerFileImpact => {
      // TODO: we should really do some error checking
      return isServerFileImpact(rawJSON);
    },
    prepareEventSourcePayload: (rawJSON) => {
      return rawJSON as ServerFileImpact;
    },
    observeEventSource: (eventSrcStrategy, observer) => {
      eventSrcStrategy.observeEventSource(
        (payload, ess) => {
          // EventSources are sent from server unsolicited so we need to type
          // it ourselves (this is different than the fetch models which are
          // already typed properly since they are not unsolicited)
          observer(proxy.prepareEventSourcePayload(payload), ess);
        },
        serverFileImpactPayloadIdentity,
      );
    },
    observeEventSourceError: (eventSrcStrategy, observer) => {
      eventSrcStrategy.observeEventSourceError(
        observer,
        serverFileImpactPayloadIdentity,
      );
    },
  };
  return proxy;
}
