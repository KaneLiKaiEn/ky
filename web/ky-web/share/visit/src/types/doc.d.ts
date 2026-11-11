/** 与 doc.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface DocNameRow {
  name_id?: number;
  parent_id?: number;
  org_id?: number;
  type_id?: number;

  doc_name?: string;
  doc_code?: string;
  doc_code_system?: string;
  assess_system?: string;
  assess_method?: string;
  assess_score?: number;

  visit_type?: string;
  work_type?: string;
  order_type?: string;
  order_catalog?: string;
  link_name?: string;
  sys_tag?: string;

  visit_min?: number;
  visit_max?: number;
  baby_min?: number;
  baby_max?: number;
  link_min?: number;
  link_max?: number;

  sort_no?: string;
  sort_no_discharge?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDocNamePropertyReq {
  name_id?: number;

  owner_type?: string;
  owner_id?: number;
  doc_type?: string;
  doc_name?: string;

  column_list?: string;
}

export interface GetDocNamePropertyRes extends ApiResult {
  name_property?: DocNameRow;
}

export interface GetDocAssessResultReq {
  // 优先
  name_id?: number;
  tag_id?: number;

  // 其次
  owner_type?: string;
  owner_id?: number;
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;

  assess_score?: number;
}

export interface GetDocAssessResultRes extends ApiResult {
  assess_result?: string;
  assess_color?: string;
  assess_next?: number;
  assess_tag?: string;
  assess_note?: string;
  problem_type?: string;
  problem_id?: number;
  problem_name?: string;

  script_type?: number;
  script_content?: string;
}

/** doc/visit/RebuildVisitDoc，不在 Doc service proto 中 */
export interface RebuildVisitDocReq {
  /** 优先 */
  doc_id?: number;

  /** 次之：EMR, REC, APPLY, RX */
  owner_type?: string;
  owner_id?: number;
}

export interface RebuildVisitDocRes extends ApiResult {
  doc_id?: number;
}
export interface SavePrintDocReq {
  /** EMR, REC, APPLY, RX */
  owner_type?: string;
  owner_id?: number;
  visit_id?: number;
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  print_time?: string;
}

export type SavePrintDocRes = ApiResult;

export interface DocTypeRow {
  type_id?: number;
  org_id?: number;
  doc_type?: string;
  owner_type?: string;
  owner_id?: number;
  visit_type?: string;
  work_type?: string;
  order_type?: string;
  order_catalog?: string;
  link_name?: string;
  sys_tag?: string;
  sort_no?: string;
  sort_no_discharge?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDocTypeListReq {
  org_id?: number;
  /** CLINIC(default), WORK */
  owner_type?: string;
  owner_id?: number;
  column_list?: string;
}

export interface GetDocTypeListRes extends ApiResult {
  row_list?: DocTypeRow[];
}

export interface GetDocNameListReq {
  org_id?: number;
  type_id?: number;
  owner_type?: string;
  owner_id?: number;
  doc_type?: string;
  only_link?: boolean;
  exclude_link?: boolean;
  column_list?: string;
  column_type?: string;
}

export interface GetDocNameListRes extends ApiResult {
  row_list?: DocNameRow[];
  type_list?: DocTypeRow[];
}

export interface GetPrintDocListReq {
  visit_id?: number;
  doc_id?: number;
  owner_type?: string;
  owner_id?: number;
  column_list?: string;
}

export interface PrintDocRow {
  print_id?: number;
  doc_id?: number;
  doc_no?: string;
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;
  owner_type?: string;
  owner_id?: number;

  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;
  doc_title?: string;

  link_name?: string;
  link_value?: number;
  link_tag?: string;
  link_data?: string;
  link_ext?: string;

  print_time?: string;
  print_name?: string;
  print_copy?: number;
  print_tag?: string;
  print_note?: string;
  print_user_id?: number;
  print_user_name?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPrintDocListRes extends ApiResult {
  row_list?: PrintDocRow[];
}
