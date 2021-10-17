import { path } from "./deps.ts";
import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./mod.ts";

const testPath = path.relative(
  Deno.cwd(),
  path.dirname(import.meta.url).substr("file://".length),
);

Deno.test(`Git in ${testPath}`, async () => {
  const gitPaths = mod.discoverGitWorkTree(Deno.cwd());
  ta.assert(gitPaths);

  ta.assertEquals(
    path.relative(testPath, gitPaths.workTreePath),
    "../..",
  );
  ta.assertEquals(
    path.relative(testPath, gitPaths.gitDir),
    "../../.git",
  );

  const git = new mod.TypicalGit(gitPaths, {
    remoteAsset: () => undefined,
    remoteCommit: () => undefined,
  });
  await git.init();
  const currentBranch = await git.currentBranch();
  const isDirty = await git.isDirty();
  ta.assert(currentBranch);
  ta.assert(git.cached.currentBranch == currentBranch);
  ta.assert(git.cached.isDirty == isDirty);

  // TODO: figure out how to test this deterministically
  ta.assert(await git.status());
  ta.assert(await git.log());
});

Deno.test(`Git Executive in ${testPath}`, async () => {
  const git = await mod.discoverGitWorktreeExecutive(testPath, {
    remoteAsset: () => undefined,
    remoteCommit: () => undefined,
  });
  ta.assert(git);

  const currentBranch = await git.currentBranch();
  const isDirty = await git.isDirty();
  ta.assert(currentBranch);
  ta.assert(git.cached.currentBranch == currentBranch);
  ta.assert(git.cached.isDirty == isDirty);

  // TODO: figure out how to test this deterministically
  ta.assert(await git.status());
  ta.assert(await git.log());
});
