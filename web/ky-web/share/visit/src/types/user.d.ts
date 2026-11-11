/** 与 user.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface UserRow {
  user_id?: number;
  employee_id?: number;
  student_id?: number;
  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  user_no?: string;
  user_code?: string;
  user_code2?: string;
  user_telno?: string;
  user_idno?: string;
  user_name?: string;
  user_gender?: string;
  user_dob?: string;
  user_tag?: string;
  user_note?: string;
  work_type?: string;
  work_date?: string;
  work_title?: string;
  work_level?: string;
  skill_level?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetUserListReq {
  org_id?: number;
  dept_id?: number;
  page_size?: number;
  page_no?: number;
  include_invalid?: boolean;
  work_type?: string;
  work_title?: string;
  work_level?: string;
  column_list?: string;
}

export interface GetUserListRes extends ApiResult {
  user_list?: UserRow[];
  page_count?: number;
}

export interface GetUserList2Req {
  org_id?: number;
  dept_id_list?: number[];
  include_invalid?: boolean;
  include_descendant?: boolean;
  user_tag?: string;
  work_type?: string;
  work_title?: string;
  work_level?: string;
  page_size?: number;
  page_no?: number;
  column_list?: string;
}

export interface GetUserList2Res extends ApiResult {
  page_count?: number;
  user_list?: UserRow[];
}

export interface RetrieveUserListReq {
  org_id?: number;
  dept_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  work_type?: string;
  work_title?: string;
  work_level?: string;
  column_list?: string;
}

export interface RetrieveUserListRes extends ApiResult {
  user_list?: UserRow[];
}

export interface GetUserWriteImageReq {
  user_id: number;
}

export interface GetUserWriteImageRes extends ApiResult {
  image_format?: string;
  image_content?: string;
  image_width?: number;
  image_height?: number;
}
