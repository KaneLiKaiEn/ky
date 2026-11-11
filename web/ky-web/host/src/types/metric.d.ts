/** 与 metric.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface LibRow {
  lib_id?: number;
  org_id?: number;

  lib_no?: string;
  lib_code?: string;
  lib_name?: string;
  lib_date?: string;
  lib_tag?: string;
  lib_note?: string;

  metric_count?: number;

  icon_system?: string;
  icon_name?: string;

  board_id?: number;
  board_name?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetLibListReq {
  org_id: number;
  column_list?: string;
}

export interface GetLibListRes extends ApiResult {
  row_list?: LibRow[];
}
