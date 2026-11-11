import type { OrderRow } from "@/types/ordent";
import type { OrderWorkspaceKind } from "./orderCatalogFilters";
import { orderStatusLabel } from "./orderStatus";

/** 头部状态 Segmented「全部」哨兵值 */
export const ORDER_STATUS_ALL = "__all__";

/**
 * 前端细分过滤值 → 后端 order_status。
 * 校对 / 执行都落在 ORDER_COMMIT，停止 / 结束都落在 STOP_COMMIT。
 */
const BACKEND_STATUS_BY_FILTER: Record<string, string> = {
  DRAFT: "DRAFT",
  ORDER: "ORDER",
  ORDER_COMMIT: "ORDER_COMMIT",
  ORDER_COMMIT_VERIFY: "ORDER_COMMIT",
  ORDER_COMMIT_EXEC: "ORDER_COMMIT",
  ORDER_RETURN: "ORDER_RETURN",
  STOP_COMMIT: "STOP_COMMIT",
  CANCEL: "CANCEL",
};

/** 与 orderStatusLabel 展示文案对齐，用于回包后按时间细分 */
const DISPLAY_LABELS_BY_FILTER: Record<string, string[]> = {
  DRAFT: ["草稿"],
  ORDER: ["已下达"],
  ORDER_COMMIT: ["已提交"],
  ORDER_COMMIT_VERIFY: ["已校对"],
  ORDER_COMMIT_EXEC: ["已执行"],
  ORDER_RETURN: ["已退回"],
  STOP_COMMIT: ["已停止", "已结束"],
  CANCEL: ["作废", "已作废"],
};

const COMMON_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "下达", value: "ORDER" },
  { label: "提交", value: "ORDER_COMMIT" },
  { label: "校对", value: "ORDER_COMMIT_VERIFY" },
];

const withAll = (options: { label: string; value: string }[]) => [
  { label: "全部", value: ORDER_STATUS_ALL },
  ...options,
];

/** 长期医嘱：有停止，无执行 */
const LONG_TERM_STATUS_OPTIONS = withAll([
  ...COMMON_STATUS_OPTIONS,
  { label: "退回", value: "ORDER_RETURN" },
  { label: "停止", value: "STOP_COMMIT" },
  { label: "作废", value: "CANCEL" },
]);

/** 临时医嘱 / 出院带药：有执行，无停止 */
const TEMPORARY_LIKE_STATUS_OPTIONS = withAll([
  ...COMMON_STATUS_OPTIONS,
  { label: "执行", value: "ORDER_COMMIT_EXEC" },
  { label: "退回", value: "ORDER_RETURN" },
  { label: "作废", value: "CANCEL" },
]);

export const ORDER_STATUS_FILTERS: Record<
  OrderWorkspaceKind,
  { label: string; value: string }[]
> = {
  longTerm: LONG_TERM_STATUS_OPTIONS,
  temporary: TEMPORARY_LIKE_STATUS_OPTIONS,
  discharge: TEMPORARY_LIKE_STATUS_OPTIONS,
};

/**
 * Segmented 选中值 → 请求参数。
 * 校对 / 执行会转成 `[ORDER_COMMIT]`；单选：`[ORDER]`；多状态拼接预留：`[ORDER][STOP]`。
 */
export const toOrderStatusParam = (status: string) => {
  if (status === ORDER_STATUS_ALL || !status) return undefined;
  if (status.startsWith("[")) return status;
  const backend = BACKEND_STATUS_BY_FILTER[status] ?? status;
  return `[${backend}]`;
};

/** 多状态拼接（供后续多选扩展） */
export const joinOrderStatusParams = (statuses: string[]) => {
  const normalized = statuses
    .map((s) => toOrderStatusParam(s))
    .filter(Boolean) as string[];
  if (normalized.length === 0) return undefined;
  return normalized.join("");
};

/** 按 orderStatusLabel 的时间规则，对后端回包做前端细分过滤 */
export function matchOrderStatusFilter(row: OrderRow, filter: string): boolean {
  if (!filter || filter === ORDER_STATUS_ALL) return true;
  const labels = DISPLAY_LABELS_BY_FILTER[filter];
  if (!labels) return true;
  return labels.includes(orderStatusLabel(row.order_status, row));
}
