/** 与 elem.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface ElemRow {
  elem_id?: number;
  elem_version?: number;
  org_id?: number;
  catalog_id?: number;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  elem_type?: string;
  elem_no?: string;
  elem_code?: string;
  elem_name?: string;
  elem_name_kb?: string;
  elem_name_last?: string;
  elem_name_last_kb?: string;
  elem_title?: string;
  elem_unit?: string;
  elem_score?: number;
  elem_tag?: string;
  elem_note?: string;
  value_type?: string;
  value_e?: number;
  value_length?: number;
  value_min?: string;
  value_max?: string;
  value_low?: string;
  value_high?: string;
  value_top?: string;
  value_bottom?: string;
  value_top_tip?: string;
  value_bottom_tip?: string;
  value_valid?: string;
  value_init?: string;
  value_text?: string;
  value_code?: string;
  value_code_system?: string;
  value_list?: string;
  value_option?: number;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ElemOptionRow {
  row_id?: number;
  elem_id?: number;
  elem_version?: number;
  group_id?: number;

  option_code?: string;
  option_code_system?: string;
  option_text?: string;
  option_score?: number;
  option_tag?: string;
  option_note?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ElemOptionSubRow {
  row_id?: number;
  elem_id?: number;
  elem_version?: number;
  option_code?: string;

  sub_code?: string;
  sub_code_system?: string;
  sub_text?: string;
  sub_score?: number;
  sub_tag?: string;
  sub_note?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetElemProperty2Req {
  id_list?: number[];
  column_list?: string;
}

export interface GetElemProperty2Res extends ApiResult {
  elem_list?: ElemRow[];
}

export interface GetVisitInitValueReq {
  visit_id?: number;
  baby_id?: number;
  entry_id?: number;
  section_id?: number;
  row_no?: number;
  row_id?: string;
  elem_id?: number;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
}

export interface GetVisitInitValueRes extends ApiResult {
  value_text?: string;
  value_code?: string;
  value_code_system?: string;
  value_tag?: string;
  value_note?: string;
}

export interface GetElemOptionListReq {
  elem_id?: number;
  elem_version?: number;
  group_id?: number;
  expand_item?: boolean;
  column_list?: string;
}

export interface GetElemOptionListRes extends ApiResult {
  row_list?: ElemOptionRow[];
}

export interface GetElemOptionList2Req {
  elem_id_list?: number[];
  column_list?: string;
}

export interface GetElemOptionList2Res extends ApiResult {
  row_list?: ElemOptionRow[];
}

export interface GetElemOptionSubListReq {
  elem_id?: number;
  elem_version?: number;
  option_code?: string;

  column_list?: string;
}

export interface GetElemOptionSubListRes extends ApiResult {
  row_list?: ElemOptionSubRow[];
}
