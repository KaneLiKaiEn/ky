/** 与 elem.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface ElemRow {
  elem_id?: number;
  elem_no?: string;
  elem_code?: string;
  elem_name?: string;
  elem_unit?: string;
  elem_tag?: string;
  elem_note?: string;
  value_init?: string;
  sort_no?: string;
}

export interface RetrieveElemListReq {
  org_id?: number;
  elem_type?: string;
  elem_tag?: string;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveElemListRes extends ApiResult {
  row_list?: ElemRow[];
}
