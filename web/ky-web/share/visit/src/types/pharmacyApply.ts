import type { ApiResult } from "./comm";

/** pharmacy/apply/GetApplyDetail：按就诊拉取摆药明细 */
export interface GetApplyDetailByVisitReq {
  visit_id: number;
}

export interface ApplyDetailRow {
  apply_id?: number;
  order_id?: number;
  visit_id?: number;
}

export interface GetApplyDetailByVisitRes extends ApiResult {
  row_list?: ApplyDetailRow[];
}

/** pharmacy/apply/GetApplyProperty：摆药单属性 */
export interface GetApplyPropertyReq {
  apply_id: number;
}

export interface ApplyProperty {
  apply_id?: number;
  apply_status?: string;
}

export interface GetApplyPropertyRes extends ApiResult {
  apply_property?: ApplyProperty;
}
