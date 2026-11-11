import {
  getApplyDetailByVisitAPI,
  getApplyPropertyAPI,
} from "@/api/pharmacyApply";
import type { OrderRow } from "@/types/ordent";

function toPositiveId(value: unknown): number | undefined {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(id) || id <= 0) return undefined;
  return id;
}

/** apply_status 为 DELIVERY（或 [DELIVERY]）视为已摆 */
export function isApplyDelivered(applyStatus?: string): boolean {
  if (!applyStatus) return false;
  const upper = applyStatus.toUpperCase().trim();
  return upper === "DELIVERY" || upper.includes("[DELIVERY]");
}

/**
 * 出院带药摆药状态。
 * 用 GetApplyDetail 的 order_id 对齐当前医嘱，去重 apply_id 后查 GetApplyProperty。
 * 同一医嘱对应的摆药单里只要有一张 apply_status 为 DELIVERY，即已摆。
 */
export async function loadDispensedOrderIds(
  visitId: number,
  orderRows: readonly OrderRow[],
): Promise<Set<number>> {
  const orderIds = new Set<number>();
  for (const row of orderRows) {
    const orderId = toPositiveId(row.order_id);
    if (orderId != null) orderIds.add(orderId);
  }
  if (orderIds.size === 0) return new Set();

  const detailRes = await getApplyDetailByVisitAPI({ visit_id: visitId });
  if (detailRes.code !== 0) {
    console.error(
      "获取摆药明细失败:",
      detailRes.message || detailRes.hint || detailRes.code,
    );
    return new Set();
  }

  const applyIdsByOrderId = new Map<number, Set<number>>();
  const applyIds = new Set<number>();
  for (const row of detailRes.row_list ?? []) {
    const orderId = toPositiveId(row.order_id);
    const applyId = toPositiveId(row.apply_id);
    if (orderId == null || applyId == null || !orderIds.has(orderId)) continue;
    applyIds.add(applyId);
    const linked = applyIdsByOrderId.get(orderId) ?? new Set<number>();
    linked.add(applyId);
    applyIdsByOrderId.set(orderId, linked);
  }
  if (applyIds.size === 0) return new Set();

  const deliveredApplyIds = new Set<number>();
  await Promise.all(
    [...applyIds].map(async (applyId) => {
      try {
        const res = await getApplyPropertyAPI({ apply_id: applyId });
        if (res.code !== 0) {
          console.error(
            "获取摆药单属性失败:",
            res.message || res.hint || res.code,
          );
          return;
        }
        if (isApplyDelivered(res.apply_property?.apply_status)) {
          deliveredApplyIds.add(applyId);
        }
      } catch (error) {
        console.error("获取摆药单属性失败:", error);
      }
    }),
  );

  const dispensedOrderIds = new Set<number>();
  for (const [orderId, linkedApplyIds] of applyIdsByOrderId) {
    for (const applyId of linkedApplyIds) {
      if (deliveredApplyIds.has(applyId)) {
        dispensedOrderIds.add(orderId);
        break;
      }
    }
  }
  return dispensedOrderIds;
}
