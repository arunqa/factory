import * as ldsGovn from "../../governance.ts";

export const tagLabel = (tag: string | [string, string] | unknown) => {
  if (typeof tag === "string") return tag;
  if (Array.isArray(tag)) {
    const [_identity, label] = tag;
    return label;
  }
  if (typeof tag === "object") {
    const tagO = tag as { tag: string; label: string };
    return tagO.label;
  }
  return `unknown tag type: ${tag}`;
};

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const frontmatterTagsPartial: ldsGovn.LightningPartial = (layout) => `
${layout?.frontmatter?.folksonomy && Array.isArray(layout.frontmatter.folksonomy)
  ?  layout.frontmatter.folksonomy.map(tag => `<span class="slds-badge slds-badge_lightest">${tagLabel(tag)}</span>`).join(' ')
  : '<!-- no folksonomy in frontmatter -->'}
${layout?.frontmatter?.taxonomy && Array.isArray(layout.frontmatter.taxonomy)
  ?  layout.frontmatter.taxonomy.map(tag => `<span class="slds-badge slds-badge_lightest">${tagLabel(tag)}</span>`).join(' ')
  : '<!-- no taxonomy in frontmatter -->'}`;
