/** 护理措施 / 目标：动态表格行工具 */

export type ActionRow = {
  key: string;
  item_id: number;
  action_id?: number;
  action_content: string;
  checked?: boolean;
};

export type GoalRow = {
  key: string;
  item_id: number;
  goal_content: string;
  checked?: boolean;
};

let rowKeySeq = 0;
const nextKey = () => `row_${Date.now()}_${rowKeySeq++}`;

export const emptyActionRow = (checked = false): ActionRow => ({
  key: nextKey(),
  item_id: 0,
  action_content: "",
  checked,
});

export const emptyGoalRow = (checked = false): GoalRow => ({
  key: nextKey(),
  item_id: 0,
  goal_content: "",
  checked,
});

/** 按数据动态生成措施行；无数据时保留 1 行空行
 * GetPlanActionList: action_id / item_id / action_content
 */
export function buildActionRows(
  list?: Array<{
    action_id?: number;
    item_id?: number;
    action_content?: string;
    action_name?: string;
    item_name?: string;
  }> | null,
  withChecked = false,
): ActionRow[] {
  if (!list?.length) return [emptyActionRow(false)];
  const rows = list
    .map((item, idx) => {
      const action_content = (
        item.action_content ||
        item.action_name ||
        item.item_name ||
        ""
      ).trim();
      if (!action_content) return null;
      return {
        key: nextKey(),
        item_id: item.item_id ?? idx,
        ...(item.action_id != null ? { action_id: item.action_id } : {}),
        action_content,
        checked: withChecked,
      };
    })
    .filter(Boolean) as ActionRow[];
  return rows.length > 0 ? rows : [emptyActionRow(false)];
}

/** 按数据动态生成目标行；无数据时保留 1 行空行 */
export function buildGoalRows(
  list?: Array<{
    goal_content?: string;
    item_name?: string;
    item_id?: number;
  }> | null,
  withChecked = false,
): GoalRow[] {
  if (!list?.length) return [emptyGoalRow(false)];
  const rows = list
    .map((item, idx) => {
      const goal_content = (item.goal_content || item.item_name || "").trim();
      if (!goal_content) return null;
      return {
        key: nextKey(),
        item_id: item.item_id ?? idx,
        goal_content,
        checked: withChecked,
      };
    })
    .filter(Boolean) as GoalRow[];
  return rows.length > 0 ? rows : [emptyGoalRow(false)];
}

export function renumberActionRows(rows: ActionRow[]): ActionRow[] {
  return rows.map((row, idx) => ({ ...row, item_id: idx }));
}

export function renumberGoalRows(rows: GoalRow[]): GoalRow[] {
  return rows.map((row, idx) => ({ ...row, item_id: idx }));
}

export function addActionRow(rows: ActionRow[], index: number): ActionRow[] {
  const next = [...rows];
  next.splice(index + 1, 0, emptyActionRow(false));
  return renumberActionRows(next);
}

export function removeActionRow(rows: ActionRow[], index: number): ActionRow[] {
  if (rows.length <= 1) return [emptyActionRow(false)];
  return renumberActionRows(rows.filter((_, i) => i !== index));
}

export function addGoalRow(rows: GoalRow[], index: number): GoalRow[] {
  const next = [...rows];
  next.splice(index + 1, 0, emptyGoalRow(false));
  return renumberGoalRows(next);
}

export function removeGoalRow(rows: GoalRow[], index: number): GoalRow[] {
  if (rows.length <= 1) return [emptyGoalRow(false)];
  return renumberGoalRows(rows.filter((_, i) => i !== index));
}
