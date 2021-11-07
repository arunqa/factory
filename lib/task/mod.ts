import { colors } from "./deps.ts";

// TODO: integrate [udd](https://github.com/hayd/deno-udd) as a built-in task
//       so `find . -name "*.ts" | xargs udd` is not required outside of Deno
// TODO: wrap [xargs](https://github.com/tarruda/node-xargs) in this module?
// TODO: wrap [deno xeval](https://deno.land/std/examples/xeval.ts) in this module?
//       [elaboration](https://stefanbuck.com/blog/hidden-superpower-deno-xeval)

export interface TaskContext<R extends Runnable> {
  readonly task: R;
  readonly tasks: Tasks;
}

export type TaskRunner = <R extends Runnable>(
  ctx: TaskContext<R>,
  ...args: unknown[]
) => Promise<void>;

export interface TaskRunnerSupplier {
  readonly exec: TaskRunner;
  readonly identity?: string;
}

export interface IdentifiableTaskRunnerSupplier extends TaskRunnerSupplier {
  readonly identity: string;
}

export type Runnable = TaskRunner | TaskRunnerSupplier;

export interface Tasks {
  [index: string]: Runnable;
}

export interface RunOptions {
  readonly onTaskNotFound?: (task: string, tasks: Tasks) => Promise<void>;
}

export const kebabCaseToCamelTaskName = (text: string) =>
  // find one or more characters after - and replace with single uppercase
  text.replace(/-./g, (x) => x.toUpperCase()[1]);

export const camelCaseToKebabTaskName = (text: string) =>
  // find one or more uppercase characters and separate with -
  text.replace(/[A-Z]+/g, (match: string) => `-${match}`)
    .toLocaleLowerCase();

export async function run(
  [name, ...args]: string[],
  tasks: Tasks,
  options: RunOptions = {
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
  const runnable = tasks[name] || tasks[kebabCaseToCamelTaskName(name)];
  if (runnable) {
    if (typeof runnable === "function") {
      // deno-lint-ignore no-explicit-any
      const ctx: TaskContext<any> = {
        task: runnable,
        tasks,
      };
      await runnable(ctx, ...args);
    } else {
      // deno-lint-ignore no-explicit-any
      const ctx: TaskContext<any> = {
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

export const inspect: IdentifiableTaskRunnerSupplier = {
  identity: "inspect",
  // deno-lint-ignore require-await
  exec: async (ctx) => {
    for (const name of Object.keys(ctx.tasks)) {
      const alias = camelCaseToKebabTaskName(name);
      console.info(
        colors.gray(
          //deno-fmt-ignore
          `${colors.yellow(name)}${alias != name ? ` or ${colors.yellow(alias)}` : ''} (${colors.gray(Deno.inspect(ctx.tasks[name], {colors: true}))})`,
        ),
      );
    }
  },
};

export const defaultTasks: Tasks = {
  [inspect.identity]: inspect,
};
