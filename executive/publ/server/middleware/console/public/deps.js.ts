/**
 * deps.js.ts is a Typescript-friendly Deno-style strategy of bringing in
 * selective server-side Typescript functions and modules into client-side
 * browser and other user agent Javascript.
 *
 * deps.js.ts should be Deno bundled into universal.auto.js assuming that
 * universal.auto.js exists as a "twin". The existence of the universal.auto.js
 * (even an empty one) is a signal to the bundler to generate the *.auto.js file.
 * HTML and client-side source pulls in *.auto.js but since it's generated from
 * this file we know it will be correct.
 *
 * REMINDER: deps.auto.js must exist in order for deps.js.ts to be bundled.
 *           if it doesn't exist just create a empty file named deps.auto.js
 */

// export * as fingerprintJS from "https://openfpcdn.io/fingerprintjs/v3.3.3/esm.min.js";
export * from "https://raw.githubusercontent.com/ihack2712/eventemitter/1.2.4/mod.ts";
export * from "https://unpkg.com/effector@22.2.0/effector.mjs";

export * from "../../../../../../lib/reflect/mod.ts";
export * from "../../../../../../lib/text/human.ts";
export * from "../../../../../../lib/text/whitespace.ts";
export * from "../../../../../../lib/conf/flexible-args.ts";
export * from "../../../../../../lib/text/detect-route.ts";
export * from "../../../../../../lib/service-bus/core/mod.ts";
export * from "../../../../../../lib/service-bus/service/ping.ts";
export * from "../../../../../../lib/service-bus/service/file-impact.ts";
export * from "../service/open-user-agent-window.ts";
export * from "../../../../../../lib/presentation/custom-element/badge/mod.ts";
export * from "../../../../../../lib/presentation/dom/markdown-it.js";

import { createDomain } from "https://unpkg.com/effector@22.2.0/effector.mjs";
import { humanPath } from "../../../../../../lib/text/human.ts";
import { LocationSupplier } from "../../../../../../governance/module.ts";
import * as sb from "../../../../../../lib/service-bus/core/mod.ts";
import * as badge from "../../../../../../lib/presentation/custom-element/badge/mod.ts";

export const editableFileRedirectURL = (absPath: string) => {
  let src = absPath;
  if (src.startsWith("file://")) {
    src = src.substring(7);
    return [`/workspace/editor-redirect/abs${src}`, src];
  } else {
    if (absPath.startsWith("/")) {
      return [`/workspace/editor-redirect/abs${absPath}`, absPath];
    } else {
      return [src, src];
    }
  }
};

export const editableFileRefHTML = (
  absPath: string,
  humanizeLength?: number,
) => {
  const [href, label] = editableFileRedirectURL(absPath);
  return humanizeLength
    ? humanPath(
      label,
      humanizeLength,
      (basename) =>
        `<a href="${href}" class="fw-bold" title="${absPath}">${basename}</a>`,
    )
    : `<a href="${href}">${label}</a>`;
};

export const locationEditorRedirectURL = (location: LocationSupplier) =>
  editableFileRedirectURL(location.moduleImportMetaURL);

export const locationEditorHTML = (
  location: LocationSupplier,
  humanizeLength?: number,
) => {
  const [href, label] = locationEditorRedirectURL(location);
  return humanizeLength
    ? humanPath(
      label,
      humanizeLength,
      (basename) =>
        `<a href="${href}" class="fw-bold" title="${location.moduleImportMetaURL}">${basename}</a>`,
    )
    : `<a href="${href}">${label}</a>`;
};

// TODO[essential]: figure out how to properly type createDomain in Deno
// deno-lint-ignore no-explicit-any
export const projectDomain: any = createDomain("project");
export const projectInitFx = projectDomain.createEffect(async () =>
  (await fetch("/publication/inspect/project.json")).json()
);

// TODO[essential,governance]: type the Project in publication-middleware.ts and use it here
export const $project = projectDomain.createStore(null).on(
  projectInitFx.doneData,
  (_: unknown, project: Record<string, unknown>) => project,
);

// TODO[essential]: figure out how to properly type createDomain in Deno
// deno-lint-ignore no-explicit-any
export const serviceBusDomain: any = createDomain("serviceBus");
// deno-lint-ignore require-await
export const consoleServiceBusInitFx = serviceBusDomain.createEffect(async (
  {
    eventSource,
    presentation,
    diagnostics,
  }: {
    eventSource: (
      esURL: string,
      // deno-lint-ignore no-explicit-any
      serviceBusOnMessage: (event: MessageEvent<any>) => void,
      // TODO[essential]: figure out how to properly type EventSource so any is not required :(
      // deno-lint-ignore no-explicit-any
    ) => any;
    presentation: badge.BadgenBlock;
    diagnostics: { verbose: boolean };
  },
) => {
  const baseURL = "/console";
  const userAgentFingerprint = window.location.toString();
  return new sb.ServiceBus(sb.serviceBusArguments({
    fetchBaseURL: `${baseURL}/user-agent-bus`,
    esTunnels: function* (serviceBusOnMessage) {
      const esURL = `${baseURL}/sse/tunnel`;
      const esEndpointValidator = sb.typicalConnectionValidator(
        `${baseURL}/sse/ping`,
      );
      // deno-lint-ignore no-explicit-any
      const eventSourceFactory: sb.EventSourceFactory<any> = {
        construct: (esURL) => eventSource(esURL, serviceBusOnMessage),
      };
      const consoleTunnel = new sb.EventSourceTunnel({
        esURL,
        esEndpointValidator,
        eventSourceFactory,
        userAgentFingerprint,
        options: {
          onConnStateChange: (active, previous, tunnel) => {
            const escn = sb.eventSourceConnNarrative(tunnel);
            if (diagnostics.verbose) {
              console.log(
                "connection state",
                escn.summary,
                escn.summaryHint,
                active,
                previous,
              );
            }
            presentation.render({
              content: {
                label: "Tunnel",
                status: escn.summary,
                title: escn.summaryHint,
                color: escn.color,
              },
              autoDisplay: true,
            });
          },
          onReconnStateChange: (active, previous, _reconnStrategy, tunnel) => {
            const escn = sb.eventSourceConnNarrative(tunnel);
            if (diagnostics.verbose) {
              console.log(
                "reconnection state",
                active,
                previous,
                escn.summary,
                escn.summaryHint,
              );
            }
            presentation.render({
              content: {
                label: "Tunnel",
                status: escn.summary,
                title: escn.summaryHint,
                color: escn.color,
              },
              autoDisplay: true,
            });
          },
        },
      });
      consoleTunnel.init();
      yield consoleTunnel;
    },
  }));
});

export const $consoleServiceBus = serviceBusDomain.createStore(null).on(
  consoleServiceBusInitFx.doneData,
  (_: unknown, serviceBus: sb.ServiceBus) => serviceBus,
);
