import { safety } from "./deps.ts";
import * as govn from "./governance.ts";

declare global {
  interface Window {
    shell: govn.Shell;
  }
}

const isDryRunnable = safety.typeGuard<govn.ShellCmdDryRunnable>("isDryRun");

export class TypicalShell implements govn.Shell {
  // split components of the command with double-quotes support
  readonly splitCmdRegExp = /[^\s"]+|"([^"]*)"/gi;
  readonly decoder = new TextDecoder();

  constructor(
    readonly defaults?: Omit<
      govn.ShellCmdRunOptionsSupplier<Deno.RunOptions>,
      "runOptions"
    >,
  ) {
  }

  isDryRun(...test: unknown[]): boolean {
    for (const o of test) {
      if (isDryRunnable(o) && o.isDryRun) return true;
    }
    return false;
  }

  commandComponents(command: string): string[] {
    const components = [];

    let match: RegExpExecArray | null;
    do {
      //Each call to exec returns the next regex match as an array
      match = this.splitCmdRegExp.exec(command);
      if (match != null) {
        //Index 1 in the array is the captured group if it exists
        //Index 0 is the matched text, which we use if no captured group exists
        components.push(match[1] ? match[1] : match[0]);
      }
    } while (match != null);

    return components;
  }

  cmdRunOptions<RO extends Deno.RunOptions = Deno.RunOptions>(
    cmd: string,
    inherit?: Partial<Deno.RunOptions> & govn.ShellCmdDryRunnable,
  ): RO {
    return {
      cmd: this.commandComponents(cmd),
      ...inherit,
    } as RO;
  }

  async execute<
    RO extends Deno.RunOptions & govn.ShellCmdDryRunnable = Deno.RunOptions,
    ROS extends govn.ShellCmdRunOptionsSupplier<RO> =
      govn.ShellCmdRunOptionsSupplier<RO>,
  >(
    ros: ROS,
    isValid?: (ser: govn.ShellExecuteResult<RO, ROS>) => boolean,
  ): Promise<govn.ShellExecuteResult<RO, ROS> | undefined> {
    const runOptions = ros.runOptions({
      stdout: "piped",
      stderr: "piped",
    });

    const isDryRun = this.isDryRun(runOptions, ros);
    const defaults = this.defaults;
    const reportRun = ros.reportRun || defaults?.reportRun;
    if (reportRun) {
      reportRun(runOptions, isDryRun);
    }

    if (isDryRun) return undefined;

    let cmd: Deno.Process<RO & govn.ShellCmdDryRunnable> | undefined;
    try {
      cmd = Deno.run(runOptions);

      // see https://github.com/denoland/deno/issues/4568 why this is necessary
      const [stdErrRaw, stdOutRaw, status] = await Promise.all([
        cmd.stderrOutput(),
        cmd.output(),
        cmd.status(),
      ]);
      const result: govn.ShellExecuteResult<RO, ROS> = {
        runOptions,
        runOptionsSupplier: ros,
        status,
        isValid: () => isValid ? isValid(result) : status.success,
      };
      const reportResult = ros.reportResult || defaults?.reportResult;
      if (reportResult) {
        reportResult(result);
      }
      const decoder = ros.decoder || defaults?.decoder || this.decoder;
      const consumeStdErr = ros.consumeStdErr || defaults?.consumeStdErr;
      if (consumeStdErr) {
        consumeStdErr(decoder.decode(stdErrRaw), result);
      }
      const consumeStdOut = ros.consumeStdOut || defaults?.consumeStdOut;
      if (consumeStdOut) {
        consumeStdOut(decoder.decode(stdOutRaw), result);
      }
      return result;
    } catch (error) {
      const reportError = ros.reportError || defaults?.reportError;
      if (reportError) {
        reportError(error, runOptions);
      } else {
        throw error;
      }
    } finally {
      if (cmd) {
        cmd.close();
      }
    }
  }
}

if (!window.shell) {
  window.shell = new TypicalShell();
}
