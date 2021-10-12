import * as ldsGovn from "../../governance.ts";
import * as icon from "./icon.ts";

export type CardTitleLink = string;
export type CardTitle = string;
export type CardBody = string;

export interface Card {
  readonly title: CardTitle;
  readonly notification?: ldsGovn.LightningNavigationNotification;
  readonly icon?: icon.IconIdentity;
  readonly href?: CardTitleLink;
  readonly body?: CardBody;
}

export function renderedCard(
  layout: ldsGovn.LightningLayout,
  card: Card,
): string {
  // deno-fmt-ignore
  return `<article class="slds-card slds-var-m-around_small">
    <div class="slds-card__header slds-grid">
      <header class="slds-media slds-media_center slds-has-flexi-truncate">
        ${card.icon? `<div class="slds-media__figure">
          <span class="slds-icon_container slds-icon-standard-account" title="account">
            ${icon.renderedIcon(layout, card.icon, 'slds-icon_x-small')}
            <span class="slds-assistive-text">{c.title}</span>
          </span>
        </div>` : ''}        
        <div class="slds-media__body">
          <h2 class="slds-card__header-title">
            <a href="${card.href}" class="slds-card__header-link slds-truncate" title="${card.title}">
              <span>${card.title}</span>
            </a>${card.notification ? `
            <span class="slds-badge slds-col_bump-left">
              <span class="slds-assistive-text">:</span>${card.notification.count}
              <span class="slds-assistive-text">${card.notification.assistiveText}</span>
            </span>` : ''}
          </h2>
        </div>
      </header>
    </div>
    ${card.body ? `<div class="slds-card__body slds-card__body_inner">${card.body}</div>` : ''}
    </article>`
}
