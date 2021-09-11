import { safety, yaml } from "../../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as c from "./content.ts";

export const isFrontmatterSupplier = safety.typeGuard<
  govn.FrontmatterSupplier<govn.UntypedFrontmatter>
>("frontmatter");

export const isFrontmatterConsumer = safety.typeGuard<
  govn.FrontmatterConsumer<govn.UntypedFrontmatter>
>("consumeParsedFrontmatter");

export const yamlMarkdownFrontmatterRE = /^---([\s\S]*?)^---$([\s\S]*)/m;
export const yamlHtmlFrontmatterRE = /^<!---([\s\S]*?)^--->$([\s\S]*)/m;

export function parseYamlFrontmatter(
  frontmatterRE: RegExp,
  text?: string,
): govn.FrontmatterParseResult<govn.UntypedFrontmatter> | undefined {
  if (text) {
    try {
      const yfmMatch = text.match(frontmatterRE)!;
      if (yfmMatch) {
        const [_, yamlFM, content] = yfmMatch;
        const fm = yaml.parse(yamlFM.trim());
        return {
          frontmatter: typeof fm === "object"
            ? fm as Record<string, unknown>
            : undefined,
          content: content.trimStart(),
        };
      }
    } catch (error) {
      return {
        content: text,
        error,
      };
    }
  }
}

export type FrontmatterResource =
  & govn.FrontmatterConsumer<govn.UntypedFrontmatter>
  & (govn.FlexibleContent | govn.HtmlSupplier);

export function prepareFrontmatter(
  frontmatterRE: RegExp,
): (resource: FrontmatterResource) => Promise<
  & FrontmatterResource
  & Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>>
> {
  return async (resource) => {
    if (isFrontmatterConsumer(resource)) {
      if (c.isFlexibleContentSupplier(resource)) {
        const fmResult = parseYamlFrontmatter(
          frontmatterRE,
          await c.flexibleTextCustom(resource),
        );
        if (fmResult) {
          resource.consumeParsedFrontmatter(fmResult);
        }
      } else if (c.isHtmlSupplier(resource)) {
        const fmResult = parseYamlFrontmatter(
          frontmatterRE,
          await c.flexibleTextCustom(resource.html),
        );
        if (fmResult) {
          resource.consumeParsedFrontmatter(fmResult);
        }
      }
    }
    return resource;
  };
}

export function prepareFrontmatterSync(
  frontmatterRE: RegExp,
): (resource: FrontmatterResource) =>
  & FrontmatterResource
  & Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>> {
  return (
    resource: FrontmatterResource,
  ) => {
    if (
      isFrontmatterConsumer(resource) &&
      c.isFlexibleContentSupplier(resource)
    ) {
      const fmResult = parseYamlFrontmatter(
        frontmatterRE,
        c.flexibleTextSyncCustom(resource),
      );
      if (fmResult) {
        resource.consumeParsedFrontmatter(fmResult);
      }
    }
    return resource;
  };
}
