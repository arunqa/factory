import { path } from "./deps.ts";
import { testingAsserts as ta } from "./deps-test.ts";
import * as m from "../metrics/mod.ts";
import * as fst from "./fs-tree.ts";
import * as mod from "./fs-analytics.ts";

// TODO: create proper test cases which generate random, but predictably
// testable, directories and files with mixture of *.md, *.ts, *.html, *.png,
// etc. files that can then be parsed by FileSysAssetsTree

const testPathAbs = path.dirname(import.meta.url).substr("file://".length);
const _testPathRel = path.relative(Deno.cwd(), testPathAbs);

Deno.test("TODO: fileSysAnalytics", async () => {
  const assetsTree = new fst.FileSysAssetsTree();
  const srcRoot = `/home/${
    Deno.env.get("USER")
  }/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/content`;
  const src = await assetsTree.consumeAssets({
    identity: "content",
    root: srcRoot,
    rootIsAbsolute: path.isAbsolute(srcRoot),
  });
  const destRoot = `/home/${
    Deno.env.get("USER")
  }/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/public`;
  const dest = await assetsTree.consumeAssets({
    identity: "public",
    root: destRoot,
    rootIsAbsolute: path.isAbsolute(destRoot),
    options: {
      followSymlinks: false,
    },
  });
  const analytics = await mod.fileSysAnalytics({
    assetsTree,
    metrics: new m.TypicalMetrics(),
  });
  ta.assert(analytics);
  ta.assert(analytics.metrics);
  // Deno.writeTextFileSync(
  //   "test.csv",
  //   metrics.pathExtnsColumnHeaders.join(",") + "\n" +
  //     metrics.pathExtnsColumns.map((row) => row.join(",")).join("\n"),
  // );
});
