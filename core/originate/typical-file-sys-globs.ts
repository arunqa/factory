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

export function markdownFileSysGlob(
  mdrs: mdDS.MarkdownRenderStrategy,
): fsg.FileSysPathGlob<md.MarkdownResource> {
  return {
    glob: "**/*.md",
    routeParser: route.humanFriendlyFileSysRouteParser,
    factory: md.markdownFileSysResourceFactory(
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
): fsg.FileSysPaths<md.MarkdownResource> {
  return {
    humanFriendlyName: "Markdown Content",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `Markdown Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [markdownFileSysGlob(mdrs)],
    }],
  };
}

export function htmlFileSysGlob(): fsg.FileSysPathGlob<
  html.StaticHtmlResource
> {
  return {
    glob: "**/*.html",
    routeParser: route.humanFriendlyFileSysRouteParser,
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
): fsg.FileSysPaths<html.StaticHtmlResource> {
  return {
    humanFriendlyName: "HTML Content with Optional Frontmatter",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `HTML Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [htmlFileSysGlob()],
    }],
  };
}

export function resourceModuleFileSysGlob(): fsg.FileSysPathGlob<
  govn.ModuleResource
> {
  return {
    glob: "**/*.r.ts",
    exclude: ["deps.ts"],
    routeParser: route.humanFriendlyFileSysRouteParser,
    factory: module.moduleFileSysResourceFactory(),
  };
}

export function jsonModuleFileSysGlob(): fsg.FileSysPathGlob<
  govn.JsonInstanceSupplier
> {
  return {
    glob: "**/*.json.ts",
    exclude: ["deps.ts"],
    routeParser: route.humanFriendlyFileSysRouteParser,
    factory: jsonM.jsonFileSysResourceFactory(),
  };
}

export function moduleFileSysGlobs(
  originRootPath: fsg.FileSysPathText,
): fsg.FileSysPaths<govn.ModuleResource> {
  return {
    humanFriendlyName: "Module Content",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `Module Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [
        // deno-lint-ignore no-explicit-any
        resourceModuleFileSysGlob() as fsg.FileSysPathGlob<any>,
        // deno-lint-ignore no-explicit-any
        jsonModuleFileSysGlob() as fsg.FileSysPathGlob<any>,
      ],
    }],
  };
}
