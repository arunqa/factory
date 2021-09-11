import { safety } from "../../../deps.ts";
import * as govn from "../../../../governance/mod.ts";
import * as r from "../../../../core/std/route.ts";
import * as mdDS from "../../../../core/render/markdown/mod.ts";
import * as lds from "../mod.ts";

export interface TodoDirectiveAttrs {
  readonly for?: string;
}

export interface ToDoDirectiveState extends TodoDirectiveAttrs {
  readonly task: string;
}

export interface ToDosDirectiveStateSupplier {
  readonly contentTODOs: ToDoDirectiveState[];
}

export const isToDosDirectiveStateSupplier = safety.typeGuard<
  ToDosDirectiveStateSupplier
>("contentTODOs");

export class ToDoDirectiveNotification
  implements lds.LightningNavigationNotification {
  readonly assistiveText = "TODOs";

  constructor(readonly state: ToDosDirectiveStateSupplier) {
  }

  get count(): number {
    return this.state.contentTODOs.length;
  }
}

export class ToDoDirective implements
  govn.DirectiveExpectation<
    mdDS.MarkdownContentInlineDirective<TodoDirectiveAttrs>,
    string | undefined
  > {
  readonly identity = "todo";

  encountered(
    d: mdDS.MarkdownContentInlineDirective<TodoDirectiveAttrs>,
  ): string | undefined {
    let diagnostic: string | undefined = undefined;
    const todo: ToDoDirectiveState = { ...d.attributes, task: d.content };
    const resource = d.markdownRenderEnv.resource;
    if (resource) {
      if (r.isRouteSupplier(resource)) {
        // deno-lint-ignore no-explicit-any
        const routeUntyped = resource.route as any;
        if (isToDosDirectiveStateSupplier(routeUntyped)) {
          // this means we already created the TODOs state so let's append
          routeUntyped.contentTODOs.push(todo);
        } else {
          // this will inject the content TODOs into the resource and then
          // isToDosDirectiveStateSupplier(resource) will be proper guard
          routeUntyped.contentTODOs = [todo];
          // the following now makes resource's route a lds.LightningNavigationNotificationSupplier
          // which will get picked up in Lightning design system navigation
          routeUntyped.ldsNavNotification = new ToDoDirectiveNotification(
            routeUntyped,
          );
          if (!lds.isLightningNavigationNotificationSupplier(routeUntyped)) {
            diagnostic =
              `<br><mark>lds.isLightningNavigationNotificationSupplier(routeUntyped) is false for some reason</mark>`;
          }
        }
      }
    } else {
      diagnostic =
        `<br><mark>d.renderEnv.resource in ToDoDirective.encountered() is undefined</mark>`;
    }

    // deno-fmt-ignore
    return `<span class="slds-badge .slds-theme_success">
          <span class="slds-badge__icon slds-badge__icon_left">
            <span class="slds-icon_container slds-icon-utility-task slds-current-color" title="TODO for ${d.attributes?.for}">
              <svg class="slds-icon slds-icon_xx-small" aria-hidden="true">
                <use xlink:href="/assets/icons/utility-sprite/svg/symbols.svg#task"></use>
              </svg>
            </span>
          </span>
          ${d.attributes?.for}
        </span>
        <mark data-role="TODO" data-todo-for="${d.attributes?.for}">${d.content}</mark>${diagnostic || ''}\n`;
  }
}
