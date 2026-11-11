/** 与 allergy.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface AllergyRow {
  allergy_id?: number;
  patient_id?: number;

  item_id?: number;
  item_type?: string;
  item_name?: string;
  item_code?: string;
  item_code_system?: string;

  allergy_name?: string;
  /** 0-未指定，1-轻度，2-中度，3-严重 */
  allergy_level?: number;
  allergy_reaction?: string;
  allergy_tag?: string;
  allergy_note?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  valid_status?: string;
  input_source?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ItemRow {
  item_id?: number;
  org_id?: number;

  item_type?: string;
  item_name?: string;
  item_code?: string;
  item_code_system?: string;
  item_tag?: string;
  item_note?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetAllergyListReq {
  /** 优先 */
  patient_id?: number;
  /** 其次 */
  visit_id?: number;
  /** empty 或 * 表示全部 */
  allergy_type?: string;
  include_empi?: boolean;
  column_list?: string;
}

export interface GetAllergyListRes extends ApiResult {
  row_list?: AllergyRow[];
}

export interface GetItemListReq {
  org_id?: number;
  item_type?: string;
  include_invalid?: boolean;
  column_list?: string;
}

export interface GetItemListRes extends ApiResult {
  row_list?: ItemRow[];
}

export interface NewAllergyReq {
  patient_id: number;

  item_id?: number;
  item_type?: string;
  item_name?: string;
  item_code?: string;
  item_code_system?: string;

  allergy_name?: string;
  allergy_level?: number;
  allergy_reaction?: string;
  allergy_tag?: string;
  allergy_note?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  valid_status?: string;
  input_source?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewAllergyRes extends ApiResult {
  allergy_id?: number;
}

export interface DeleteAllergyReq {
  allergy_id: number;
  delete_note?: string;
}

export type DeleteAllergyRes = ApiResult;

export interface SaveAllergyPropertyReq {
  allergy_id: number;
  allergy_property: AllergyRow;
}

export type SaveAllergyPropertyRes = ApiResult;
