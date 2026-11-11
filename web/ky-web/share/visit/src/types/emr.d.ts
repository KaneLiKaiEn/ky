/** 与 emr.proto / emr-time.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";
import type { ElemRow } from "./elem";

export interface EmrRow {
  emr_id?: number;
  emr_no?: string;
  parent_id?: number;
  org_id?: number;
  visit_id?: number;
  baby_id?: number;
  patient_id?: number;
  encounter_id?: number;

  serial_no?: number;
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;
  sys_tag?: string;

  assess_system?: string;
  assess_method?: string;
  assess_score?: number;
  assess_total?: number;
  assess_result?: string;
  assess_color?: string;
  assess_next?: string | null;
  assess_tag?: string;
  assess_note?: string;
  problem_type?: string;
  problem_id?: number;
  problem_name?: string;

  // discuss_type?: string; // commented in proto
  discuss_start?: string;
  discuss_end?: string;
  discuss_venue?: string;
  discuss_moderator_id?: number;
  discuss_moderator_name?: string;
  discuss_tag?: string;
  discuss_note?: string;

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

export interface VisitValueRow {
  value_id?: number;
  org_id?: number;
  visit_id?: number;
  baby_id?: number;

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

export interface EmrContentRow {
  emr_id?: number;

  emr_format?: string;
  emr_content?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface EmrStakeholderRow {
  stakeholder_id?: number;
  emr_id?: number;

  attach_time?: string;
  attach_tag?: string;
  attach_note?: string;

  stakeholder_type?: string;
  stakeholder_name?: string;
  stakeholder_tag?: string;
  stakeholder_note?: string;
  stakeholder_option?: string;
  stakeholder_default?: string;

  user_id?: number;
  user_name?: string;
  work_type?: string;
  work_level?: string;
  work_title?: string;
  role_id?: number;
  role_name?: string;

  dept_id?: number;
  dept_name?: string;
  group_id?: number;
  group_name?: string;
  unit_id?: number;
  unit_name?: string;

  sign_id?: number;
  sign_time?: string;
  sign_tag?: string;
  sign_note?: string;

  sort_no?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface CreateEmrReq {
  visit_id?: number;
  baby_id?: number;
  encounter_id?: number;

  form_id?: number;
  form_version?: number;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  emr_property?: EmrRow;
  emr_content?: EmrContentRow;
  elem_list?: VisitValueRow[];
  stakeholder_list?: EmrStakeholderRow[];
  discuss_list?: EmrDiscussRow[];
  discuss_user_list?: EmrDiscussUserRow[];
}

export interface CreateEmrRes extends ApiResult {
  emr_id?: number;
}

export interface GetEmrInitReq {
  visit_id?: number;
  baby_id?: number;

  form_id?: number;
  form_version?: number;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
}

export interface GetEmrInitRes extends ApiResult {
  emr_time?: string;
  emr_title?: string;
}

export interface SaveEmrReq {
  emr_id?: number;
  emr_property?: EmrRow;
  emr_content?: EmrContentRow;
  elem_list?: VisitValueRow[];
  discuss_list?: EmrDiscussRow[];
  discuss_user_list?: EmrDiscussUserRow[];
}

export interface SaveEmrRes extends ApiResult {
  stakeholder_changed?: boolean;
}

export interface CommitCheckRow {
  result_id?: number;
  commit_tag?: string;
  commit_note?: string;
}

export interface CommitEmrReq {
  emr_id?: number;
  wait_doc?: boolean;
  check_list?: CommitCheckRow[];
}

export interface CommitEmrRes extends ApiResult {}

export interface UndoCommitEmrReq {
  emr_id?: number;
  undo_note?: string;
}

export interface UndoCommitEmrRes extends ApiResult {}

export interface DeleteEmrReq {
  emr_id: number;
  delete_note?: string;
}

export interface DeleteEmrRes extends ApiResult {}

export interface EmrUserRow {
  emr_id?: number;

  create_time?: string;
  create_user_id?: number;
  create_user_name?: string;
  create_work_level?: string;
  create_dept_id?: number;
  create_dept_name?: string;

  commit_time?: string;
  commit_user_id?: number;
  commit_user_name?: string;
  commit_work_level?: string;
  commit_dept_id?: number;
  commit_dept_name?: string;

  check_time?: string;
  check_user_id?: number;
  check_user_name?: string;
  check_work_level?: string;
  check_work_title?: string;
  check_dept_id?: number;
  check_dept_name?: string;
  check_tag?: string;
  check_note?: string;

  finish_time?: string;
  finish_user_id?: number;
  finish_user_name?: string;
  finish_work_level?: string;
  finish_dept_id?: number;
  finish_dept_name?: string;
}

export interface GetEmrPropertyReq {
  emr_id?: number; 
  visit_id?: number; 
  link_name?: string;
  link_value?: number;
  column_list?: string;
  column_user?: string; 
}

export interface GetEmrPropertyRes extends ApiResult {
  emr_property?: EmrRow;
  user_property?: EmrUserRow;
}

export interface GetEmrElemListReq {
  emr_id: number;
  column_value?: string;
  column_elem?: string;
}

export interface GetEmrElemListRes extends ApiResult {
  value_list?: VisitValueRow[];
  elem_list?: ElemRow[];
}

export interface GetEmrStakeholderListReq {
  emr_id: number;
  column_list?: string;
}

export interface GetEmrStakeholderListRes extends ApiResult {
  row_list?: EmrStakeholderRow[];
}

export interface AttachEmrStakeholderReq {
  stakeholder_id?: number;
  emr_id?: number;
  stakeholder_type?: string;
  user_id?: number;
  user_name?: string;
}

export interface AttachEmrStakeholderRes extends ApiResult {
  stakeholder_id?: number;
}

export interface DetachEmrStakeholderReq {
  stakeholder_id: number;
  detach_note?: string;
}

export interface DetachEmrStakeholderRes extends ApiResult {}

export interface SignEmrStakeholderReq {
  stakeholder_id?: number;
  emr_id_list?: number[];
  sign_id?: number;
  sign_time?: string;
  sign_tag?: string;
  sign_note?: string;
  stakeholder_pwd?: string;
}

export interface SignEmrStakeholderRes extends ApiResult {}

export interface EmrConsentRow {
  consent_id?: number;
  emr_id?: number;

  consent_code?: string;
  consent_title?: string;
  consent_desc?: string;
  consent_option?: string;

  consent_time?: string;
  consent_name?: string;
  consent_gender?: string;
  consent_idno?: string;
  consent_idno_system?: string;
  consent_telno?: string;
  consent_address?: string;
  consent_kinship?: string;
  consent_value?: string;
  consent_tag?: string;
  consent_note?: string;

  sign_app?: string;
  sign_device?: string;
  sign_format?: string;
  sign_width?: number;
  sign_height?: number;

  sign_id?: number;
  sign_time?: string;
  sign_tag?: string;
  sign_note?: string;

  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** 前端患者签名暂存，非 proto 消息 */
