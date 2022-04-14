import * as path from "https://deno.land/std@0.123.0/path/mod.ts";
import * as f from "./fetch.ts";
import * as colors from "https://deno.land/std@0.123.0/fmt/colors.ts";
import * as dzx from "https://deno.land/x/dzx@0.3.1/mod.ts";

export interface GitHubBinaryHandler {
  (
    fsPath: string,
    ghbs: GitHubBinarySource,
  ): Promise<void>;
}

export function makeGitHubBinaryExecutable(): GitHubBinaryHandler {
  return async (fsPath: string) => {
    // 0o755 = owner can do anything, everyone can read/execute
    await Deno.chmod(fsPath, 0o755);
  };
}

export interface GitHubBinaryArchiveHandler {
  (
    archiveFsPath: string,
    finalize: GitHubBinaryHandler,
    ghbs: GitHubBinarySource,
  ): Promise<void>;
}

export function extractSingleFileFromTarGZ(
  baseName: string,
): GitHubBinaryArchiveHandler {
  return async (
    archiveFsPath: string,
    finalize: GitHubBinaryHandler,
    ghbs: GitHubBinarySource,
  ) => {
    console.log((await dzx.$`tar -tz -f ${archiveFsPath}`).stdout);
    await dzx.$`tar -xz -C ${ghbs.destPath} ${baseName} -f ${archiveFsPath}`;
    await finalize(path.join(ghbs.destPath, baseName), ghbs);
  };
}

export async function latestGitHubRepoRelease(
  { repo }: { readonly repo: string },
  options?: {
    onFetchError: (error: Error) => Promise<void>;
  },
) {
  try {
    const resp = await fetch(
      `https://api.github.com/repos/${repo}/releases/latest`,
    );
    return await resp.json();
  } catch (error) {
    options?.onFetchError?.(error);
  }
}

export interface GitHubBinarySource {
  readonly repo: string;
  readonly destPath: string;
  readonly release: {
    readonly baseName: string;
    readonly unarchive?: GitHubBinaryArchiveHandler;
    readonly finalize?: GitHubBinaryHandler;
  };
}

export function ensureGitHubBinary(bin: GitHubBinarySource, options?: {
  onFetchError: (error: Error) => Promise<void>;
}) {
  return async () => {
    const latest = await latestGitHubRepoRelease(bin, options);
    const latestTagName = latest?.tag_name;
    console.log({ latestTagName });
    await Deno.mkdir(bin.destPath, { recursive: true });
    const finalize = bin.release.finalize ?? makeGitHubBinaryExecutable();
    const srcEndpoint =
      `https://github.com/${bin.repo}/releases/download/${latestTagName}/${bin.release.baseName}`;
    const tmpDir = await Deno.makeTempDir();
    const tmpDownloadPath = path.join(tmpDir, bin.release.baseName);
    await f.downloadAsset(
      srcEndpoint,
      bin.release.unarchive
        ? tmpDownloadPath
        : path.join(bin.destPath, bin.release.baseName),
      async (destFile, srcEndpoint) => {
        console.log(colors.green(destFile), colors.dim(srcEndpoint));
        if (bin.release.unarchive) {
          await bin.release.unarchive(tmpDownloadPath, finalize, bin);
        } else {
          await finalize(destFile, bin);
        }
      },
      // deno-lint-ignore require-await
      async (error, destFile, srcEndpoint) => {
        console.error(error, colors.red(destFile), colors.dim(srcEndpoint));
      },
    );
    // const tmpDir = await Deno.makeTempDir();
    // const tmpDownloadPath = path.join(tmpDir, bin.release.baseName);
    // dzx.$.verbose = true;
    // await dzx.$`curl -s -L ${srcEndpoint} -o ${tmpDownloadPath}`;
    // await bin.release.unarchive?.(tmpDownloadPath, finalize, bin);
  };
}
