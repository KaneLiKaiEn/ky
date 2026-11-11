/** 与 visit.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface VisitPatientRow {
  visit_id?: number;
  org_id?: number;
  patient_id?: number;

  patient_name?: string;
  patient_gender?: string;
  patient_idno?: string;
  patient_idno_system?: string;
  patient_telno?: string;
  patient_telno_system?: string;
  patient_email?: string;
  patient_info?: string;

  birth_date?: string;
  birth_time?: string;
  age_full?: string;
  age_year?: number;
  age_month?: number;
  age_day?: number;
  age_hour?: number;
  age_minute?: number;

  race_name?: string;
  race_code?: string;
  race_code_system?: string;

  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPatientPropertyReq {
  visit_id?: number;
  visit_no?: string;
  visit_type?: string;
  column_list?: string;
}

export interface GetPatientPropertyRes extends ApiResult {
  patient_property?: VisitPatientRow;
}

/** visit/GetPatientProperty2：按 visit_id 批量取患者属性 */
export interface GetPatientProperty2Req {
  visit_id_list?: number[];
}

export interface GetPatientProperty2Res extends ApiResult {
  patient_list?: VisitPatientRow[];
}

export interface GetPatientAgeReq {
  visit_id?: number;
  end_time?: string;
}

export interface GetPatientAgeRes extends ApiResult {
  age_year?: number;
  age_month?: number;
  age_day?: number;
  age_hour?: number;
  age_minute?: number;

  total_month?: number;
  total_week?: number;
  total_day?: number;
  total_hour?: number;
  total_minute?: number;
}

export interface GetVisitPropertyReq {
  visit_id?: number;

  visit_no?: string;
  visit_type?: string;

  patient_id?: number;
  visit_serial?: number;

  column_visit?: string;
  column_op?: string;
  column_ep?: string;
  column_ip?: string;

  column_ext?: string;
  column_status?: string;
  column_patient?: string;
  column_result?: string;

  column_observe?: string;
  column_predischarge?: string;

  column_address?: string;
  column_contact?: string;
  column_doctor?: string;
  column_encounter?: string;
  column_gp?: string;
}

export interface VisitRow {
  visit_id?: number;
  patient_id?: number;
  patient_no?: string;
  patient_xid?: string;
  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  visit_type?: string;
  visit_no?: string;
  visit_serial?: number;
  visit_time?: string;
  visit_tag?: string;
  visit_status?: string;
  visit_info?: string;
  diag_info?: string;
  link_name?: string;
  link_value?: number;
  link_tag?: string;
  link_data?: string;
  link_ext?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetVisitPropertyRes extends ApiResult {
  visit_property?: VisitRow;
  patient_property?: VisitPatientRow;
  ip_property?: VisitIpRow;
}

/** visit/GetVisitList 请求。visit_type 形如 [O][E][I]，* 表示全部 */
export interface GetVisitListReq {
  patient_id?: number;
  visit_type?: string;
  column_op?: string;
  column_list?: string;
  column_ep?: string;
  column_ip?: string;
}

/** 门诊扩展行，与 visit_id 关联 */
export interface VisitOpRow {
  visit_id?: number;
}

/** visit/GetVisitList 响应 */
export interface GetVisitListRes extends ApiResult {
  op_list?: VisitOpRow[];
}
