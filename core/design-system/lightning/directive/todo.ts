import { safety } from "../../../deps.ts";
import * as govn from "../../../../governance/mod.ts";
import * as r from "../../../../core/std/route.ts";
import * as m from "../../../../core/std/model.ts";
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

export function isContentTODOsModelSupplier(
  o: unknown,
): o is govn.ModelSupplier<ToDosDirectiveStateSupplier> {
  if (m.isModelShapeSupplier(o, isToDosDirectiveStateSupplier)) {
    return o.model.contentTODOs && o.model.contentTODOs.length > 0;
  }
  return false;
}

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
      if (m.isModelSupplier(resource)) {
        if (isToDosDirectiveStateSupplier(resource.model)) {
          // there's already a TODO being tracked, let's just add it
          resource.model.contentTODOs.push(todo);
        } else {
          // this is the first TODO so let's create the array and track as Model
          resource.model.contentTODOs = [todo];
          if (!isContentTODOsModelSupplier(resource)) {
            diagnostic =
              `<br><mark>isContentTODOsModelSupplier(resource.model) is false for some reason</mark>`;
            return;
          }
          if (r.isRouteSupplier(resource)) {
            // the following now makes resource's route a lds.LightningNavigationNotificationSupplier
            // which will get picked up in Lightning design system navigation to show notification
            // values in navigation and other components
            // deno-lint-ignore no-explicit-any
            (resource.route as any).ldsNavNotification =
              new ToDoDirectiveNotification(
                resource.model,
              );
            if (
              !lds.isLightningNavigationNotificationSupplier(resource.model)
            ) {
              diagnostic =
                `<br><mark>lds.isLightningNavigationNotificationSupplier(resource.model) is false for some reason</mark>`;
            }
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
