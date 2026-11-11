/** 与 form.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface SheetRow {
  sheet_id?: number;
  org_id?: number;
  catalog_id?: number;
  owner_type?: string;
  owner_id?: number;

  sheet_code?: string;
  sheet_name?: string;
  sheet_tag?: string;
  sheet_note?: string;
  work_type?: string;
  doc_type?: string;
  doc_name?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface FormRow {
  form_id?: number;
  org_id?: number;
  sheet_id?: number;

  form_no?: string;
  form_code?: string;
  form_name?: string;
  form_version?: number;
  form_tag?: string;
  form_note?: string;

  work_type?: string;
  doc_tag?: string;

  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  emr_time?: string;
  emr_title?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface SectionElemRow {
  row_id?: number;
  section_id?: number;
  section_version?: number;
  elem_id?: number;
  elem_title?: string;
  elem_tag?: string;
  elem_note?: string;
  elem_width?: string;
  entry_id?: number;
  entry_name?: string;
  entry_tag?: string;
  seek_name?: string;
  seek_text?: string;
  seek_tag?: string;
  seek_note?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface SectionRow {
  section_id?: number;
  org_id?: number;
  parent_type?: string;
  parent_id?: number;
  parent_version?: number;

  section_code?: string;
  section_name?: string;
  section_title?: string;
  section_tag?: string;
  section_note?: string;
  section_arg?: string;
  /** 多行分段的初始化语句或数据集。非空时由 GetSectionInitData 导入行。 */
  section_init?: string;

  column_split?: number; //列数
  column_width?: string; //列宽比例，空格分隔，占 12 格，如 "6 3 3"

  icon_name?: string;
  icon_system?: string;

  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface PieceRow {
  piece_id?: number;
  org_id?: number;
  form_id?: number;
  form_name?: string;
  prefab_id?: number;
  elem_id?: number;
  elem_name?: string;

  user_id?: number;
  user_name?: string;
  dept_id?: number;
  dept_name?: string;

  piece_name?: string;
  piece_content?: string;
  piece_abstract?: string;
  piece_tag?: string;
  piece_note?: string;

  share_tag?: string;

  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  disease_id?: number;
  disease_name?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface FormEventFireRow {
  event_id?: number;
  elem_id?: number;
  elem_name?: string;

  value_text?: string;
  value_code?: string;
  value_code_system?: string;

  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetSectionElemListReq {
  section_id?: number;
  section_version?: number;
  column_list?: string;
}

export interface GetSectionElemListRes extends ApiResult {
  row_list?: SectionElemRow[];
}

export interface GetSectionListReq {
  parent_type?: string;
  parent_id?: number;
  parent_version?: number;
  column_list?: string;
}

export interface GetSectionListRes extends ApiResult {
  row_list?: SectionRow[];
}

export interface GetSectionInitDataReq {
  visit_id?: number;
  section_id?: number;
}

export interface GetSectionInitDataRes extends ApiResult {
  /** 行数组。每行是列标题到单元格值的映射，同名列的值可能是数组。 */
  data?: unknown;
}

export interface GetPieceListReq {
  org_id?: number;
  form_id?: number;
  prefab_id?: number;
  elem_id?: number;
  column_list?: string;
}

export interface GetPieceListRes extends ApiResult {
  row_list?: PieceRow[];
}

export interface ElemInputEventReq {
  form_id: number;
  elem_id: number;

  value_text?: string;
  value_code?: string;
  value_code_system?: string;
}

export interface ElemInputEventRes {
  code: number;
  message: string;
  hint?: string;

  row_list?: FormEventFireRow[];
  script_list?: string[];
}

export interface NewPieceReq {
  org_id?: number;
  form_id?: number;
  form_name?: string;
  prefab_id?: number;
  elem_id?: number;
  elem_name?: string;

  user_id?: number;
  user_name?: string;
  dept_id?: number;
  dept_name?: string;

  piece_name?: string;
  piece_content?: string;
  piece_abstract?: string;
  piece_tag?: string;
  piece_note?: string;

  share_tag?: string;

  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  disease_id?: number;
  disease_name?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewPieceRes extends ApiResult {
  piece_id?: number;
}

export interface DeletePieceReq {
  piece_id?: number;
  delete_note?: string;
}

export interface DeletePieceRes extends ApiResult {}

export interface SavePiecePropertyReq {
  piece_id?: number;
  piece_property?: PieceRow;
}

export interface SavePiecePropertyRes extends ApiResult {}

export interface GetFormPropertyReq {
  form_id?: number;
  form_version?: number;

  column_list?: string;
  column_sheet?: string;
}

export interface GetFormPropertyRes extends ApiResult {
  form_property?: FormRow;
  sheet_property?: SheetRow;
}

export interface GetFormListReq {
  sheet_id?: number;

  owner_type?: string;
  owner_id?: number;
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;
  catalog_id?: number;
  name_id?: number;

  only_auth?: boolean;
  only_link?: boolean;
  exclude_link?: boolean;

  column_list?: string;
}

export interface GetFormListRes extends ApiResult {
  row_list?: FormRow[];
}

export interface GetPrefabValueListReq {
  prefab_id?: number;
  column_list?: string;
  column_elem?: string;
}

export interface SysValueRow {
  value_id?: number;
  org_id?: number;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  entry_id?: number;
  section_id?: number;
  row_id?: string;
  row_no?: number;
  serial_no?: number;
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  elem_version?: number;

  value_time?: string;
  value_score?: number;
  value_text?: string;
  value_code?: string;
  value_code_system?: string;
  value_tag?: string;
  value_note?: string;
  value_int?: number;
  value_dec?: string;
  value_tip?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPrefabValueListRes extends ApiResult {
  value_list?: SysValueRow[];
}

export interface GetPrefabListReq {
  org_id?: number;
  form_id?: number;

  include_dept?: boolean;
  include_org?: boolean;

  disease_id_list?: number[];

  visit_type?: string;
  op_type?: string;

  gender_name?: string;
  age_value?: number;
  age_unit?: string;

  column_list?: string;
}

export interface PrefabRow {
  prefab_id?: number;
  form_id?: number;
  org_id?: number;
  catalog_id?: number;

  user_id?: number;
  user_name?: string;
  dept_id?: number;
  dept_name?: string;

  prefab_name?: string;
  prefab_tag?: string;
  prefab_note?: string;

  share_tag?: string;

  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  visit_type?: string;
  op_type?: string;

  disease_id?: number;
  disease_name?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPrefabListRes extends ApiResult {
  row_list?: PrefabRow[];
}
