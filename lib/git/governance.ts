export type GitEntry = string;
export type GitWorkTreePath = string;
export type GitDir = string;

export interface ManagedGitReference {
  readonly paths: GitPathsSupplier;
}

export interface GitAsset extends ManagedGitReference {
  readonly assetPathRelToWorkTree: string;
  readonly gitBranchOrTag: GitBranchOrTag;
}

export interface GitWorkTreeAsset extends GitAsset, ManagedGitReference {
}

export interface GitWorkTreeAssetUrlResolver<Identity extends string> {
  readonly identity: Identity;
  readonly gitAssetUrl: (
    asset: GitWorkTreeAsset,
    fallback?: () => string | undefined,
  ) => string | undefined;
}

export interface GitWorkTreeAssetUrlResolvers<Identity extends string> {
  readonly gitAssetUrlResolver: (
    identity: string,
  ) => GitWorkTreeAssetUrlResolver<Identity> | undefined;
  readonly gitAssetUrlResolvers: Iterable<
    GitWorkTreeAssetUrlResolver<Identity>
  >;
  readonly registerResolver: (
    resolver: GitWorkTreeAssetUrlResolver<Identity>,
  ) => void;
}

export interface GitWorkTreeAssetResolver {
  (
    candidate: GitEntry | GitEntryStatus,
    gitBranchOrTag: GitBranch,
    paths: GitPathsSupplier,
  ): GitWorkTreeAsset | undefined;
}

export interface GitRemoteCommit<Field extends CommitField>
  extends ManagedGitReference {
  readonly remoteURL: string;
  readonly commit: GitCommitBase<Field> | GitCommitBaseWithFiles<Field>;
}

export interface GitRemoteCommitResolver<Field extends CommitField> {
  (
    commit: GitCommitBase<Field> | GitCommitBaseWithFiles<Field>,
    paths: GitPathsSupplier,
  ): GitRemoteCommit<Field> | undefined;
}

export interface GitRemoteChangelogReportHref<Field extends CommitField> {
  (
    commit?: GitCommitBase<Field> | GitCommitBaseWithFiles<Field>,
  ): string | undefined;
}

export interface ManagedGitResolvers<Identity extends string>
  extends GitWorkTreeAssetUrlResolvers<Identity> {
  readonly workTreeAsset: GitWorkTreeAssetResolver;
  // deno-lint-ignore no-explicit-any
  readonly remoteCommit: GitRemoteCommitResolver<any>;
  // deno-lint-ignore no-explicit-any
  readonly changelogReportAnchorHref: GitRemoteChangelogReportHref<any>;
  readonly cicdBuildStatusHTML: (...args: unknown[]) => string;
}

export interface GitPathsSupplier {
  readonly workTreePath: GitWorkTreePath; // git --work-tree argument
  readonly gitDir: GitDir; // git --git-dir argument
  readonly assetAbsWorkTreePath: (asset: GitAsset) => GitEntry;
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
export type GitTag = string;
export type GitBranchOrTag = string;

export interface GitCacheablesSupplier extends GitPathsSupplier {
  readonly currentBranch: GitBranch | undefined;
  readonly mostRecentCommit:
    // deno-lint-ignore no-explicit-any
    | GitCommitBase<any>
    // deno-lint-ignore no-explicit-any
    | GitCommitBaseWithFiles<any>
    | void;
  readonly status: GitEntriesStatusesSupplier;
  readonly isDirty: boolean;
}

export interface GitExecutive extends GitPathsSupplier {
  readonly cached: GitCacheablesSupplier;
  readonly currentBranch: (
    cmd?: GitRunCmdOptionsSupplier,
  ) => Promise<GitBranch | undefined>;
  readonly mostRecentCommit: <Field extends CommitField>(
    cmd?: GitRunCmdOptionsSupplier,
  ) => Promise<GitCommitBase<Field> | GitCommitBaseWithFiles<Field> | void>;
  readonly status: (
    cmd?: GitRunCmdOptionsSupplier,
  ) => Promise<GitEntriesStatusesSupplier>;
  readonly isDirty: () => Promise<boolean>;
  readonly log: <Field extends CommitField>() => Promise<
    GitCommitBase<Field>[] | GitCommitBaseWithFiles<Field>[] | void
  >;
  readonly latestTag: (
    cmd?: GitRunCmdOptionsSupplier,
  ) => Promise<GitTag | undefined>;
  readonly mGitResolvers: ManagedGitResolvers<string>;
}
