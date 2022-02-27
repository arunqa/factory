import * as colors from "https://deno.land/std@0.123.0/fmt/colors.ts";
import * as rfGovn from "../../governance/mod.ts";
import * as rfStd from "../../core/std/mod.ts";
import * as rflHealth from "../../lib/health/mod.ts";

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

export const emitServiceHealthComponentsToConsole = async () => {
  // any proxies or other components that register themselves will be iterable
  const details = await window.observability.serviceHealthComponentsChecks();
  for (const entry of Object.entries(details)) {
    const [category, statuses] = entry;
    for (const s of statuses) {
      if (s.status === "pass") {
        console.log(
          colors.gray(`[${category}]`),
          colors.green(`${s.componentId} ${colors.brightGreen(s.status)}`),
        );
      } else {
        const status = s as rflHealth.UnhealthyServiceHealthComponentStatus;
        console.log(
          colors.gray(`[${category}]`),
          `${
            colors.red(`${status.componentId} ${colors.brightRed(s.status)}`)
          } ${
            Deno.inspect(status.links, {
              colors: true,
              depth: undefined,
              compact: false,
            })
          } ${colors.gray(status.output)}`,
        );
      }
    }
  }
};
