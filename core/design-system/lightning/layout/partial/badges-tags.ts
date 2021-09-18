import * as ldsGovn from "../../governance.ts";

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const frontmatterTagsPartial: ldsGovn.LightningPartial = (layout) => `
${layout?.frontmatter?.tags && Array.isArray(layout.frontmatter.tags)
  ?  layout.frontmatter.tags.map(tag => `<span class="slds-badge slds-badge_lightest">${tag}</span>`).join(' ')
  : '<!-- no tags in frontmatter -->'}`;
