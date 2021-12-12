import * as rfGovn from "../../governance/mod.ts";
import * as rfStd from "../../core/std/mod.ts";

declare global {
  interface Window {
    observability: rfStd.Observability;
  }
}

if (!window.observability) {
  // this is globally available so that proxies can register themselves
  window.observability = new rfStd.Observability(
    new rfGovn.ObservabilityEventsEmitter(),
  );
}
