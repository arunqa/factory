import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./mod.ts";

Deno.test(`OKRs`, async () => {
  const okrsF = mod.typicalOkrFactory();
  const okrs = await okrsF.objectives(async function* (f) {
    yield await f.objective("objective 1", async function* (o) {
      yield await f.keyResult(`${o.objective} KR 1`);
    });
  });

  // console.dir(okrs, { depth: undefined });

  const objectives = Array.from(okrs.objectives);
  const kr1 = Array.from(objectives[0].keyResults);
  ta.assertEquals(objectives.length, 1);
  ta.assertEquals(kr1.length, 1);
});
