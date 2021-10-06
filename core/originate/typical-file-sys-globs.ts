import * as govn from "../../governance/mod.ts";
import * as fsg from "./file-sys-globs.ts";
import * as r from "../std/resource.ts";
import * as route from "../std/route.ts";
import * as fm from "../std/frontmatter.ts";
import * as md from "../resource/markdown.ts";
import * as html from "../resource/html.ts";
import * as module from "../resource/module/module.ts";
import * as jsonM from "../resource/module/json.ts";
import * as mdDS from "../render/markdown/mod.ts";
import * as g from "../../lib/git/mod.ts";

export function staticMarkdownFileSysGlob(
  mdrs: mdDS.MarkdownRenderStrategy,
  routeParser = route.humanFriendlyFileSysRouteParser,
): fsg.FileSysPathGlob<md.MarkdownResource> {
  return {
    glob: "**/*.md",
    routeParser,
    factory: md.staticMarkdownFileSysResourceFactory(
      // deno-lint-ignore no-explicit-any
      r.pipelineUnitsRefinery<any>(
        fm.prepareFrontmatter(fm.yamlMarkdownFrontmatterRE),
        mdrs.renderer(),
      ),
    ),
  };
}

export function markdownModuleFileSysGlob(
  mdrs: mdDS.MarkdownRenderStrategy,
  routeParser = route.humanFriendlyFileSysRouteParser,
): fsg.FileSysPathGlob<md.MarkdownResource> {
  return {
    glob: "**/*.md.ts",
    routeParser,
    factory: md.markdownModuleFileSysResourceFactory(
      // deno-lint-ignore no-explicit-any
      r.pipelineUnitsRefinery<any>(
        fm.prepareFrontmatter(fm.yamlMarkdownFrontmatterRE),
        mdrs.renderer(),
      ),
    ),
  };
}

export function markdownFileSysGlobs(
  originRootPath: fsg.FileSysPathText,
  mdrs: mdDS.MarkdownRenderStrategy,
  fsRouteFactory: route.FileSysRouteFactory,
  routeParser = route.humanFriendlyFileSysRouteParser,
): fsg.FileSysPaths<md.MarkdownResource> {
  return {
    humanFriendlyName: "Markdown Content",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `Markdown Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [staticMarkdownFileSysGlob(mdrs, routeParser)],
      fileSysGitPaths: g.discoverGitWorkTree(originRootPath),
    }],
    fsRouteFactory,
  };
}

export function htmlFileSysGlob(
  routeParser = route.humanFriendlyFileSysRouteParser,
): fsg.FileSysPathGlob<
  html.StaticHtmlResource
> {
  return {
    glob: "**/*.html",
    routeParser,
    factory: html.staticHtmlFileSysResourceFactory(
      // deno-lint-ignore no-explicit-any
      r.pipelineUnitsRefinery<any>(
        fm.prepareFrontmatter(fm.yamlHtmlFrontmatterRE),
      ),
    ),
  };
}

export function htmlFileSysGlobs(
  originRootPath: fsg.FileSysPathText,
  fsRouteFactory: route.FileSysRouteFactory,
  routeParser = route.humanFriendlyFileSysRouteParser,
): fsg.FileSysPaths<html.StaticHtmlResource> {
  return {
    humanFriendlyName: "HTML Content with Optional Frontmatter",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `HTML Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [htmlFileSysGlob(routeParser)],
      fileSysGitPaths: g.discoverGitWorkTree(originRootPath),
    }],
    fsRouteFactory,
  };
}

export function resourceModuleFileSysGlob<State>(
  state: State,
  routeParser = route.humanFriendlyFileSysRouteParser,
): fsg.FileSysPathGlob<
  govn.ModuleResource
> {
  return {
    glob: "**/*.rf.ts",
    exclude: ["deps.ts"],
    routeParser,
    factory: module.moduleFileSysResourceFactory(state),
  };
}

export function jsonModuleFileSysGlob(
  routeParser = route.humanFriendlyFileSysRouteParser,
): fsg.FileSysPathGlob<
  govn.JsonInstanceSupplier
> {
  return {
    glob: "**/*.json.ts",
    exclude: ["deps.ts"],
    routeParser,
    factory: jsonM.jsonFileSysResourceFactory(),
  };
}

export function moduleFileSysGlobs<State>(
  originRootPath: fsg.FileSysPathText,
  fsRouteFactory: route.FileSysRouteFactory,
  mdrs: mdDS.MarkdownRenderStrategy,
  state: State,
  routeParser = route.humanFriendlyFileSysRouteParser,
): fsg.FileSysPaths<govn.ModuleResource> {
  return {
    humanFriendlyName: "Module Content",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `Module Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [
        resourceModuleFileSysGlob(state, routeParser) as fsg.FileSysPathGlob<
          // deno-lint-ignore no-explicit-any
          any
        >,
        // deno-lint-ignore no-explicit-any
        jsonModuleFileSysGlob(routeParser) as fsg.FileSysPathGlob<any>,
        markdownModuleFileSysGlob(mdrs, routeParser) as fsg.FileSysPathGlob<
          // deno-lint-ignore no-explicit-any
          any
        >,
      ],
      fileSysGitPaths: g.discoverGitWorkTree(originRootPath),
    }],
    fsRouteFactory,
  };
}
