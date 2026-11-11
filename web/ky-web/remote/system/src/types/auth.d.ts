import type { ApiResult } from "./comm";

export interface SessionRow {
  session_id?: string;
  user_id?: number;
  user_no?: string;
  user_name?: string;
  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  dept_type?: string;
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

export interface ResetPwdReq {
  user_id?: number;
  verify_code?: string;
  user_pwd?: string;
}

export interface ResetPwdRes extends ApiResult {}
