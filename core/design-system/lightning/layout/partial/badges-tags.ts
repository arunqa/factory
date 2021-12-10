import * as ldsGovn from "../../governance.ts";
import * as k from "../../../../../lib/knowledge/mod.ts";

export const frontmatterTagsPartial: ldsGovn.LightningPartial = (layout) => {
  const badge = (term: k.Term) => {
    const ns = k.termNamespace(term);
    // deno-fmt-ignore (because we don't want ${...} wrapped)
    return ns
      ? `<span class="slds-badge slds-badge_lightest"><em>${ns}</em>&nbsp;${k.termLabel(term)}</span>`
      : `<span class="slds-badge slds-badge_lightest">${k.termLabel(term)}</span>`;
  };

  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return `${layout?.frontmatter?.folksonomy && k.isFolksonomy(layout.frontmatter.folksonomy)
    ? (k.isTerm(layout.frontmatter.folksonomy) ? badge(layout.frontmatter.folksonomy) : layout.frontmatter.folksonomy.map(term => badge(term)).join(' '))
    : '<!-- no folksonomy in frontmatter -->'}
  ${layout?.frontmatter?.taxonomy && k.isTaxonomy(layout.frontmatter.taxonomy)
    ?  (k.isTerm(layout.frontmatter.taxonomy) ? badge(layout.frontmatter.taxonomy) : layout.frontmatter.taxonomy.map(term => badge(term)).join(' '))
    : '<!-- no taxonomy in frontmatter -->'}`
};
