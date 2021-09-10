import { testingAsserts as ta } from "../deps-test.ts";
import * as route from "../core/std/route.ts";
import * as mod from "./hugo-site.ts";

Deno.test(`underscore index file sys route parser`, () => {
  const underscoreIndexUnitPath = "/some/long-ugly/file_sys_path/_index.md";
  const usrp = mod.hugoRouteParser(
    route.humanFriendlyFileSysRouteParser,
  );
  const usUnit = usrp(underscoreIndexUnitPath, "/some/long-ugly");
  ta.assertEquals(usUnit, {
    parsedPath: {
      root: "/",
      dir: "/some/long-ugly/file_sys_path",
      base: "_index.md",
      ext: ".md",
      name: "_index",
    },
    routeUnit: {
      unit: "index",
      label: "File Sys Path",
      isUnderscoreIndex: true,
    },
  });
});
