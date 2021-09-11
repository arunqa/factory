import { testingAsserts as ta } from "../../../deps-test.ts";
import * as govn from "../../../governance/mod.ts";
import * as fm from "../../../core/std/frontmatter.ts";
import * as route from "../../../core/std/route.ts";
import * as c from "../../../core/std/content.ts";
import * as md from "../../resource/markdown.ts";
import * as mod from "./mod.ts";

const mds = new mod.MarkdownRenderStrategy(new mod.MarkdownLayouts());
const renderer =
  mds.layoutStrategies.defaultLayoutStrategySupplier.layoutStrategy;

Deno.test(`markdownHTML without frontmatter and integrated styles through data URI`, async () => {
  const testText = "__transform__ test";
  const nature = md.markdownContentNature;
  const asset: Omit<
    md.MarkdownResource,
    "consumeParsedFrontmatter" | "frontmatter"
  > = {
    nature,
    route: route.route({ unit: "test", label: "test" }),
    model: {
      isContentModel: true,
      isMarkdownModel: true,
      isContentAvailable: true,
    },
    text: testText,
    textSync: testText,
  };

  const syncResult = renderer.renderedSync(asset);
  ta.assertStringIncludes(
    syncResult.html.toString(),
    "<p><strong>transform</strong> test</p>",
  );
  ta.assertStringIncludes(
    syncResult.html.toString(),
    `<style>@import url("data:text/css;base64`,
  );

  const asyncResult = await renderer.rendered(asset);
  ta.assertStringIncludes(
    asyncResult.html.toString(),
    "<p><strong>transform</strong> test</p>",
  );
  ta.assertStringIncludes(
    asyncResult.html.toString(),
    `<style>@import url("data:text/css;base64`,
  );
});

const testTextWithFrontmatter = `
---
tags: [a, b, c]
custom: value
layout: slds/prime
route:
  unit: home
  label: Home
  isRootUnit: true
---
Welcome to R2 Markdown *with Frontmatter* Home.`;

Deno.test(`markdownHTML with typed frontmatter`, async () => {
  const nature = md.markdownContentNature;
  const asset:
    & md.MarkdownResource
    & govn.FrontmatterConsumerSupplier<govn.UntypedFrontmatter>
    & Partial<govn.RouteSupplier>
    & govn.ParsedRouteConsumer = {
      nature,
      route: route.route({ unit: "test", label: "test" }),
      frontmatter: { preParse: "value" },
      model: {
        isContentModel: true,
        isMarkdownModel: true,
        isContentAvailable: true,
      },
      consumeParsedFrontmatter: (parsed) => {
        if (parsed.frontmatter) {
          c.mutateFlexibleContent(asset, parsed.content);
          // deno-lint-ignore no-explicit-any
          (asset as any).frontmatter = parsed.frontmatter;
          asset.consumeParsedRoute(parsed.frontmatter);
          return parsed.frontmatter;
        }
      },
      consumeParsedRoute: (rs) => {
        if (route.isParsedRouteSupplier(rs)) {
          // we're going to mutate this object directly
          // deno-lint-ignore no-explicit-any
          (asset as any).route = route.route(rs.route);
        }
        return rs;
      },
      text: testTextWithFrontmatter,
      textSync: testTextWithFrontmatter,
    };

  ta.assertEquals(asset.frontmatter.preParse, "value");

  // should mutate the above with new frontmatter and content
  const fmr = fm.prepareFrontmatterSync(fm.yamlMarkdownFrontmatterRE)(asset);
  ta.assert(fmr);
  ta.assert(fmr.frontmatter);
  ta.assert(route.isRouteSupplier(fmr));
  ta.assert(route.isRoute(fmr.route));

  const syncResult = renderer.renderedSync(asset);
  ta.assertStringIncludes(
    syncResult.html.toString(),
    "<p>Welcome to R2 Markdown <em>with Frontmatter</em> Home.</p>\n",
  );

  const asyncResult = await renderer.rendered(asset);
  ta.assertStringIncludes(
    asyncResult.html.toString(),
    "<p>Welcome to R2 Markdown <em>with Frontmatter</em> Home.</p>\n",
  );
});
