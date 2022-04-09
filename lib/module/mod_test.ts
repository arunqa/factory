import { path } from "./deps.ts";
import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./graph.ts";

Deno.test("deno info module graph", async () => {
  const graph = await mod.moduleGraphs.moduleGraph("./extension.ts");
  ta.assert(graph);
});

Deno.test("deno info module dependencies (include root specifier)", async () => {
  const deps = await mod.moduleGraphs.localDependencies("./extension.ts", true);
  ta.assert(deps);
  ta.assert(deps.length == 2);
});

Deno.test("deno info module dependencies (exclude root specifier)", async () => {
  const deps = await mod.moduleGraphs.localDependencies("./extension.ts");
  ta.assert(deps);
  ta.assert(deps.length == 1);
  ta.assert(deps[0].local == path.resolve("./governance.ts"));
});

Deno.test("deno info module dependencies with Deno.FileInfo", async () => {
  const deps = await mod.moduleGraphs.localDependenciesFileInfos(
    "./extension.ts",
  );
  ta.assert(deps);
  ta.assert(deps.length == 1);
  ta.assert(deps[0].local == path.resolve("./governance.ts"));
  ta.assert(deps[0].localFileInfo);
});
