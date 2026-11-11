/** 与 ops 手术字典检索对齐的精简类型 */

import type { ApiResult } from "./comm";

export interface RetrieveOpsItemListReq {
  org_id?: number;
  catalog_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface OpsItemRow {
  item_id?: number;
  org_id?: number;
  catalog_id?: number;
  item_type?: string;
  item_name?: string;
  item_code?: string;
  item_code_system?: string;
  item_level?: number;
  item_grade?: string;
  item_score?: string;
  item_tag?: string;
  item_note?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveOpsItemListRes extends ApiResult {
  row_list?: OpsItemRow[];
}
