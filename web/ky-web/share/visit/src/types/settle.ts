/** 与 settle 服务对齐的类型 */

import type { ApiResult } from "./comm";

/** settle/getSettleList3 */
export interface GetSettleList3Req {
  org_id: number;
  visit_id_list: number[];
  bill_type?: string;
  settle_tag?: string;
  column_list?: string;
}

export interface SettleList3Row {
  visit_id?: number;
  settle_tag?: string;
  settle_status?: string;
}

export interface GetSettleList3Res extends ApiResult {
  settle_list?: SettleList3Row[];
}
