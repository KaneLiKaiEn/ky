import type { OrderRow } from "@/types/ordent";
import type { OrderWorkspaceKind } from "./orderCatalogFilters";

/** 规范化 order_status（去掉方括号，取主状态词） */
export function normalizeOrderStatus(status?: string): string {
  if (!status) return "";
  const upper = status.toUpperCase();
  const known = [
    "ORDER_COMMIT",
    "ORDER_RETURN",
    "STOP_COMMIT",
    "DRAFT",
    "ORDER",
    "STOP",
    "CANCEL",
  ] as const;
  for (const key of known) {
    if (upper.includes(key)) return key;
  }
  return upper.replace(/[\[\]]/g, "").trim();
}

/** 草稿：仅可删除 */
export function isDraftStatus(status?: string): boolean {
  return normalizeOrderStatus(status) === "DRAFT";
}

/** 已下达（含退回）：可提交、删除 */
export function isOrderedStatus(status?: string): boolean {
  const s = normalizeOrderStatus(status);
  return s === "ORDER" || s === "ORDER_RETURN";
}

/** 已提交：可取消提交、取消医嘱 */
export function isCommittedStatus(status?: string): boolean {
  return normalizeOrderStatus(status) === "ORDER_COMMIT";
}

/** 终态：无操作（STOP_COMMIT 可撤销停止，不算完全终态） */
export function isTerminalStatus(status?: string): boolean {
  const s = normalizeOrderStatus(status);
  return s === "STOP" || s === "CANCEL";
}

export function canCommitOrder(row: OrderRow): boolean {
  return row.order_id != null && isOrderedStatus(row.order_status);
}

export function canDeleteOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    (isDraftStatus(row.order_status) || isOrderedStatus(row.order_status))
  );
}

export function canUndoCommitOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    isCommittedStatus(row.order_status) &&
    // 两者时间都为空时才可撤销提交
    (!row.exec_time && !row.verify_time)
  );
}

export function canCancelOrder(row: OrderRow): boolean {
  return row.order_id != null && isCommittedStatus(row.order_status);
}

const hasTimeValue = (value?: string) =>
  typeof value === "string" ? value.trim().length > 0 : Boolean(value);

/** 长期医嘱：已提交且未终态，可停止（批量停止沿用此条件） */
export function canStopOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    isCommittedStatus(row.order_status) &&
    hasTimeValue(row.verify_time) &&
    !hasTimeValue(row.stop_time)
  );
}

/** 单条停止：已提交、已校对（有 verify_time）且尚未停止 */
export function canDoctorStopOrder(row: OrderRow): boolean {
  return canStopOrder(row);
}

/** 已停止（STOP_COMMIT）：可撤销停止 */
export function canUndoStopOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    normalizeOrderStatus(row.order_status) === "STOP_COMMIT"
  );
}

/** 只有在草稿和已下达状态可以进行编辑 */
export function canEditOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    ["DRAFT", "ORDER", "ORDER_RETURN"].includes(
      normalizeOrderStatus(row.order_status),
    )
  );
}

/** 护士：已提交且未校对 → 通过 / 退回 */
export function canNurseVerifyOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    isCommittedStatus(row.order_status) &&
    !hasTimeValue(row.verify_time)
  );
}

/** 护士：已校对且未执行且没有停止时间 → 取消通过 */
export function canNurseUndoVerifyOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    hasTimeValue(row.verify_time) &&
    !hasTimeValue(row.exec_time) &&
    !hasTimeValue(row.stop_time) &&
    row.order_status !== "CANCEL"
  );
}

/** 护士：非长期医嘱且已提交/校对且未执行 → 执行 */
export function canNurseExecOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    row.order_type !== "长期医嘱" &&
    isCommittedStatus(row.order_status) &&
    hasTimeValue(row.verify_time) &&
    !hasTimeValue(row.exec_time)
  );
}

/** 护士：医生已停嘱且护士未确认停止 → 停止 */
export function canNurseEndOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    hasTimeValue(row.stop_time) &&
    !hasTimeValue(row.end_time)
  );
}

/** 护士：作废态且未确认作废 → 作废 */
export function canNurseTerminateOrder(row: OrderRow): boolean {
  return (
    row.order_id != null &&
    normalizeOrderStatus(row.order_status) === "CANCEL" &&
    !hasTimeValue(row.terminate_time)
  );
}

