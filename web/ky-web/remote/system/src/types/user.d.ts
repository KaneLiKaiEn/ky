/** xmhis/talk user/user.proto，核对版本 dc7ce511（2026-10-14）。 */

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

export interface UserRoleRow {
  row_id?: number;
  user_id?: number;
  role_id?: number;
  role_name?: string;
  user_name?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface UserRoleData extends UserRoleRow {
  user_id: number;
  role_id: number;
  role_name: string;
  user_name: string;
}

export interface UserDeptRow {
  row_id?: number;
  user_id?: number;
  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  dept_type?: string;
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

export interface UserDeptData extends UserDeptRow {
  user_id: number;
  org_id: number;
  dept_id: number;
  dept_name: string;
  dept_type: string;
}

export type UserRoleItem = UserRoleRow;
export type UserDeptItem = UserDeptRow;

export interface UserAppProperty {
  user_id?: number;
  app_id?: number;
  app_name?: string;
}

export interface UserLoginProperty {
  user_id?: number;
  sys_name?: string;
}

export interface UserDeviceRow {
  row_id?: number;
  user_id?: number;
  device_no?: string;
  device_name?: string;
  device_time?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_note?: string;
}

export interface RetrieveUserListReq {
  org_id?: number;
  dept_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  include_invalid?: boolean;
  exclude_auth?: boolean;
  work_type?: string;
  work_title?: string;
  work_level?: string;
  column_list?: string;
}

export interface RetrieveUserListRes extends ApiResult {
  user_list?: UserRow[];
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

export interface GetUserPropertyReq {
  user_id?: number;
  user_no?: string;
  column_list?: string;
}

export interface GetUserPropertyRes extends ApiResult {
  user_property?: UserRow;
}

export interface NewUserReq extends UserRow {
  user_id: 0;
}

export interface NewUserRes extends ApiResult {
  user_id?: number;
}

export interface SaveUserPropertyReq {
  user_id?: number;
  user_property?: UserRow;
}

export interface SaveUserPropertyRes extends ApiResult {}

export interface DeleteUserReq {
  user_id?: number;
  user_no?: string;
  delete_note?: string;
}

export interface DeleteUserRes extends ApiResult {}

export interface GetUserRoleListReq {
  user_id?: number;
  column_list?: string;
}

export interface GetUserRoleListRes extends ApiResult {
  role_list?: UserRoleRow[];
}

export interface SaveUserRoleListReq {
  user_id?: number;
  delete_row?: number;
  role_list?: UserRoleData[];
}

export interface SaveUserRoleListRes extends ApiResult {}

export interface GetRoleUserListReq {
  role_id: number;
  column_list?: string;
}

export interface GetRoleUserListRes extends ApiResult {
  user_list?: UserRow[];
}

export interface SaveRoleUserListReq {
  role_id: number;
  /** Replace the complete membership; an empty array removes all members. */
  delete_row: 0;
  user_list: UserRoleData[];
}

export interface SaveRoleUserListRes extends ApiResult {}

export interface GetUserDeptListReq {
  user_id?: number;
  dept_type?: string;
  include_owner?: boolean;
  column_list?: string;
}

export interface GetUserDeptListRes extends ApiResult {
  dept_list?: UserDeptRow[];
}

export interface SaveUserDeptListReq {
  user_id?: number;
  delete_row?: number;
  dept_type?: string;
  dept_list?: UserDeptData[];
}

export interface SaveUserDeptListRes extends ApiResult {}

export interface GetUserAppReq {
  user_id?: number;
}

export interface GetUserAppRes extends ApiResult {
  app_property?: UserAppProperty;
}

export interface SaveUserAppReq {
  user_id?: number;
  app_id?: number;
  app_name?: string;
}

export interface SaveUserAppRes extends ApiResult {}

export interface GetUserLoginReq {
  user_id?: number;
}

export interface GetUserLoginRes extends ApiResult {
  login_property?: UserLoginProperty;
}

export interface SaveUserLoginReq {
  user_id?: number;
  sys_name?: string;
}

export interface SaveUserLoginRes extends ApiResult {}

export interface GetUserWriteImageReq {
  user_id?: number;
}

export interface GetUserWriteImageRes extends ApiResult {
  image_format?: string;
  image_content?: string;
  image_width?: number;
  image_height?: number;
}

export interface SaveUserWriteImageReq {
  user_id?: number;
  image_format?: string;
  image_content?: string;
  image_width?: number;
  image_height?: number;
}

export interface SaveUserWriteImageRes extends ApiResult {}

export interface GetUserPhotoReq {
  user_id?: number;
}

export interface GetUserPhotoRes extends ApiResult {
  photo_format?: string;
  /** bytes 在 JSON 中编码为 Base64。旧字节数组仅在页面适配层兼容。 */
  photo_content?: string;
}

export interface SaveUserPhotoReq {
  user_id?: number;
  photo_format?: string;
  photo_content?: string;
}

export interface SaveUserPhotoRes extends ApiResult {}

export interface GetUserDeviceListReq {
  user_id?: number;
}

export interface GetUserDeviceListRes extends ApiResult {
  device_list?: UserDeviceRow[];
}

export interface ApproveUserDeviceReq {
  row_id?: number;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
}

export interface ApproveUserDeviceRes extends ApiResult {}

export interface RevokeUserDeviceReq {
  row_id?: number;
}

export interface RevokeUserDeviceRes extends ApiResult {}
