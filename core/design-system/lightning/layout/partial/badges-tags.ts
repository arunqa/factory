import * as ldsGovn from "../../governance.ts";
import * as k from "../../../../../lib/knowledge/mod.ts";

export const frontmatterTagsPartial: ldsGovn.LightningPartial = (layout) => {
  const tm = layout.dsCtx.termsManager;
  const badge = (term: k.Term) => {
    const ns = tm.termNamespace(term);
    // deno-fmt-ignore (because we don't want ${...} wrapped)
    return ns
      ? `<span class="slds-badge slds-badge_lightest"><em>${ns}</em>&nbsp;${tm.termLabel(term)}</span>`
      : `<span class="slds-badge slds-badge_lightest">${tm.termLabel(term)}</span>`;
  };

  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return `${layout?.frontmatter?.folksonomy && tm.isFolksonomy(layout.frontmatter.folksonomy)
    ? (tm.isTerm(layout.frontmatter.folksonomy) ? badge(layout.frontmatter.folksonomy) : layout.frontmatter.folksonomy.map(term => badge(term)).join(' '))
    : '<!-- no folksonomy in frontmatter -->'}
  ${layout?.frontmatter?.taxonomy && tm.isTaxonomy(layout.frontmatter.taxonomy)
    ?  (tm.isTerm(layout.frontmatter.taxonomy) ? badge(layout.frontmatter.taxonomy) : layout.frontmatter.taxonomy.map(term => badge(term)).join(' '))
    : '<!-- no taxonomy in frontmatter -->'}`
};
