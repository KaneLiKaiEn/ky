import dayjs from "dayjs";
import type { GetVisitOrderListReq, OrderRow } from "@/types/ordent";
import type { Dict2ItemRow } from "@/types/sys";
import {
  ORDER_STATUS_ALL,
  matchOrderStatusFilter,
  toOrderStatusParam,
} from "./orderStatusFilters";

export const ORDER_LIST_SORT_DICT_CODE = "inpatient.order.list.sort";

const STATUS_TOKEN_RE = /(\[-?[A-Z_]+\])/g;

export function getOrderListSortSelectValue(item: Dict2ItemRow): string {
  const id = item.row_id;
  return id != null ? String(id) : (item.item_code ?? "");
}

export function parseOrderStatusTokens(status?: string): string[] {
  if (!status?.trim()) return [];
  return [...status.matchAll(STATUS_TOKEN_RE)].map((m) => m[1]);
}

/**
 * 下拉框简单过滤：只要 statusQuery 包含 order_status 即可，即 [ORDER] 包含 ORDER
 */
export function matchOrderStatusTokenQuery(
  row: OrderRow,
  statusQuery?: string,
): boolean {
  if (!statusQuery?.trim()) return false;
  const orderStatus = (row.order_status ?? "").toUpperCase();
  if (!statusQuery.includes(orderStatus)) return false;
  return true;
}

/** Segmented 细分 + 快捷筛选 item_tag，二者都选时须满足一方即可 */
export function matchOrderListStatusFilter(
  row: OrderRow,
  segmentedStatus: string,
  listSortItem?: Dict2ItemRow | null,
): boolean {
  const sortTag = listSortItem?.item_tag?.trim();
  if (
    segmentedStatus &&
    segmentedStatus !== ORDER_STATUS_ALL &&
    !matchOrderStatusFilter(row, segmentedStatus) && 
    !matchOrderStatusTokenQuery(row, sortTag)
  ) {
    return false;
  } 
  return true;
}

/** 合并 Segmented 状态与字典 item_tag，去重保序 */
export function mergeOrderStatusParam(
  segmentedStatus: string,
  itemTag?: string,
): string | undefined {
  const fromSegment = toOrderStatusParam(segmentedStatus);
  const tokens = [
    ...parseOrderStatusTokens(fromSegment),
    ...parseOrderStatusTokens(itemTag?.trim()),
  ];
  if (tokens.length === 0) return undefined;
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    merged.push(token);
  }
  return merged.join("");
}

function isStopSortItem(itemTag?: string): boolean {
  return Boolean(itemTag?.includes("[STOP"));
}

/** item_value 为整数 N：起始日 = 今天减 N 天，结束日 = 今天（YYYY-MM-DD） */
function buildDayRangeFromItemValue(itemValue?: string): {
  start?: string;
  end?: string;
} {
  if (itemValue == null || itemValue.trim() === "") return {};
  const n = Number.parseInt(itemValue.trim(), 10);
  if (!Number.isFinite(n) || n < 0) return {};
  const end = dayjs().format("YYYY-MM-DD");
  const start = dayjs().subtract(n, "day").format("YYYY-MM-DD");
  return { start, end };
}

export type OrderListSortListExtras = Pick<
  GetVisitOrderListReq,
  "order_start" | "order_end" | "stop_start" | "stop_end" | "order_status"
>;

/** 字典快捷筛选项 → 列表请求附加参数（不含 visit 等基础字段） */
export function buildVisitOrderListSortExtras(
  segmentedStatus: string,
  item?: Dict2ItemRow | null,
): OrderListSortListExtras {
  if (!item) return {};

  const extras: OrderListSortListExtras = {};
  const mergedStatus = mergeOrderStatusParam(segmentedStatus, item.item_tag);
  if (mergedStatus) extras.order_status = mergedStatus;

  const { start, end } = buildDayRangeFromItemValue(item.item_value);
  if (start && end) {
    if (isStopSortItem(item.item_tag)) {
      extras.stop_start = start;
      extras.stop_end = end;
    } else {
      extras.order_start = start;
      extras.order_end = end;
    }
  }

  return extras;
}
