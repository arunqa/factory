export type GitEntry = string;
export type GitWorkTreePath = string;
export type GitDir = string;

export interface GitPathsSupplier {
  readonly workTreePath: GitWorkTreePath; // git --work-tree argument
  readonly gitDir: GitDir; // git --git-dir argument
}

export enum GitStatus {
  " " = "unmodified",
  "M" = "modified",
  "A" = "added",
  "D" = "deleted",
  "R" = "renamed",
  "C" = "copied",
  "U" = "umerged",
  "?" = "untracked",
  "!" = "ignored",
}

export interface GitEntryStatus {
  readonly x: GitStatus;
  readonly y: GitStatus;
  readonly entry: GitEntry;
  readonly fromEntry?: GitEntry;
}

export interface GitRunCmdDiagnostics {
  readonly isValid: boolean;
  readonly diagnostics?: string;
}

export interface GitEntriesStatusesSupplier {
  readonly statuses: GitEntryStatus[];
  readonly status: (entry: GitEntry) => GitEntryStatus | undefined;
  readonly statusDiags: GitRunCmdDiagnostics;
}

export type GitCommitBase<Field extends string> = Record<Field, string>;
export type GitCommitBaseWithFiles<Field extends string> =
  & Record<
    Field | "status",
    string
  >
  & { files: string[] };

export interface GitRunCmdOptionsSupplier {
  (gp: GitPathsSupplier): Deno.RunOptions;
}

export type GitBranch = string;

export interface GitCacheablesSupplier extends GitPathsSupplier {
  readonly currentBranch: GitBranch | undefined;
  readonly status: GitEntriesStatusesSupplier;
  readonly isDirty: boolean;
}

export interface GitExecutive extends GitPathsSupplier {
  readonly cached: GitCacheablesSupplier;
  readonly currentBranch: (
    cmd?: GitRunCmdOptionsSupplier,
  ) => Promise<GitBranch | undefined>;
  readonly status: (
    cmd?: GitRunCmdOptionsSupplier,
  ) => Promise<GitEntriesStatusesSupplier>;
  readonly isDirty: () => Promise<boolean>;
}
