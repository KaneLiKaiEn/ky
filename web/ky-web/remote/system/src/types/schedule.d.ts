import type { ApiResult } from "./comm";

export interface ClinicRegRow {
  reg_id?: number;
  reg_name?: string;
  sort_no?: string;
  kb_code?: string;
}

export interface GetRegListReq {
  column_list?: string;
}

export interface GetRegListRes extends ApiResult {
  row_list?: ClinicRegRow[];
}

export interface GetUserRegListReq {
  user_id?: number;
}

export interface GetUserRegListRes extends ApiResult {
  row_list?: ClinicRegRow[];
}

export interface SaveUserRegListReq {
  user_id?: number;
  delete_row?: number;
  row_list?: ClinicRegRow[];
}

export interface SaveUserRegListRes extends ApiResult {}

/** Common scheduling department fields; the last five fields are clinic only. */
export interface ScheduledDeptRow {
  dept_id?: number | null;
  org_id?: number | null;
  dept_no?: string | null;
  dept_code?: string | null;
  dept_name?: string | null;
  dept_tag?: string | null;
  dept_desc?: string | null;
  disease_tag?: string | null;
  sort_no?: string | null;
  kb_code?: string | null;
  input_time?: string | null;
  input_session?: string | null;
  input_note?: string | null;
  gender_name?: string | null;
  marital_name?: string | null;
  age_min?: number | null;
  age_max?: number | null;
  age_unit?: string | null;
}

export interface GetScheduledDeptPropertyReq {
  dept_id: number;
  column_list?: string;
}

export interface GetScheduledDeptPropertyRes extends ApiResult {
  /** Unregistered departments may omit the property entirely. */
  dept_property?: ScheduledDeptRow | null;
}

export interface SaveScheduledDeptPropertyReq {
  dept_id: number;
  dept_property: ScheduledDeptRow;
}

export interface DeleteScheduledDeptReq {
  dept_id: number;
  delete_note?: string;
}

export interface ScheduledDeptMutationRes extends ApiResult {}
