import { fs, path, safety } from "../../deps.ts";
import * as govn from "../../governance/mod.ts";

// deno-lint-ignore no-empty-interface
export interface GitWorkTreeDiscoveryResult extends govn.GitPathsSupplier {
}

export function discoverGitWorkTree(
  fileSysPath: string,
): false | GitWorkTreeDiscoveryResult {
  let current = path.isAbsolute(fileSysPath)
    ? fileSysPath
    : path.join(Deno.cwd(), fileSysPath);
  let parent = path.join(current, "..");

  function gitWorkTreeResult(): false | GitWorkTreeDiscoveryResult {
    const gitDir = path.join(current, ".git");
    if (fs.existsSync(gitDir)) {
      return {
        workTreePath: current,
        gitDir,
      };
    }
    return false;
  }

  for (; parent !== current; parent = path.join(current, "..")) {
    const result = gitWorkTreeResult();
    if (result) return result;
    current = parent;
  }

  return gitWorkTreeResult();
}

export function gitStatusCmd(
  inherit?: Partial<Deno.RunOptions>,
): govn.GitRunCmdOptionsSupplier {
  return (gp) => {
    return {
      cmd: [
        "git",
        `--git-dir=${gp.gitDir}`,
        `--work-tree=${gp.workTreePath}`,
        "status",
        "--porcelain",
      ],
      stdout: "piped",
      stderr: "piped",
      ...inherit,
    };
  };
}

export function gitShowCurrentBranchCmd(
  inherit?: Partial<Deno.RunOptions>,
): govn.GitRunCmdOptionsSupplier {
  return (gp) => {
    return {
      cmd: [
        "git",
        `--git-dir=${gp.gitDir}`,
        `--work-tree=${gp.workTreePath}`,
        "branch",
        "--show-current",
      ],
      stdout: "piped",
      stderr: "piped",
      ...inherit,
    };
  };
}

export function parseGitStatus(
  status: string,
  delim = "\n",
): govn.GitEntryStatus[] {
  const chunks = status.split(delim);
  const result: govn.GitEntryStatus[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.length) {
      const x = chunk[0] as govn.GitStatus;
      const fileStatus: govn.GitEntryStatus = {
        x,
        y: chunk[1] as govn.GitStatus,
        entry: chunk.substring(3),
      };
      if (x === govn.GitStatus.R) {
        i++;
        // deno-lint-ignore no-explicit-any
        (fileStatus as any).from = chunks[i];
      }
      result.push(fileStatus);
    }
  }
  return result;
}

export interface GitCmdResult {
  readonly status: Deno.ProcessStatus;
}

export interface GitCmdSuccessResult extends GitCmdResult {
  readonly stdOut: string;
}

export const isGitCmdSuccessful = safety.typeGuard<GitCmdSuccessResult>(
  "stdOut",
);

export interface GitCmdFailureResult extends GitCmdResult {
  readonly stdErr: string;
}

export const isGitCmdFailure = safety.typeGuard<GitCmdFailureResult>(
  "stdErr",
);

export class TypicalGit implements govn.GitExecutive {
  readonly workTreePath: govn.GitWorkTreePath; // git --work-tree argument
  readonly gitDir: govn.GitDir; // git --git-dir argument
  #initialized: boolean | undefined;
  #cached: govn.GitCacheablesSupplier | undefined;

  constructor(gps: govn.GitPathsSupplier) {
    this.workTreePath = gps.workTreePath;
    this.gitDir = gps.gitDir;
  }

  async init(): Promise<void> {
    this.#cached = {
      gitDir: this.gitDir,
      workTreePath: this.workTreePath,
      currentBranch: await this.currentBranch(),
      status: await this.status(),
    };
    this.#initialized = true;
  }

  get cached() {
    if (!this.#initialized) {
      throw new Error(
        "TypicalGit.init() must be called before TypicalGit.cached() can be used",
      );
    }
    return this.#cached!;
  }

  async run(
    cmdOptions: govn.GitRunCmdOptionsSupplier,
  ): Promise<GitCmdSuccessResult | GitCmdFailureResult> {
    let result: GitCmdSuccessResult | GitCmdFailureResult;
    const cmd = Deno.run(cmdOptions(this));
    const status = await cmd.status();
    const stdOutRaw = await cmd.output();
    const stdErrRaw = await cmd.stderrOutput();
    if (status.success) {
      const stdOut = new TextDecoder().decode(stdOutRaw);
      result = { status, stdOut };
    } else {
      const stdErr = new TextDecoder().decode(stdErrRaw);
      result = { status, stdErr };
    }
    cmd.close();
    return result;
  }

  async status(
    cmdOptions = gitStatusCmd(),
  ): Promise<govn.GitEntriesStatusesSupplier> {
    const cmdResult = await this.run(cmdOptions);
    if (isGitCmdSuccessful(cmdResult)) {
      const statuses = parseGitStatus(cmdResult.stdOut);
      return {
        statusDiags: { isValid: true },
        status: (entry) => statuses.find((e) => e.entry == entry),
        statuses,
      };
    } else {
      return {
        statusDiags: { isValid: false, diagnostics: cmdResult.stdErr },
        status: () => undefined,
        statuses: [],
      };
    }
  }

  async currentBranch(
    cmdOptions = gitShowCurrentBranchCmd(),
  ): Promise<govn.GitBranch | undefined> {
    const cmdResult = await this.run(cmdOptions);
    if (isGitCmdSuccessful(cmdResult)) {
      return cmdResult.stdOut;
    } else {
      return undefined;
    }
  }
}
