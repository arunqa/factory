import { colors } from "./deps.ts";

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
  const runnable = tasks[name];
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
      console.info(
        colors.gray(
          //deno-fmt-ignore
          `${colors.yellow(name)} (${colors.gray(Deno.inspect(ctx.tasks[name], {colors: true}))})`,
        ),
      );
    }
  },
};

export const defaultTasks: Tasks = {
  [inspect.identity]: inspect,
};
