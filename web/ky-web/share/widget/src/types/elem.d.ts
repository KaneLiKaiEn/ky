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


export interface GetElemProperty2Req {
    id_list?: number[];
    column_list?: string;
  }
  
  export interface GetElemProperty2Res extends ApiResult {
    elem_list?: ElemRow[];
  }