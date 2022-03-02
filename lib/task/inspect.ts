import { colors, events } from "./deps.ts";
import * as id from "./identity.ts";

// deno-lint-ignore no-explicit-any
export function eeInspectorTask<EE extends events.EventEmitter<any>>(ee: EE) {
  return () => {
    // this is ugly but necessary due to events.EventEmitter making _events_ private :-(
    const handlers =
      // deno-lint-ignore no-explicit-any
      (ee as unknown as { ["_events_"]: Map<any, unknown> })["_events_"];
    for (const entry of handlers) {
      const [name, handlers] = entry;
      const alias = id.camelCaseToKebabTaskName(name);
      console.info(
        colors.gray(
          //deno-fmt-ignore
          `${colors.yellow(alias)}${alias != name ? ` ${colors.dim('or')} ${colors.gray(name)}` : ''} (${colors.dim(Deno.inspect(handlers))})`,
        ),
      );
    }
  };
}
