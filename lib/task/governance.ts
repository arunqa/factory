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
