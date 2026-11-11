/** 与 ordent.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface OrderListReq {
  ward_id: number;
}

export interface OrderListRow {
  order_id?: number | string;
  visit_id?: number | string;
}

export interface OrderListRes extends ApiResult {
  row_list?: OrderListRow[];
}
