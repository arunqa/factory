import { colors, events } from "./deps.ts";
import * as id from "./identity.ts";

export async function eventEmitterCLI<
  // deno-lint-ignore no-explicit-any
  EE extends events.EventEmitter<any>,
  Context,
>(
  [name, ...args]: string[],
  ee: EE,
  options: {
    context?: (ee: EE, name: string, ...args: unknown[]) => Context | undefined;
    onTaskNotFound: (
      task: string,
      // deno-lint-ignore no-explicit-any
      handlers: Map<any, unknown>,
    ) => Promise<void>;
  } = {
    // deno-lint-ignore require-await
    onTaskNotFound: async (task, handlers) => {
      // deno-fmt-ignore
      console.error(colors.red(`task "${colors.yellow(task)}" not found, available: ${Array.from(handlers.keys()).map((t) => colors.green(t)).join(", ")}`));
    },
  },
): Promise<void> {
  if (!name) name = "inspect";
  if (name.indexOf("-") > 0) name = id.kebabCaseToCamelTaskName(name);

  // this is ugly but necessary due to events.EventEmitter making _events_ private :-(
  const handlers =
    // deno-lint-ignore no-explicit-any
    (ee as unknown as { ["_events_"]: Map<any, unknown> })["_events_"];

  if (handlers.has(name)) {
    const untypedEE = ee as unknown as {
      // deno-lint-ignore no-explicit-any
      emit: (name: any, ...args: unknown[]) => Promise<any>;
    };

    const context = options.context
      ? options.context(ee, name, ...args)
      : undefined;

    if (context) {
      // deno-lint-ignore no-explicit-any
      await untypedEE.emit(name as any, context, ...args);
    } else {
      // deno-lint-ignore no-explicit-any
      await untypedEE.emit(name as any, ...args);
    }
  } else {
    if (options?.onTaskNotFound) {
      await options.onTaskNotFound(name, handlers);
    }
  }
}