export function orderStatusLabel(status?: string, row?: OrderRow): string {
  switch (normalizeOrderStatus(status)) {
    case "DRAFT":
      return "草稿";
    case "ORDER":
      return "已下达";
    case "ORDER_COMMIT":
      if (row?.exec_time) {
        return "已执行";
      } else if (row?.verify_time) {
        return "已校对";
      }
      return "已提交";
    case "ORDER_RETURN":
      return "已退回";
    case "STOP_COMMIT":
      if (hasTimeValue(row?.end_time)) {
        return "已结束";
      }
      return "已停止";
    case "CANCEL":
      // 如果医嘱已作废，并且有 terminate_time ，则显示已作废，否则显示作废
      if (row?.terminate_time) {
        return "已作废";
      }
      return "作废";
    default:
      return status || "-";
  }
}

/** antd Tag 预设色，便于列表一眼区分状态 */
export function orderStatusTagColor(
  status?: string,
): "default" | "processing" | "success" | "warning" | "error" | "purple" {
  switch (normalizeOrderStatus(status)) {
    case "DRAFT":
      return "default";
    case "ORDER":
      return "processing";
    case "ORDER_COMMIT":
      return "success";
    case "ORDER_RETURN":
      return "warning";
    case "STOP":
    case "STOP_COMMIT":
      return "purple";
    case "CANCEL":
      return "error";
    default:
      return "default";
  }
}

/** 列表行背景语义色（对应 OrderListTableView 的 tr className） */
export const ORDER_STATUS_ROW_CLASS = {
  verified: "bg-(--app-theme-success-bg)!",
  executing: "bg-(--app-theme-primary-bg)!",
  stopped: "bg-(--app-theme-purple-bg)!",
  executed: "bg-(--app-theme-info-bg)!",
  voided: "bg-(--app-theme-error-bg)!",
  /** 执行单已计费（charge_time 有值） */
  charged: "bg-(--app-theme-warning-bg)!",
} as const;

/**
 * 按工作台 kind + 医嘱状态返回行样式 class；无额外样式时返回空字符串。
 * 不改变状态 Tag / 操作按钮等既有逻辑，仅用于表格行底色区分。
 */
/** 执行单是否已执行（implement_status 含 EXEC） */
export function isImplementExecuted(implementStatus?: string): boolean {
  if (!implementStatus) return false;
  return implementStatus.toUpperCase().includes("EXEC");
}

export function orderStatusRowClassName(
  row: OrderRow,
  kind?: OrderWorkspaceKind,
): string {
  if (row.order_id == null) return "";

  const normalized = normalizeOrderStatus(row.order_status);
  const label = orderStatusLabel(row.order_status, row);

  if (kind === "longTerm") {
    if (
      normalized === "STOP" ||
      normalized === "STOP_COMMIT" ||
      label === "已停止" ||
      label === "已结束"
    ) {
      return ORDER_STATUS_ROW_CLASS.stopped;
    }
    // 校对后、停嘱前：正在执行的长期医嘱
    if (
      isCommittedStatus(row.order_status) &&
      hasTimeValue(row.verify_time) &&
      !hasTimeValue(row.stop_time)
    ) {
      return ORDER_STATUS_ROW_CLASS.executing;
    }
    // 已校对（含医生已停嘱、待护士确认停止等仍展示「已校对」的阶段）
    if (label === "已校对") {
      return ORDER_STATUS_ROW_CLASS.verified;
    }
    return "";
  }

  if (kind === "temporary" || kind === "discharge") {
    if (["已作废", "作废"].includes(label)) {
      return ORDER_STATUS_ROW_CLASS.voided;
    }
    // 临时医嘱只有在 执行单 已执行 的情况下才展示 已执行的淡蓝色底色(bg-(--app-theme-info-bg)!)
    // 出院带药仍然保持不动， label 是 已执行 就展示 已执行的底色
    if (label === "已执行" && kind === "discharge") {
      return ORDER_STATUS_ROW_CLASS.executed;
    }
    if (label === "已校对") {
      return ORDER_STATUS_ROW_CLASS.verified;
    }
    return "";
  }

  return "";
}