export interface EmrConsentSignRow {
  consent_id?: number;
  sign_content?: string;
}

export interface GetEmrConsentListReq {
  emr_id: number;
  column_list?: string;
}

export interface GetEmrConsentListRes extends ApiResult {
  row_list?: EmrConsentRow[];
}

export interface GetEmrConsentPropertyReq {
  consent_id: number;
  column_list?: string;
}

export interface GetEmrConsentPropertyRes extends ApiResult {
  consent_property?: EmrConsentRow;
}

export interface GetEmrConsentSignContentReq {
  consent_id: number;
}

export interface GetEmrConsentSignContentRes extends ApiResult {
  sign_format?: string;
  /** proto bytes，JSON 为 base64 字符串 */
  sign_content?: string;
}

export interface SignEmrConsentReq {
  consent_id: number;

  consent_name?: string;
  consent_gender?: string;
  consent_idno?: string;
  consent_idno_system?: string;
  consent_telno?: string;
  consent_address?: string;
  consent_kinship?: string;
  consent_value?: string;
  consent_tag?: string;
  consent_note?: string;

  sign_app?: string;
  sign_device?: string;

  sign_format?: string;
  /** proto bytes，JSON 为 base64 字符串 */
  sign_content?: string;
}

export interface SignEmrConsentRes extends ApiResult {}

export interface SaveEmrPropertyReq {
  emr_id?: number;
  emr_property?: EmrRow;
}

export interface SaveEmrPropertyRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface EmrDiscussRow {
  discuss_id?: number;
  emr_id?: number;
  user_id?: number;

