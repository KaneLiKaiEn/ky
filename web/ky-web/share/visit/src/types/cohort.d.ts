/** 与 cohort 接口对齐的类型定义 */

import type { ApiResult } from "./comm";

/** 病种匹配行 */
export interface CohortDiseaseRow {
  disease_id: number;
  org_id?: number;
  catalog_id?: number;
  dept_id?: number;
  dept_name?: string;
  group_id?: number;
  group_name?: string;
  user_id?: number;
  user_name?: string;
  disease_version: number;
  disease_type?: string;
  disease_no?: string;
  disease_code?: string;
  disease_name: string;
  disease_interval?: number;
  disease_tag?: string;
  disease_note?: string;
  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;
  bmi_min?: number;
  bmi_max?: number;
  doc_type?: string;
  doc_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetMatchListReq {
  visit_id: number;
  baby_id: number;
  disease_type: string;
}

export interface GetMatchListRes extends ApiResult {
  row_list?: CohortDiseaseRow[];
}

export interface EnterCohortReq {
  visit_id: number;
  disease_id: number;
}

export type EnterCohortRes = ApiResult;

export interface DenyCohortReq {
  visit_id: number;
  patient_id: number;
  disease_type: string;
  disease_id: number;
  disease_version: number;
  disease_name: string;
}

export type DenyCohortRes = ApiResult;

/** 队列行（cohort/GetCohortList） */
export interface CohortRow {
  cohort_id: number;
  org_id: number;
  patient_id: number;
  visit_id: number;
  baby_id: number;
  gender_name?: string;
  birth_date?: string;
  dept_id?: number;
  dept_name?: string;
  visit_info?: string;
  diag_info?: string;
  ops_info?: string;
  disease_type: string;
  disease_id: number;
  disease_version: number;
  disease_name?: string;
  cohort_time?: string;
  cohort_name?: string;
  cohort_tag?: string;
  cohort_note?: string;
  group_id?: number;
  group_name?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  enter_time?: string;
  enter_tag?: string;
  enter_session?: string;
  enter_note?: string;
  end_time?: string;
  end_tag?: string;
  end_session?: string;
  end_note?: string;
  commit_type?: string;
  commit_id?: number;
  commit_user?: string;
  commit_time?: string;
  post_time?: string;
  post_session?: string;
  post_no?: string;
  post_tag?: string;
  post_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetCohortListReq {
  visit_id: number;
  disease_type: string;
  include_finish?: boolean;
  include_exit?: boolean;
}

export interface GetCohortListRes extends ApiResult {
  row_list?: CohortRow[];
}

/** 步骤行（cohort/GetCohortStepList） */
export interface CohortStepRow {
  cohort_id: number;
  step_id: number;
  date_ref: string;
  date_start: number;
  date_end: number;
  step_name: string;
  step_tag?: string;
  step_note?: string;
  sort_no?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetCohortStepListReq {
  cohort_id: number;
}

export interface GetCohortStepListRes extends ApiResult {
  row_list?: CohortStepRow[];
}

/** 步骤动作工作类型 */
export type CohortActionWorkType = "DOCTOR" | "NURSE" | "PATIENT" | "EXECPTION";

/** 临床路径操作角色（传入组件的 work_type） */
export type ClinicalPathwayRole = "DOCTOR" | "NURSE";

/** 步骤动作行（cohort/GetCohortStepActionList） */
export interface CohortStepActionRow {
  cohort_id: number;
  step_id: number;
  action_id: number;
  work_type: string;
  action_type: string;
  action_name: string;
  action_tag?: string;
  action_note?: string;
  finish_time?: string;
  cancel_session?: string;
  finish_session?: string;
  finish_tag?: string;
  finish_note?: string;
  cancel_time?: string;
  cancel_tag?: string;
  cancel_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetCohortStepActionListReq {
  cohort_id: number;
  step_id: number;
  work_type: CohortActionWorkType;
}

export interface GetCohortStepActionListRes extends ApiResult {
  row_list?: CohortStepActionRow[];
}

export interface UndoCohortStepActionReq {
  cohort_id: number;
  action_id: number;
}

export type UndoCohortStepActionRes = ApiResult;

export interface CancelCohortStepActionReq {
  cohort_id: number;
  action_id: number;
}

export type CancelCohortStepActionRes = ApiResult;

export interface FinishCohortStepActionReq {
  cohort_id: number;
  action_id: number;
}

export type FinishCohortStepActionRes = ApiResult;

/** 结束队列（完成/退出） */
export interface EndCohortReq {
  cohort_id: number;
  end_tag: "[FINISH]" | "[EXIT]";
}

export type EndCohortRes = ApiResult;

/** 变异行（cohort/GetCohortExceptionList） */
export interface CohortExceptionRow {
  exception_id: number;
  cohort_id: number;
  step_id: number;
  action_id: number;
  action_type: string;
  work_type: string;
  exception_time: string;
  exception_type: string;
  exception_code?: string;
  exception_name?: string;
  exception_tag?: string;
  exception_note?: string;
  valid_status: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetCohortExceptionListReq {
  cohort_id: number;
  step_id: number;
  action_type?: string;
}

export interface GetCohortExceptionListRes extends ApiResult {
  row_list?: CohortExceptionRow[];
}

/** 新增变异 */
export interface NewCohortExceptionReq {
  cohort_id: number;
  step_id: number;
  action_id?: number | null;
  action_type: string;
  work_type: "DOCTOR" | "NURSE" | "PATIENT";
  exception_name: string;
  exception_type: string;
}

export type NewCohortExceptionRes = ApiResult;

/** 保存变异属性 */
export interface CohortExceptionProperty {
  exception_id?: number;
  cohort_id?: number;
  step_id?: number;
  action_id?: number;
  action_type?: string;
  work_type?: string;
  exception_time?: string;
  exception_type?: string;
  exception_code?: string;
  exception_name?: string;
  exception_tag?: string;
  exception_note?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface SaveCohortExceptionPropertyReq {
  exception_id: number;
  exception_property: CohortExceptionProperty;
}

export type SaveCohortExceptionPropertyRes = ApiResult;

/** 删除变异 */
export interface DeleteCohortExceptionReq {
  exception_id: number;
}

export type DeleteCohortExceptionRes = ApiResult;

export interface GetDiseaseListReq {
  org_id?: number;
  dept_id?: number;
  group_id?: number;
  user_id?: number;
  catalog_id?: number;
  disease_type?: string;
  /** 授权科室的 */
  include_dept?: boolean;
  /** 授权用户的 */
  include_user?: boolean;
  column_list?: string;
}

/** 病种字典行（cohort/GetDiseaseList） */
export interface DiseaseRow {
  disease_id?: number;
  org_id?: number;
  catalog_id?: number;
  dept_id?: number;
  dept_name?: string;
  group_id?: number;
  group_name?: string;
  user_id?: number;
  user_name?: string;
  disease_version?: number;
  disease_type?: string;
  disease_no?: string;
  disease_code?: string;
  disease_name?: string;
  disease_interval?: number;
  disease_tag?: string;
  disease_note?: string;
  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;
  bmi_min?: string | number;
  bmi_max?: string | number;
  doc_type?: string;
  doc_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiseaseListReq {
  org_id?: number;
  dept_id?: number;
  group_id?: number;
  user_id?: number;
  catalog_id?: number;
  disease_type?: string;
  include_dept?: boolean;
  include_user?: boolean;
  column_list?: string;
}

export interface GetDiseaseListRes extends ApiResult {
  row_list?: DiseaseRow[];
}

export interface NewDiseaseReq {
  org_id?: number;
  catalog_id?: number;
  dept_id?: number;
  dept_name?: string;
  group_id?: number;
  group_name?: string;
  user_id?: number;
  user_name?: string;
  disease_version?: number;
  disease_type?: string;
  disease_no?: string;
  disease_code?: string;
  disease_name?: string;
  disease_interval?: number;
  disease_tag?: string;
  disease_note?: string;
  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;
  bmi_min?: string;
  bmi_max?: string;
  doc_type?: string;
  doc_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
}

export interface NewDiseaseRes extends ApiResult {
  disease_id?: number;
}

export interface DeleteDiseaseReq {
  disease_id: number;
  delete_note?: string;
}

export type DeleteDiseaseRes = ApiResult;

export interface GetDiseasePropertyReq {
  disease_id: number;
  column_list?: string;
}

export interface GetDiseasePropertyRes extends ApiResult {
  disease_property?: DiseaseRow;
}

export interface SaveDiseasePropertyReq {
  disease_id: number;
  disease_property: DiseaseRow;
}

export type SaveDiseasePropertyRes = ApiResult;

export interface DiseaseDeptRow {
  row_id?: number;
  disease_id?: number;
  dept_id?: number;
  dept_name?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiseaseDeptListReq {
  disease_id: number;
  column_list?: string;
}

export interface GetDiseaseDeptListRes extends ApiResult {
  row_list?: DiseaseDeptRow[];
}

export interface SaveDiseaseDeptListReq {
  disease_id: number;
  delete_row?: number;
  row_list?: DiseaseDeptRow[];
}

export type SaveDiseaseDeptListRes = ApiResult;

export interface DiseaseDiagRow {
  row_id?: number;
  disease_id?: number;
  disease_version?: number;
  diag_type?: string;
  diag_name?: string;
  diag_code?: string;
  diag_code_system?: string;
  diag_match?: string;
  diag_link?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiseaseDiagListReq {
  disease_id: number;
  disease_version?: number;
  column_list?: string;
}

export interface GetDiseaseDiagListRes extends ApiResult {
  row_list?: DiseaseDiagRow[];
}

export interface SaveDiseaseDiagListReq {
  disease_id: number;
  delete_row?: number;
  row_list?: DiseaseDiagRow[];
}

export type SaveDiseaseDiagListRes = ApiResult;

export interface DiseaseOpsRow {
  row_id?: number;
  disease_id?: number;
  disease_version?: number;
  ops_type?: string;
  ops_name?: string;
  ops_code?: string;
  ops_code_system?: string;
  nnis_min?: number;
  nnis_max?: number;
  anes_type?: string;
  anes_code?: string;
  anes_name?: string;
  asa_min?: number;
  asa_max?: number;
  ops_match?: string;
  ops_link?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiseaseOpsListReq {
  disease_id: number;
  disease_version?: number;
  column_list?: string;
}

export interface GetDiseaseOpsListRes extends ApiResult {
  row_list?: DiseaseOpsRow[];
}

export interface SaveDiseaseOpsListReq {
  disease_id: number;
  delete_row?: number;
  row_list?: DiseaseOpsRow[];
}

export type SaveDiseaseOpsListRes = ApiResult;

export interface DiseasePostRow {
  disease_id?: number;
  disease_type?: string;
  action_code?: string;
  action_name?: string;
  action_script?: string;
  action_tag?: string;
  action_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiseasePostListReq {
  disease_id?: number;
  disease_type?: string;
  column_list?: string;
}

export interface GetDiseasePostListRes extends ApiResult {
  row_list?: DiseasePostRow[];
}

export interface SaveDiseasePostReq {
  disease_id?: number;
  disease_type?: string;
  action_code: string;
  post_property?: DiseasePostRow;
}

export type SaveDiseasePostRes = ApiResult;

export interface DiseaseFollowupRow {
  followup_id?: number;
  disease_id?: number;
  followup_name?: string;
  followup_message?: string;
  followup_tag?: string;
  followup_note?: string;
  time_ref?: string;
  time_offset?: number;
  time_unit?: string;
  time_note?: string;
  form_id?: number;
  form_name?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiseaseFollowupListReq {
  disease_id: number;
  disease_version?: number;
  column_list?: string;
}

export interface GetDiseaseFollowupListRes extends ApiResult {
  row_list?: DiseaseFollowupRow[];
}

export interface SaveDiseaseFollowupListReq {
  disease_id: number;
  delete_row?: number;
  row_list?: DiseaseFollowupRow[];
}

export type SaveDiseaseFollowupListRes = ApiResult;

/** 病种路径步骤行 */
export interface DiseaseStepRow {
  step_id?: number;
  disease_id?: number;
  disease_version?: number;
  date_ref?: string;
  date_start?: number;
  date_end?: number;
  step_name?: string;
  step_tag?: string;
  step_note?: string;
  sort_no?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiseaseStepListReq {
  disease_id: number;
  disease_version?: number;
  column_list?: string;
}

export interface GetDiseaseStepListRes extends ApiResult {
  row_list?: DiseaseStepRow[];
}

export interface NewDiseaseStepReq {
  disease_id: number;
  disease_version?: number;
  date_ref: string;
  date_start?: number;
  date_end?: number;
  step_name?: string;
  step_tag?: string;
  step_note?: string;
  sort_no?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewDiseaseStepRes extends ApiResult {
  step_id?: number;
}

export interface DeleteDiseaseStepReq {
  step_id: number;
  delete_note?: string;
}

export type DeleteDiseaseStepRes = ApiResult;

export interface GetDiseaseStepPropertyReq {
  step_id: number;
  disease_version?: number;
  column_list?: string;
}

export interface GetDiseaseStepPropertyRes extends ApiResult {
  step_property?: DiseaseStepRow;
}

export interface SaveDiseaseStepPropertyReq {
  step_id: number;
  step_property: DiseaseStepRow;
}

export type SaveDiseaseStepPropertyRes = ApiResult;

/** 病种路径步骤动作行 */
export interface DiseaseStepActionRow {
  action_id?: number;
  disease_id?: number;
  disease_version?: number;
  step_id?: number;
  work_type?: string;
  action_type?: string;
  action_name?: string;
  action_stmt?: string;
  action_tag?: string;
  action_note?: string;
  sort_no?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDiseaseStepActionListReq {
  disease_id: number;
  disease_version?: number;
  step_id?: number;
  column_list?: string;
}

export interface GetDiseaseStepActionListRes extends ApiResult {
  row_list?: DiseaseStepActionRow[];
}

export interface NewDiseaseStepActionReq {
  disease_id: number;
  disease_version?: number;
  step_id: number;
  work_type?: string;
  action_type?: string;
  action_name?: string;
  action_stmt?: string;
  action_tag?: string;
  action_note?: string;
  sort_no?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewDiseaseStepActionRes extends ApiResult {
  action_id?: number;
}

export interface DeleteDiseaseStepActionReq {
  action_id: number;
  delete_note?: string;
}

export type DeleteDiseaseStepActionRes = ApiResult;

export interface GetDiseaseStepActionPropertyReq {
  action_id: number;
  disease_version?: number;
  column_list?: string;
}

export interface GetDiseaseStepActionPropertyRes extends ApiResult {
  action_property?: DiseaseStepActionRow;
}

export interface SaveDiseaseStepActionPropertyReq {
  action_id: number;
  action_property: DiseaseStepActionRow;
}

export type SaveDiseaseStepActionPropertyRes = ApiResult;
