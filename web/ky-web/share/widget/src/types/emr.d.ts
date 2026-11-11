import type { ApiResult } from "./comm";

export interface EmrRow {
  emr_id?: number;
  emr_no?: string;
  parent_id?: number;
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;
  encounter_id?: number;

  serial_no?: number;
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;
  sys_tag?: string;

  emr_time?: string;
  emr_title?: string;
  emr_status?: string;

  approve_time?: string;
  approve_session?: string;
  approve_tag?: string;
  approve_note?: string;

  form_id?: number;
  form_version?: number;

  work_type?: string;
  user_id_list?: string;
  user_name_list?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  stakeholder_count?: number;
  stakeholder_sign?: number;
  consent_count?: number;
  consent_sign?: number;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** 列表展示行：visit_info 由 GetVisitProperty2 批量合并 */
export interface EmrToSignListItem extends EmrRow {
  visit_info?: string;
}

export interface GetEmrStakeholderToSignListReq {
  visit_id?: number;
  user_id?: number;
  column_list?: string;
}

export interface GetEmrStakeholderToSignListRes extends ApiResult {
  row_list?: EmrRow[];
}

export interface SignEmrStakeholderReq {
  /** 优先：指定相关人 ID */
  stakeholder_id?: number;
  /** 非 CA 模式签名人密码；签名人为当前登录用户时可不传 */
  stakeholder_pwd?: string;
  /** 若无 stakeholder_id，可指定多个病历 ID 批量签署 */
  emr_id_list?: number[];
  sign_id?: number;
  sign_time?: string;
  sign_tag?: string;
  sign_note?: string;
}

export interface SignEmrStakeholderRes extends ApiResult {}
