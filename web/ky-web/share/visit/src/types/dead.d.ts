/** 与 dead 接口对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface DeadRow {
  dead_id?: number;
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  dead_time?: string;
  dead_tag?: string;
  dead_note?: string;
}

export interface GetDeadPropertyReq {
  patient_id: number;
  column_list?: string;
}

export interface GetDeadPropertyRes extends ApiResult {
  dead_property?: DeadRow | null;
}
