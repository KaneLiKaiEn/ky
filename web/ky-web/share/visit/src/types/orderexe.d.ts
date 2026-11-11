/** 与 orderexe.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface GetImplementList2Req {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  visit_id_list?: number[];
  /** 再次 */
  patient_id?: number;

  exec_dept_id?: number;

  only_outpatient?: boolean;
  only_inpatient?: boolean;

  implement_start?: string;
  implement_end?: string;

  /** [exam][lab][pathology][treat][medicate][other] */
  implement_type?: string;
  order_type?: string;
  order_catalog?: string;

  /** [NEW][CHARGE] */
  implement_status?: string;

  column_list?: string;
}

export interface Implement2Row {
  /** exam, lab, pathology, treat, medicate, other */
  implement_type?: string;

  implement_id?: number;
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;

  apply_id?: number;
  order_id?: number;
  order_id_list?: string; // lab, [1][2]...
  order_no?: string;
  order_time?: string;
  order_type?: string;
  order_catalog?: string;
  order_dept_id?: number;
  order_dept_name?: string;
  order_user_id?: number;
  order_user_name?: string;
  apply_dept_id?: number;
  apply_dept_name?: string;

  freq_id?: number;
  freq_name?: string;
  freq_no?: number;
  freq_count?: number;

  usage_id?: number;
  usage_name?: string;

  implement_time?: string;
  implement_no?: string;
  implement_title?: string;
  implement_content?: string;
  implement_condition?: string;
  implement_amount?: string;
  implement_tag?: string;
  implement_note?: string;
  implement_status?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  charge_time?: string;
  charge_session?: string;
  charge_tag?: string;
  charge_note?: string;

  appoint_time?: string;
  appoint_session?: string;
  schedule_time?: string;
  schedule_no?: string;
  schedule_tag?: string;
  schedule_note?: string;

  exec_time?: string;
  exec_dept_id?: number;
  exec_dept_name?: string;
  exec_user_id?: number;
  exec_user_name?: string;
  exec_room_id?: number;
  exec_room_no?: string;
  exec_device_id?: number;
  exec_device_name?: string;
  exec_no?: string;
  exec_tag?: string;
  exec_note?: string;

  commit_time?: string;
  commit_session?: string;
  commit_note?: string;

  valid_start?: string;
  valid_end?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetImplementList2Res extends ApiResult {
  row_list?: Implement2Row[];
}
