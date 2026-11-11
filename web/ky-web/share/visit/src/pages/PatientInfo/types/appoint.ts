/** 与 admission.proto 对齐的类型定义（入院列表 / 入院办理） */

import type { ApiResult } from "./comm";

/** 预约状态：APPOINT-预约，REG-住院登记，ADMISSION-入院，CANCEL-取消 */
export type AppointStatus = "APPOINT" | "REG" | "ADMISSION" | "CANCEL";

/** 获取入院列表，先刷卡获取到 patient_id 定位到某人然后再传入这个入院列表接口 */
export interface GetAdmissionListReq {
  dept_id?: number;
  ward_id?: number;
  /** 可选 */
  patient_id?: number;

  appoint_status?: string;
  appoint_start?: string;
  appoint_end?: string;
  include_invalid?: boolean;

  column_list?: string;
}

export interface AdmissionRow {
  appoint_id?: number;
  patient_id?: number;
  visit_id?: number;
  visit_ip?: number;

  appoint_date?: string;
  appoint_time?: string;
  appoint_tag?: string;
  appoint_note?: string;
  /** APPOINT-预约，REG-住院登记，ADMISSION-入院，CANCEL-取消 */
  appoint_status?: AppointStatus | string;

  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  ward_id?: number;
  ward_name?: string;
  room_id?: number;
  room_no?: string;
  bed_id?: number;
  bed_no?: string;
  bed_appoint?: number;

  diag_name?: string;
  diag_code?: string;
  diag_code_system?: string;
  health_level?: string;
  health_level_code?: string;

  reg_time?: string;
  reg_no?: string;
  reg_session?: string;
  reg_tag?: string;
  reg_note?: string;

  /** 保险类型, dict=insurance.type */
  insurance_type?: string;
  /** 保险类型名称: 自费，部队，工伤，医保 */
  insurance_name?: string;
  /** 结算类型：settle.GetActiveDealerList */
  settle_type?: string;
  /** 结算名称：settle.GetActiveDealerList */
  settle_name?: string;
  settle_tag?: string;
  settle_note?: string;
  service_code?: string;
  service_name?: string;
  service_status?: string;
  service_tag?: string;
  service_note?: string;

  handle_id?: number;
  handle_no?: string;
  handle_tag?: string;
  handle_note?: string;

  admission_time?: string;
  admission_id?: number;
  admission_tag?: string;
  admission_note?: string;

  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetAdmissionListRes extends ApiResult {
  row_list?: AdmissionRow[];
}

/** 入院办理 */
export interface RegAdmissionReq {
  appoint_id?: number;

  reg_time?: string;
  reg_tag?: string;
  reg_note?: string;

  /** 保险类型, dict=insurance.type */
  insurance_type?: string;
  /** 保险类型名称: 自费，部队，工伤，医保 */
  insurance_name?: string;
  /** 结算类型：settle.GetActiveDealerList */
  settle_type?: string;
  /** 结算名称：settle.GetActiveDealerList */
  settle_name?: string;
  settle_tag?: string;
  settle_note?: string;

  service_code?: string;
  service_name?: string;
  service_status?: string;
  service_tag?: string;
  service_note?: string;

  /** 结算系统登记 id，例如工伤 */
  handle_id?: number;
  handle_no?: string;
  handle_tag?: string;
  handle_note?: string;
}

export interface RegAdmissionRes extends ApiResult {}

/** 取消住院 */
export interface CancelAdmissionReq {
  appoint_id?: number;
  delete_note?: string;
}

export interface CancelAdmissionRes extends ApiResult {}

// 撤销住院登记
export interface UndoRegAdmissionReq {
  appoint_id?: number;
  undo_settle?: boolean;
  undo_note?: string;
}

export interface UndoRegAdmissionRes extends ApiResult {}