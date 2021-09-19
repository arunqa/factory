import { path } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./git.ts";

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

  const git = new mod.TypicalGit(gitPaths);
  await git.init();
  const currentBranch = await git.currentBranch();
  const isDirty = await git.isDirty();
  ta.assert(currentBranch);
  ta.assert(git.cached.currentBranch == currentBranch);
  ta.assert(git.cached.isDirty == isDirty);

  // TODO: figure out how to test this deterministically
  // console.dir(await git.status());
  // console.dir(await git.log());
  // console.dir(await git.isDirty());
});
