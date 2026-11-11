/** 与 exam.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface ExamReportRow {
  report_no?: string;
  org_id?: number;
  org_no?: string;
  patient_id?: number;
  patient_no?: string;
  patient_examno?: string;
  visit_id?: number;
  visit_no?: string;
  baby_id?: number;
  baby_no?: string;
  bed_id?: number;
  bed_no?: string;
  study_uid?: string;

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

  order_time?: string;
  order_id?: number;
  order_no?: string;
  order_tag?: string;
  order_note?: string;
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

  exec_time?: string;
  exec_id?: number;
  exec_no?: string;
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
  exec_body_name?: string;
  exec_body_code?: string;
  exec_body_code_system?: string;

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

export interface ExamReportReadRow {
  row_id?: number;
  org_id?: number;
  report_no?: string;

  user_id?: number;
  user_name?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ExamReportContentRow {
  report_no?: string;

  exam_observe?: string;
  exam_result?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetExamReportListReq {
  visit_id?: number;
  patient_id?: number;

  report_start?: string;
  report_end?: string;

  column_list?: string;
  column_read?: string;
}

export interface GetExamReportListRes extends ApiResult {
  row_list?: ExamReportRow[];
  read_list?: ExamReportReadRow[];
}

export interface GetExamReportContentReq {
  report_no?: string;

  column_list?: string;
}

export interface GetExamReportContentRes extends ApiResult {
  report_content?: ExamReportContentRow;
}
