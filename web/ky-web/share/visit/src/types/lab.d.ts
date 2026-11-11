/** 与 lab.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface LabReportRow {
  report_no?: string;
  org_id?: number;
  org_no?: string;
  patient_id?: number;
  patient_no?: string;
  patient_labno?: string;
  visit_id?: number;
  visit_no?: string;
  baby_id?: number;
  baby_no?: string;
  bed_id?: number;
  bed_no?: string;

  report_time?: string;
  report_type?: string;
  report_catalog?: string;
  report_name?: string;
  report_title?: string;
  report_tag?: string;
  report_note?: string;
  report_status?: string;
  report_user_id?: number;
  report_user_no?: string;
  report_user_name?: string;

  order_user_id?: number;
  order_user_no?: string;
  order_user_name?: string;
  order_dept_id?: number;
  order_dept_no?: string;
  order_dept_name?: string;
  apply_time?: string;
  apply_id?: number;
  apply_no?: string;
  apply_tag?: string;
  apply_note?: string;

  specimen_time?: string;
  specimen_type?: string;
  specimen_id?: number;
  specimen_no?: string;
  specimen_name?: string;
  specimen_status?: string;
  specimen_tag?: string;
  specimen_note?: string;
  specimen_user_id?: number;
  specimen_user_no?: string;
  specimen_user_name?: string;

  recv_time?: string;
  recv_tag?: string;
  recv_note?: string;
  recv_user_id?: number;
  recv_user_no?: string;
  recv_user_name?: string;

  exec_time?: string;
  exec_tag?: string;
  exec_note?: string;
  exec_user_id?: number;
  exec_user_no?: string;
  exec_user_name?: string;
  exec_device_id?: number;
  exec_device_no?: string;
  exec_device_name?: string;
  exec_action_name?: string;
  exec_action_code?: string;
  exec_action_code_system?: string;

  check_time?: string;
  check_tag?: string;
  check_note?: string;
  check_user_id?: number;
  check_user_no?: string;
  check_user_name?: string;

  cancel_time?: string;
  cancel_tag?: string;
  cancel_note?: string;
  cancel_user_id?: number;
  cancel_user_no?: string;
  cancel_user_name?: string;

  sort_no?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface LabReportReadRow {
  row_id?: number;
  org_id?: number;
  report_no?: string;

  user_id?: number;
  user_name?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface LabReportDetailRow {
  row_id?: number;
  report_no?: string;

  serial_no?: number;
  item_id?: number;
  item_name?: string;
  item_code?: string;
  item_code_system?: string;
  item_value?: string;
  item_value_dec?: string;
  item_value_tip?: string;
  item_unit?: string;
  item_method?: string;
  item_tag?: string;
  item_note?: string;

  value_min?: string;
  value_max?: string;
  value_range?: string;

  prev_no?: string;
  prev_time?: string;
  prev_value?: string;
  prev_value_dec?: string;
  prev_value_tip?: string;

  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface LabReportAstRow {
  row_id?: number;
  report_no?: string;

  group_no?: string;
  group_name?: string;

  serial_no?: number;
  item_id?: number;
  item_name?: string;
  item_code?: string;
  item_code_system?: string;
  item_mic?: string;
  item_mic_dec?: string;
  item_sir?: string;
  item_method?: string;
  item_tag?: string;
  item_note?: string;

  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface LabReportBactRow {
  row_id?: number;
  report_no?: string;

  serial_no?: number;
  item_type?: string;
  item_id?: number;
  item_name?: string;
  item_code?: string;
  item_code_system?: string;
  item_value?: string;
  item_value_dec?: string;
  item_unit?: string;
  item_method?: string;
  item_tag?: string;
  item_note?: string;

  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface LabReportContentRow {
  report_no?: string;

  report_content?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetLabReportListReq {
  visit_id?: number;
  patient_id?: number;

  report_start?: string;
  report_end?: string;

  column_list?: string;
  column_read?: string;
}

export interface GetLabReportListRes extends ApiResult {
  row_list?: LabReportRow[];
  read_list?: LabReportReadRow[];
}

export interface GetLabReportDetailReq {
  report_no?: string;

  column_list?: string;
}

export interface GetLabReportDetailRes extends ApiResult {
  row_list?: LabReportDetailRow[];
}

export interface GetLabReportBactReq {
  report_no?: string;

  column_list?: string;
}

export interface GetLabReportBactRes extends ApiResult {
  row_list?: LabReportBactRow[];
}

export interface GetLabReportAstReq {
  report_no?: string;

  column_list?: string;
}

export interface GetLabReportAstRes extends ApiResult {
  row_list?: LabReportAstRow[];
}

export interface GetLabReportContentReq {
  report_no?: string;

  column_list?: string;
}

export interface GetLabReportContentRes extends ApiResult {
  report_content?: LabReportContentRow;
}

export interface GetLabItemHistoryReq {
  patient_id?: number;
  visit_id?: number;

  item_id?: number;
  item_code?: string;
  item_name?: string;
  item_method?: string;

  report_start?: string;
  report_end?: string;

  column_list?: string;
}

export interface GetLabItemHistoryRes extends ApiResult {
  report_list?: LabReportRow[];
  detail_list?: LabReportDetailRow[];
}

export interface ReportItemFavoriteRow {
  row_id?: number;
  visit_id?: number;
  baby_id?: number;
  work_type?: string;

  item_id?: number;
  item_code?: string;
  item_code_system?: string;
  item_name?: string;
  item_unit?: string;

  favorite_duration?: number;
  favorite_unit?: string;
  favorite_tag?: string;
  favorite_note?: string;

  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetFavoriteReportItemListReq {
  visit_id?: number;
  baby_id?: number;
  work_type?: string;
  column_list?: string;
}

export interface GetFavoriteReportItemListRes extends ApiResult {
  row_list?: ReportItemFavoriteRow[];
}

export interface FavoriteReportItemReq {
  visit_id?: number;
  baby_id?: number;
  work_type?: string;

  item_id?: number;
  item_code?: string;
  item_code_system?: string;
  item_name?: string;
  item_unit?: string;

  favorite_duration?: number;
  favorite_unit?: string;
  favorite_tag?: string;
  favorite_note?: string;
}

export interface FavoriteReportItemRes extends ApiResult {}

export interface UndoFavoriteReportItemReq {
  visit_id?: number;
  baby_id?: number;
  work_type?: string;

  item_id?: number;
  item_code?: string;
  item_code_system?: string;
}

export interface UndoFavoriteReportItemRes extends ApiResult {}
