import * as safety from "../../../../lib/safety/mod.ts";
import * as govn from "../../../../governance/mod.ts";
import * as aiM from "../../../model/action-item.ts";
import * as htmlDS from "../../../render/html/mod.ts";
import * as notif from "../../../../lib/notification/mod.ts";

export interface RouteNodeActionItem {
  readonly node: govn.RouteTreeNode;
  readonly actionItem: aiM.ActionItem;
}

export const isRouteNodeActionItem = safety.typeGuard<RouteNodeActionItem>(
  "node",
  "actionItem",
);

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
            ...(rtn.model.actionItems.map((actionItem) => ({
              actionItem,
              node: rtn,
            }))),
          );
        }
        return true;
      });
    }
    if (notif.isNotificationsSupplier(parentRTN)) {
      if (aiM.isActionItemsModelSupplier(parentRTN)) {
        accumulate.push(
          ...(parentRTN.model.actionItems.map((actionItem) => ({
            actionItem,
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
  if (activeNode?.unit == htmlDS.indexUnitName) {
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
