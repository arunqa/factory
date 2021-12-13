import * as git from "../../lib/git/mod.ts";

export const gitLabRemoteID = "gitLab-remote" as const;
export const vsCodeLocalID = "vscode-local" as const;

export type GitAssetUrlResolverIdentity =
  | typeof gitLabRemoteID
  | typeof vsCodeLocalID;

export function gitLabAssetUrlResolver(
  glEndpoint: string,
): git.GitWorkTreeAssetUrlResolver<GitAssetUrlResolverIdentity> {
  return {
    identity: gitLabRemoteID,
    gitAssetUrl: (asset) => {
      return `${glEndpoint}/-/tree/${asset.gitBranchOrTag}/${asset.assetPathRelToWorkTree}`;
    },
  };
}

export function gitLabRemoteCommitResolver(
  glEndpoint: string,
): git.GitRemoteCommitResolver<"hash"> {
  return (commit, paths) => {
    const remoteURL = `${glEndpoint}/-/commit/${commit.hash}`;
    // deno-lint-ignore no-explicit-any
    const result: git.GitRemoteCommit<any> = {
      commit,
      remoteURL,
      paths,
    };
    return result;
  };
}

export function gitLabWorkTreeAssetVsCodeURL(
  _glEndpoint: string,
): git.GitWorkTreeAssetUrlResolver<
  GitAssetUrlResolverIdentity
> {
  return {
    identity: vsCodeLocalID,
    gitAssetUrl: () => `TODO`,
  };
}