  discuss_time?: string;
  discuss_type?: string;
  discuss_tag?: string;
  discuss_note?: string;

  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface EmrDiscussUserRow {
  emr_id?: number;

  user_id?: number;
  user_name?: string;
  dept_id?: number;
  dept_name?: string;
  work_type?: string;
  work_level?: string;
  work_title?: string;

  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetEmrDiscussListReq {
  emr_id?: number;
  column_list?: string;
}

export interface GetEmrDiscussListRes extends ApiResult {
  row_list?: EmrDiscussRow[];
}

export interface SaveEmrDiscussListReq {
  emr_id?: number;
  delete_row?: number;
  row_list?: EmrDiscussRow[];
}

export interface SaveEmrDiscussListRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface GetEmrDiscussUserListReq {
  emr_id?: number;
  column_list?: string;
}

export interface GetEmrDiscussUserListRes extends ApiResult {
  row_list?: EmrDiscussUserRow[];
}

export interface SaveEmrDiscussUserListReq {
  emr_id?: number;
  row_list?: EmrDiscussUserRow[];
}

export interface SaveEmrDiscussUserListRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface GetEmrContentReq {
  emr_id: number;
}

export interface GetEmrContentRes extends ApiResult {
  emr_format?: string;
  emr_content?: string;
}

export interface SaveAsPrefabReq {
  emr_id?: number;
  catalog_id?: number;

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
}

export interface SaveAsPrefabRes extends ApiResult {
  prefab_id?: number;
}

export interface GetEmrListReq {
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;
  encounter_id?: number;
  work_type?: string;
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  include_content?: boolean;
  include_child?: boolean;
  exclude_hide?: boolean;
  column_list?: string;
  emr_start?: string;
  emr_end?: string;
}

export interface GetEmrListRes extends ApiResult {
  row_list?: EmrRow[];
  content_list?: EmrContentRow[];
}

/** 质控项目 */
export interface GetQcItemListReq {
  catalog_id?: number;
  work_type?: string;
  item_type?: string;
  column_list?: string;
}
export interface QcItemRow {
  item_id?: number;
  org_id?: number;
  catalog_id?: number;

  item_type?: string;
  item_no?: string;
  item_code?: string;
  item_name?: string;
  item_score?: string;
  item_tag?: string;
  item_note?: string;

  work_type?: string;
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
export interface GetQcItemListRes extends ApiResult {
  item_list?: QcItemRow[];
}

/** 时限规则 */
export interface TimeRuleRow {
  rule_id?: number;
  org_id?: number;
  patient_type?: string;

  rule_type?: string;
  rule_no?: string;
  rule_name?: string;
  rule_code?: string;
  rule_code_system?: string;
  rule_desc?: string;
  rule_tag?: string;
  rule_note?: string;

  time_type?: string;
  time_duration?: number;
  time_unit?: string;

  doc_type?: string;
  doc_name?: string;

  alert_user?: string;
  alert_leader?: string;
  alert_director?: string;
  alert_manager?: string;
  alert_president?: string;

  qc_id?: number;
  qc_name?: string;
  qc_score?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface TimeRuleDeptRow {
  rule_id?: number;
  dept_id?: number;
  dept_name?: string;

  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetTimeRuleListReq {
  org_id: number;
  rule_type: string;
  column_list?: string;
}

export interface GetTimeRuleListRes extends ApiResult {
  row_list?: TimeRuleRow[];
}

export interface NewTimeRuleReq {
  org_id: number;
  patient_type: string;

  rule_type: string;
  rule_no?: string;
  rule_name: string;
  rule_code?: string;
  rule_code_system?: string;
  rule_desc?: string;
  rule_tag?: string;
  rule_note?: string;

  time_type: string;
  time_duration: number;
  time_unit: string;

  doc_type: string;
  doc_name: string;

  alert_user: string;
  alert_leader: string;
  alert_director: string;
  alert_manager: string;
  alert_president: string;

  qc_id?: number;
  qc_name?: string;
  qc_score?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewTimeRuleRes extends ApiResult {
  rule_id?: number;
}

export interface DeleteTimeRuleReq {
  rule_id: number;
  delete_note?: string;
}

export type DeleteTimeRuleRes = ApiResult;

export interface GetTimeRulePropertyReq {
  rule_id: number;
  column_list?: string;
}

export interface GetTimeRulePropertyRes extends ApiResult {
  rule_property?: TimeRuleRow;
}

export interface SaveTimeRulePropertyReq {
  rule_id: number;
  rule_property: TimeRuleRow;
}

export type SaveTimeRulePropertyRes = ApiResult;

export interface GetTimeRuleDeptListReq {
  rule_id: number;
  column_list?: string;
}

export interface GetTimeRuleDeptListRes extends ApiResult {
  row_list?: TimeRuleDeptRow[];
}

export interface SaveTimeRuleDeptListReq {
  rule_id: number;
  row_list?: TimeRuleDeptRow[];
}

export type SaveTimeRuleDeptListRes = ApiResult;