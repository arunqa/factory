import * as ldsGovn from "../../governance.ts";
import * as card from "./card.ts";

export const autoIndexCardsBodyPartial: ldsGovn.LightningPartial = (layout) => {
  const contentTree = layout.navigation.contentTree(layout);
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return contentTree
    ? `<div class="slds-grid slds-wrap slds-var-m-around_medium">        
        ${contentTree.children.filter(rtn => rtn !== layout.activeTreeNode).map(rtn => `
        <div class="slds-col slds-size_1-of-2 slds-order_2">
          ${card.renderedCard(layout, {
            icon: { collection: "utility", name: "assignment" },
            title: rtn.label,
            href: layout.navigation.location(rtn),
          })}
        </div>`).join('\n')}
      </div>`
    : `<!-- no index cards -->`;
};
