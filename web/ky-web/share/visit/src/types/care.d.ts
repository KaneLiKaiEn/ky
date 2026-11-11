/** 与 care.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface CareRow {
  care_id?: number;
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;
  user_id?: number;
  user_name?: string;
  care_type?: string;
  care_time?: string;
  care_content?: string;
  care_order?: string;
  care_tag?: string;
  care_note?: string;
  care_status?: string;
  care_level?: number;
  health_level?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
}

export interface GetCareListReq {
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;
  care_type?: string;
  care_start?: string;
  care_end?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  column_list?: string;
}

export interface GetCareListRes extends ApiResult {
  row_list?: CareRow[];
}

export interface NewCareReq {
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;
  user_id?: number;
  user_name?: string;
  care_type?: string;
  care_time?: string;
  care_content?: string;
  care_order?: string;
  care_tag?: string;
  care_note?: string;
  care_status?: string;
  care_level?: number;
  health_level?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
}

export interface NewCareRes extends ApiResult {
  care_id?: number;
}

export interface SaveCarePropertyReq {
  care_id: number;
  care_property: CareRow;
}

export interface SaveCarePropertyRes extends ApiResult {}

export interface DeleteCareReq {
  care_id: number;
}

export interface DeleteCareRes extends ApiResult {}
