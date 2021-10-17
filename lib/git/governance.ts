export type GitEntry = string;
export type GitWorkTreePath = string;
export type GitDir = string;

export interface GitRemote {
  readonly gitObjectPath: string;
  readonly remoteURL: string;
}

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

export const gitCommitFieldMap = {
  hash: "%H",
  abbrevHash: "%h",
  treeHash: "%T",
  abbrevTreeHash: "%t",
  parentHashes: "%P",
  abbrevParentHashes: "%P",
  authorName: "%an",
  authorEmail: "%ae",
  authorDate: "%ai",
  authorDateRel: "%ar",
  committerName: "%cn",
  committerEmail: "%ce",
  committerDate: "%cd",
  committerDateRel: "%cr",
  subject: "%s",
  body: "%b",
  rawBody: "%B",
} as const;
export type CommitField = keyof typeof gitCommitFieldMap;

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
  readonly log: <Field extends CommitField>() => Promise<
    GitCommitBase<Field>[] | GitCommitBaseWithFiles<Field>[] | void
  >;
}
