import { path } from "./deps.ts";
import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./fs-tabular.ts";

const testPathAbs = path.dirname(import.meta.url).substr("file://".length);
const _testPathRel = path.relative(Deno.cwd(), testPathAbs);

Deno.test("TODO: file system tabular records", async () => {
  for await (
    const dtr of mod.fileSystemTabularRecords([{
      namespace: "source",
      // deno-fmt-ignore
      rootAbsPath: `/home/${Deno.env.get("USER")}/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/content`,
      options: {
        followSymlinks: true,
      },
    }, {
      namespace: "destination",
      // deno-fmt-ignore
      rootAbsPath: `/home/${Deno.env.get("USER")}/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/public`,
      options: {
        followSymlinks: true,
      },
    }])
  ) {
    const rows = await dtr.dataRows();
    ta.assert(rows.length);
    // TODO: add real tests by generating synthetic files and counting them
  }
});
