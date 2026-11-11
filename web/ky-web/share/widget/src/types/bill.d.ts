import type { ApiResult } from "./comm";

/** bill/GetBillAccount：按就诊取记费 / 扣费金额 */
export interface GetBillAccountReq {
  org_id?: number;
  visit_id?: number;
  /** 缺省=诊疗，*=全部 */
  bill_type?: string;
}

export interface GetBillAccountRes extends ApiResult {
  /** decimal.2 未扣费（待扣金额） */
  bill_amount?: string;
  /** decimal.2 已扣费 */
  charge_amount?: string;
}

/** bill/GetBillAccount2：按就诊批量取记费 / 扣费金额 */
export interface GetBillAccount2Req {
  org_id?: number;
  visit_id_list?: number[];
  /** 缺省=诊疗，*=全部 */
  bill_type?: string;
}

export interface GetBillAccount2Res extends ApiResult {
  /** 与 visit_id_list 顺序一一对应：未扣费 */
  bill_amount?: string[];
  /** 与 visit_id_list 顺序一一对应：已扣费 */
  charge_amount?: string[];
}
