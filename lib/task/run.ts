import { colors } from "./deps.ts";
import * as govn from "./governance.ts";
import * as id from "./identity.ts";
import * as i from "./inspect.ts";

export async function run(
  [name, ...args]: string[],
  tasks: govn.Tasks,
  options: govn.RunOptions = {
    // deno-lint-ignore require-await
    onTaskNotFound: async (task, tasks) => {
      console.error(
        colors.red(
          `task "${colors.yellow(task)}" not found (available: ${
            Object.keys(tasks).map((t) => colors.green(t)).join(", ")
          })`,
        ),
      );
    },
  },
): Promise<void> {
  if (!name) name = i.inspect.identity;
  const runnable = tasks[name] || tasks[id.kebabCaseToCamelTaskName(name)];
  if (runnable) {
    if (typeof runnable === "function") {
      // deno-lint-ignore no-explicit-any
      const ctx: govn.TaskContext<any> = {
        task: runnable,
        tasks,
      };
      await runnable(ctx, ...args);
    } else {
      // deno-lint-ignore no-explicit-any
      const ctx: govn.TaskContext<any> = {
        task: { identity: name, ...runnable },
        tasks,
      };
      await runnable.exec(ctx, ...args);
    }
  } else {
    if (options?.onTaskNotFound) {
      await options.onTaskNotFound(name, tasks);
    }
  }
}
