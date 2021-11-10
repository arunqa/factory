import * as safety from "../../lib/safety/mod.ts";
import * as govn from "../../governance/mod.ts";
import * as m from "../../core/std/model.ts";

export const ToDoActionItem = "todo" as const;
export const LintIssueActionItem = "lint-issue" as const;

export type ActionItemType = typeof ToDoActionItem | typeof LintIssueActionItem;

export interface ActionItemDirectiveAttrs<Type extends string> {
  readonly type: Type;
  readonly for?: string;
}

export interface ActionItem extends ActionItemDirectiveAttrs<ActionItemType> {
  readonly subject: string;
}

export interface ActionItemsSupplier {
  readonly actionItems: ActionItem[];
}

export const isActionItemsSupplier = safety.typeGuard<
  ActionItemsSupplier
>("actionItems");

export function isActionItemsModelSupplier(
  o: unknown,
): o is govn.ModelSupplier<ActionItemsSupplier> {
  if (m.isModelShapeSupplier(o, isActionItemsSupplier)) {
    return o.model.actionItems && o.model.actionItems.length > 0;
  }
  return false;
}
