export interface ShellCmdDryRunnable {
  readonly isDryRun?: boolean;
}

export interface ShellOutputConsumer<
  RO extends Deno.RunOptions,
  ROS extends ShellCmdRunOptionsSupplier<RO>,
> {
  (
    output: string,
    // deno-lint-ignore no-explicit-any
    ser: ShellExecuteResult<RO, ShellCmdRunOptionsSupplier<any>>,
  ): void;
}

export interface ShellCmdRunOptionsSupplier<RO extends Deno.RunOptions>
  extends ShellCmdDryRunnable {
  readonly runOptions: (
    inherit?: Partial<Deno.RunOptions>,
  ) => RO & ShellCmdDryRunnable;
  readonly consumeStdOut?: ShellOutputConsumer<
    RO,
    ShellCmdRunOptionsSupplier<RO>
  >;
  readonly consumeStdErr?: ShellOutputConsumer<
    RO,
    ShellCmdRunOptionsSupplier<RO>
  >;
  readonly reportRun?: (runOptions: RO, isDryRun?: boolean) => void;
  readonly reportError?: (error: Error, runOptions: RO) => void;
  readonly reportResult?: (
    // deno-lint-ignore no-explicit-any
    ser: ShellExecuteResult<RO, ShellCmdRunOptionsSupplier<any>>,
  ) => void;
  readonly decoder?: TextDecoder;
}

export interface ShellExecuteResult<
  RO extends Deno.RunOptions & ShellCmdDryRunnable,
  ROS extends ShellCmdRunOptionsSupplier<RO>,
> {
  readonly runOptions: RO;
  readonly runOptionsSupplier: ROS;
  readonly status: Deno.ProcessStatus;
  readonly isValid: (status: Deno.ProcessStatus) => boolean;
}

export interface Shell {
  readonly cmdRunOptions: <
    RO extends Deno.RunOptions & ShellCmdDryRunnable = Deno.RunOptions,
  >(
    cmd: string,
    inherit?: Partial<Deno.RunOptions> & ShellCmdDryRunnable,
  ) => RO;
  readonly execute: <
    RO extends Deno.RunOptions & ShellCmdDryRunnable = Deno.RunOptions,
    ROS extends ShellCmdRunOptionsSupplier<RO> = ShellCmdRunOptionsSupplier<RO>,
  >(
    ros: ROS,
    isValid?: (ser: ShellExecuteResult<RO, ROS>) => boolean,
  ) => Promise<ShellExecuteResult<RO, ROS> | undefined>;
}
