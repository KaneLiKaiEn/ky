/** 与 visit.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface VisitPropertyRow {
  visit_id?: number;
  visit_info?: string;
}

export interface GetVisitProperty2Req {
  visit_id_list: number[];
  column_visit?: string;
}

export interface GetVisitProperty2Res extends ApiResult {
  visit_list?: VisitPropertyRow[];
}
