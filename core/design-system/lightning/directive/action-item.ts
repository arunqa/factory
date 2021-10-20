import * as govn from "../../../../governance/mod.ts";
import * as aiM from "../../../model/action-item.ts";
import * as m from "../../../../core/std/model.ts";
import * as mdDS from "../../../render/markdown/mod.ts";
import * as lds from "../mod.ts";

export interface RegisterActionItemsOptions {
  readonly onInvalidResource?: (diagnostics: string) => void;
  readonly onInvalidModel?: (diagnostics: string) => void;
  readonly constructNotification?: (
    ais: aiM.ActionItemsSupplier,
  ) => lds.LightningNavigationNotification | undefined;
  readonly onNotificationAssignmentFailed?: (diagnostic: string) => void;
}

export function registerActionItems<Resource>(
  resource: Resource,
  options: RegisterActionItemsOptions | undefined,
  ...actionItems: aiM.ActionItem[]
): void {
  const notification = options?.constructNotification || ((
    ais: aiM.ActionItemsSupplier,
  ): lds.LightningNavigationNotification => {
    return {
      count: () => ais.actionItems.length,
      identity: aiM.ToDoActionItem,
      icon: "task",
      assistiveText: "Action Item",
    };
  });

  if (m.isModelSupplier(resource)) {
    if (aiM.isActionItemsSupplier(resource.model)) {
      // there's already an action item being tracked, let's just add it;
      // resource.route isLightningNavigationNotificationSupplier will
      // be true and resource.model.contentTODOs is referenced in that
      // instance so adding it contentTODOs.push(todo) will update it.
      resource.model.actionItems.push(...actionItems);
    } else {
      // this is the first action item so let's create the array and track in Model
      resource.model.actionItems = actionItems;
      if (!aiM.isActionItemsModelSupplier(resource)) {
        if (options?.onInvalidModel) {
          options.onInvalidModel(
            "isActionItemsModelSupplier(resource) is false for some reason",
          );
        }
        return;
      }

      // the following now makes resource's route a lds.LightningNavigationNotificationSupplier
      // which will get picked up in Lightning design system navigation to show notification
      // values in navigation and other components
      const instance = notification(resource.model);
      if (instance) {
        lds.prepareNotifications(
          resource.model,
          () => ({
            collection: [instance],
          }),
          (lnn) => lds.mergeNotifications(instance, lnn),
          options?.onNotificationAssignmentFailed,
        );
      }
    }
  } else {
    if (options?.onInvalidResource) {
      options.onInvalidResource(
        "m.isModelSupplier(resource) is false in ToDoDirective.encountered",
      );
    }
  }
}

export class ActionItemDirective implements
  govn.DirectiveExpectation<
    mdDS.MarkdownContentInlineDirective<aiM.ActionItemDirectiveAttrs<string>>,
    string | undefined
  > {
  readonly identity = aiM.ToDoActionItem;

  encountered(
    d: mdDS.MarkdownContentInlineDirective<
      aiM.ActionItemDirectiveAttrs<string>
    >,
  ): string | undefined {
    let diagnostic: string | undefined = undefined;
    const resource = d.markdownRenderEnv.resource;
    if (resource) {
      const todo: aiM.ActionItem = {
        ...d.attributes,
        type: aiM.ToDoActionItem,
        subject: d.content,
      };
      const diagnose = (message: string) => {
        diagnostic = `<mark>${message}</mark>`;
      };
      registerActionItems(resource, {
        onInvalidResource: diagnose,
        onInvalidModel: diagnose,
        onNotificationAssignmentFailed: diagnose,
      }, todo);
    } else {
      diagnostic =
        `<br><mark>d.renderEnv.resource in ToDoDirective.encountered() is undefined in ToDoDirective.encountered</mark>`;
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

export interface RouteNodeActionItem {
  readonly node: govn.RouteTreeNode;
  readonly todo: aiM.ActionItem;
}

export function routeNodesActionItems(
  nodes: govn.RouteTreeNode[],
  accumulate: RouteNodeActionItem[],
  options?: {
    readonly recurse: boolean;
  },
): void {
  const actions = (
    parentRTN: govn.RouteTreeNode,
    recurse?: boolean,
  ) => {
    if (recurse) {
      parentRTN.walk((rtn) => {
        if (aiM.isActionItemsModelSupplier(rtn)) {
          accumulate.push(
            ...(rtn.model.actionItems.map((todo) => ({ todo, node: rtn }))),
          );
        }
        return true;
      });
    }
    if (lds.isLightningNavigationNotificationSupplier(parentRTN)) {
      if (aiM.isActionItemsModelSupplier(parentRTN)) {
        accumulate.push(
          ...(parentRTN.model.actionItems.map((todo) => ({
            todo,
            node: parentRTN,
          }))),
        );
      }
    }
    return accumulate;
  };

  for (const node of nodes) {
    actions(node, options?.recurse);
  }
}

export function activeRouteNodeActionItems(
  activeNode: govn.RouteTreeNode | undefined,
): RouteNodeActionItem[] {
  let actionNodes: govn.RouteTreeNode[] | undefined;
  if (activeNode?.unit == lds.indexUnitName) {
    actionNodes = activeNode?.parent
      ? [...activeNode.parent.children, ...activeNode.children]
      : activeNode.children;
  } else if (activeNode) {
    actionNodes = activeNode.children;
  }
  const actionItems: RouteNodeActionItem[] = [];
  if (actionNodes) {
    routeNodesActionItems(actionNodes, actionItems, {
      recurse: true,
    });
  }
  return actionItems;
}
