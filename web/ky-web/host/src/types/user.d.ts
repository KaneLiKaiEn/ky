/** 与 user.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface UserDeptRow {
  row_id?: number;
  user_id?: number;

  org_id?: number;
  org_name?: string;
  dept_type?: string;
  dept_id?: number;
  dept_name?: string;
  work_type?: string;
  work_level?: string;
  work_title?: string;

  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetUserDeptListReq {
  user_id?: number;
  dept_type?: string;
  include_owner?: boolean;
  column_list?: string;
}

export interface GetUserDeptListRes extends ApiResult {
  dept_list?: UserDeptRow[];
}
