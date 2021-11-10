import { testingAsserts as ta } from "../../deps-test.ts";
import * as govn from "../../../governance/mod.ts";
import * as mod from "./design-system.ts";

Deno.test(`design system layout arguments`, () => {
  const testFM1: govn.UntypedFrontmatter = {
    layout: "ds/page/layout",
  };
  ta.assert(mod.isDesignSystemLayoutArgumentsSupplier(testFM1));

  const testFM2: govn.UntypedFrontmatter = {
    layout: {
      identity: "ds/page/layout",
    },
  };
  ta.assert(mod.isDesignSystemLayoutArgumentsSupplier(testFM2));
  ta.assert(typeof testFM2.layout != "string");
  ta.assert(!testFM2.layout.diagnostics);
  ta.assert(!testFM2.layout.redirectConsoleToHTML);

  const testFM3: govn.UntypedFrontmatter = {
    layout: {
      identity: "ds/page/layout",
      diagnostics: true,
      redirectConsoleToHTML: true,
    },
  };
  ta.assert(mod.isDesignSystemLayoutArgumentsSupplier(testFM3));
  ta.assert(typeof testFM3.layout != "string");
  ta.assert(testFM3.layout.diagnostics);
  ta.assert(testFM3.layout.redirectConsoleToHTML);

  const testFM4: govn.UntypedFrontmatter = {
    layout: {
      diagnostics: true,
      redirectConsoleToHTML: true,
    },
  };
  ta.assert(mod.isDesignSystemLayoutArgumentsSupplier(testFM4));
  ta.assert(typeof testFM4.layout != "string");
  ta.assert(testFM4.layout.diagnostics);
  ta.assert(testFM4.layout.redirectConsoleToHTML);
});

Deno.test(`design system arguments`, () => {
  const testFM1: govn.UntypedFrontmatter = {
    designSystem: {
      layout: "ds/page/layout",
    },
  };
  ta.assert(mod.isDesignSystemArgumentsSupplier(testFM1));

  const testFM2: govn.UntypedFrontmatter = {
    designSystem: {
      layout: {
        identity: "ds/page/layout",
      },
    },
  };
  ta.assert(mod.isDesignSystemArgumentsSupplier(testFM2));

  const testFM3: govn.UntypedFrontmatter = {
    "design-system": {
      layout: {
        identity: "ds/page/layout",
      },
    },
  };
  ta.assert(!mod.isDesignSystemArgumentsSupplier(testFM3));

  ta.assertEquals(testFM3, {
    "design-system": {
      layout: {
        identity: "ds/page/layout",
      },
    },
  });
  ta.assert(mod.isFlexibleMutatedDesignSystemArgumentsSupplier(testFM3));
  ta.assertEquals(testFM3, {
    designSystem: {
      layout: {
        identity: "ds/page/layout",
      },
    },
  });
});
