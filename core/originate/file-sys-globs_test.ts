import { fs, path } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as govn from "../../governance/mod.ts";
import * as obs from "../../core/std/observability.ts";
import * as e from "../../core/std/extension.ts";
import * as r from "../../core/std/route.ts";
import * as g from "../../lib/git/mod.ts";
import * as mod from "./file-sys-globs.ts";

const testPath = path.relative(
  Deno.cwd(),
  path.dirname(import.meta.url).substr("file://".length),
);
const contentPathRel = path.relative(
  Deno.cwd(),
  path.resolve(testPath, "../../docs/content"),
);
const contentPathGitWorktree = g.discoverGitWorkTree(contentPathRel);
const observability = new obs.Observability(
  new govn.ObservabilityEventsEmitter(),
);
const testGlobPrime = "**/*";
const extensionsManager = new e.CachedExtensions();
const fsRouteFactory = new r.FileSysRouteFactory(
  r.defaultRouteLocationResolver(),
);
const fsgo = new mod.FileSysGlobsOriginator<fs.WalkEntry>(
  [{
    humanFriendlyName: `test top level`,
    ownerFileSysPath: contentPathRel,
    lfsPaths: [{
      humanFriendlyName: `test path ${contentPathRel}`,
      fileSysPath: contentPathRel,
      globs: [{ glob: testGlobPrime }],
      fileSysGitPaths: contentPathGitWorktree,
    }],
    // deno-lint-ignore require-await
    factory: { construct: async (we) => we },
    fsRouteFactory,
  }],
  extensionsManager,
  {
    eventEmitter: () =>
      new mod.FileSysGlobsOriginatorEventEmitter<fs.WalkEntry>(),
    ...observability,
  },
);
// console.dir(observability.serviceHealth());

Deno.test(`FileSysGlobsOriginator for fs.WalkEntry (async) in ${contentPathRel}`, async () => {
  ta.assert(fs.existsSync(contentPathRel), `${contentPathRel} should exist`);

  ta.assert(contentPathGitWorktree);
  ta.assertEquals(
    path.relative(testPath, contentPathGitWorktree.workTreePath),
    "../..",
  );
  ta.assertEquals(
    path.relative(testPath, contentPathGitWorktree.gitDir),
    "../../.git",
  );

  let expectedFiles = 0;
  let expectedDirs = 0;
  for await (
    const we of fs.expandGlob(testGlobPrime, {
      root: contentPathRel,
      includeDirs: false, // FileSysGlobsOriginator should not include dirs
    })
  ) {
    if (we.isFile) expectedFiles++;
    if (we.isDirectory) expectedDirs++;
  }

  let encounteredWalk = 0;
  // deno-lint-ignore require-await
  fsgo.fsee?.on("beforeYieldWalkEntry", async () => {
    encounteredWalk++;
  });

  let filesCount = 0;
  let dirsCount = 0;
  for await (const we of fsgo.resourcesFactories()) {
    if (we.isFile) filesCount++;
    if (we.isDirectory) dirsCount++;
  }

  ta.assertEquals(encounteredWalk, expectedFiles); // no directories should be encountered
  ta.assertEquals(filesCount, expectedFiles);
  ta.assertEquals(dirsCount, expectedDirs);
});
