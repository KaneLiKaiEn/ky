/** 与 diag 接口对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface DiagRow {
  diag_id?: number;
  org_id?: number;
  visit_id?: number;
  diag_no?: string;
  diag_type?: string;
  diag_level?: number;
  serial_no?: string;
  body_position?: string;
  body_name?: string;
  body_code?: string;
  body_code_system?: string;
  diag_time?: string;
  diag_desc?: string;
  diag_name?: string;
  diag_code?: string;
  item_id?: number;
  diag_name2?: string;
  diag_code2?: string;
  item_id2?: number;
  diag_code_system?: string;
  diag_status?: string;
  diag_tag?: string;
  diag_note?: string;
  diag_catalog?: string;
  diag_stage?: string;
  diag_grade?: string;
  diag_degree?: string;
  diag_group?: string;
  create_time?: string;
  create_doctor_id?: number;
  create_doctor_name?: string;
  create_doctor_level?: string;
  confirm_time?: string;
  confirm_doctor_id?: number;
  confirm_doctor_name?: string;
  confirm_doctor_level?: string;
  check_time?: string;
  check_doctor_id?: number;
  check_doctor_name?: string;
  check_doctor_level?: string;
  check_tag?: string;
  check_note?: string;
  admission_issue?: string;
  treat_issue?: string;
  discharge_issue?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiagListReq {
  visit_id: number;
  /** 不传则返回全部类型 */
  diag_type?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  column_list?: string;
  column_diff?: string;
  column_evidence?: string;
  column_treat?: string;
}

export interface GetDiagListRes extends ApiResult {
  diag_list: DiagRow[];
}

export interface DiagItemRow {
  item_id: number;
  item_name: string;
  item_code: string;
  item_code_system?: string;
}

export interface RetrieveDiagItemListReq {
  org_id: number;
  retrieve_input: string;
  retrieve_limit: number;
}

export interface RetrieveDiagItemListRes extends ApiResult {
  row_list?: DiagItemRow[];
}

export interface AddDiagReq {
  visit_id: number;
  diag_type: string;
  diag_info: { diag_row: Partial<DiagRow> };
}

export type AddDiagRes = ApiResult;

export interface SaveDiagPropertyReq {
  diag_id: number;
  diag_property: Partial<DiagRow>;
}

export type SaveDiagPropertyRes = ApiResult;

export interface DeleteDiagReq {
  diag_id: number;
}

export type DeleteDiagRes = ApiResult;

export interface MoveDiagReq {
  diag_id: number;
}

export type MoveDiagRes = ApiResult;

export interface CloneDiagReq {
  visit_id: number;
  from_type: string;
  as_type: string;
  /** 克隆结果关联，与列表过滤、新增诊断的 link_* 一致 */
  link_name?: string;
  link_value?: number;
}

export type CloneDiagRes = ApiResult;

export type DiagApiType =
  | "ACTIVE"
  | "INIT"
  | "ADMISSION"
  | "DISCHARGE"
  | "CLINIC"
  | "PATHOLOGY"
  | "INJURY"
  | "DEAD"
  | "OPS_BEFORE"
  | "OPS"
  | "OPS_AFTER";

/** 中医诊断类型（GetDiagListTcm.diag_type） */
export type DiagTcmApiType =
  | "ACTIVE"
  | "CLINIC"
  | "INIT"
  | "ADMISSION"
  | "DISCHARGE";

/** 中医诊断行（GetDiagListTcm.diag_list） */
export interface DiagTcmRow {
  diag_id?: number;
  org_id?: number;
  visit_id?: number;
  diag_no?: string;
  diag_type?: string;
  diag_level?: number;
  serial_no?: string;
  body_position?: string;
  body_name?: string;
  body_code?: string;
  body_code_system?: string;
  diag_time?: string;
  bing_id?: number;
  bing_desc?: string;
  bing_name?: string;
  bing_code?: string;
  bing_code_system?: string;
  zheng_id?: number;
  zheng_desc?: string;
  zheng_name?: string;
  zheng_code?: string;
  zheng_code_system?: string;
  diag_status?: string;
  diag_tag?: string;
  diag_note?: string;
  diag_catalog?: string;
  diag_stage?: string;
  diag_grade?: string;
  diag_degree?: string;
  diag_group?: string;
  create_time?: string;
  create_doctor_id?: number;
  create_doctor_name?: string;
  create_doctor_level?: string;
  confirm_time?: string;
  confirm_doctor_id?: number;
  confirm_doctor_name?: string;
  confirm_doctor_level?: string;
  check_time?: string;
  check_doctor_id?: number;
  check_doctor_name?: string;
  check_doctor_level?: string;
  check_tag?: string;
  check_note?: string;
  admission_issue?: string;
  treat_issue?: string;
  discharge_issue?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiagListTcmReq {
  visit_id: number;
  /** 不传则返回全部类型 */
  diag_type?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
}

export interface GetDiagListTcmRes extends ApiResult {
  diag_list: DiagTcmRow[];
}

export interface SaveDiagPropertyTcmReq {
  diag_id: number;
  diag_property: Partial<DiagTcmRow>;
}

export type SaveDiagPropertyTcmRes = ApiResult;

export interface DeleteDiagTcmReq {
  diag_id: number;
}

export type DeleteDiagTcmRes = ApiResult;

export interface MoveDiagTcmReq {
  diag_id: number;
}

export type MoveDiagTcmRes = ApiResult;

export interface AddDiagTcmReq {
  visit_id: number;
  diag_type: string;
  diag_info: { diag_row: Partial<DiagTcmRow> };
}

export type AddDiagTcmRes = ApiResult;

export interface RetrieveBingListReq {
  org_id: number;
  retrieve_input: string;
  retrieve_limit: number;
}

export interface BingItemRow {
  item_id?: number;
  item_name?: string;
  item_code?: string;
  bing_id?: number;
  bing_name?: string;
  bing_code?: string;
}

export interface RetrieveBingListRes extends ApiResult {
  row_list?: BingItemRow[];
}

export interface RetrieveZhengListReq {
  org_id: number;
  retrieve_input: string;
  retrieve_limit: number;
}

export interface ZhengItemRow {
  item_id?: number;
  item_name?: string;
  item_code?: string;
  zheng_id?: number;
  zheng_name?: string;
  zheng_code?: string;
}

export interface RetrieveZhengListRes extends ApiResult {
  row_list?: ZhengItemRow[];
}
