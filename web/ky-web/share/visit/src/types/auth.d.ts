/** 与 auth.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface SessionRow {
  session_id?: string;
  session_ca?: string;
  session_link?: string;
  session_sso?: string;
  user_id?: number;
  user_no?: string;
  user_code?: string;
  user_name?: string;
  user_tag?: string;
  employee_id?: number;
  student_id?: number;
  teacher_id?: number;
  teacher_name?: string;
  org_id?: number;
  org_no?: string;
  org_code?: string;
  org_name?: string;
  branch_id?: number;
  branch_no?: string;
  branch_code?: string;
  branch_name?: string;
  dept_id?: number;
  dept_no?: string;
  dept_code?: string;
  dept_name?: string;
  work_type?: string;
  work_title?: string;
  work_level?: string;
  device_no?: string;
  device_name?: string;
  login_time?: string;
  login_app?: string;
  login_ip?: string;
  login_device?: string;
  login_tag?: string;
  login_note?: string;
  end_time?: string;
  end_tag?: string;
  end_note?: string;
  logout_time?: string;
  logout_tag?: string;
  logout_note?: string;
}

export interface GetSessionInfoReq {
  session_id?: string;
  include_timeout?: boolean;
  include_logout?: boolean;
  column_list?: string;
}

export interface GetSessionInfoRes extends ApiResult {
  session_info?: SessionRow;
  access_info?: SessionRow;
}

export interface LoginReq {
  user_no: string;
  user_pwd: string;
  device_no?: string;
  device_name?: string;
  login_app?: string;
  login_ip?: string;
  login_device?: string;
  login_tag?: string;
  login_note?: string;
  end_time?: string;
  end_tag?: string;
  end_note?: string;
}

export interface LoginRes extends ApiResult {
  session_id?: string;
}
