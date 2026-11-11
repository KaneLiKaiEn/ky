/**
 * 机构／院区协议来源：xmhis/talk，核对版本 dc7ce511（2026-10-14）。
 * https://github.com/xmhis/talk/blob/dc7ce511ecaa5df3abe6c1188fd7858666cab635/org/org.proto
 */

import type { ApiResult } from "./comm";

export interface OrgRow {
  org_id?: number;
  parent_id?: number;
  catalog_id?: number;
  org_no?: string;
  org_code?: string;
  org_system?: string;
  org_tag?: string;
  org_name?: string;
  org_name_abbr?: string;
  org_name_legend?: string;
  org_name_alias?: string;
  org_name_full?: string;
  org_level?: number;
  org_grade?: number;
  org_telno?: string;
  org_address?: string;
  org_address_nation?: string;
  org_address_state?: string;
  org_address_city?: string;
  org_address_county?: string;
  org_address_detail?: string;
  org_address_post?: string;
  org_address_district?: string;
  org_address_long?: number;
  org_address_lat?: number;
  org_address_map?: string;
  org_note?: string;
  settle_type?: string;
  settle_name?: string;
  source_port?: number;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BranchRow {
  branch_id?: number;
  org_id?: number;
  branch_no?: string;
  branch_code?: string;
  branch_tag?: string;
  branch_name?: string;
  branch_name_abbr?: string;
  branch_name_legend?: string;
  branch_name_alias?: string;
  branch_telno?: string;
  branch_address?: string;
  branch_address_nation?: string;
  branch_address_state?: string;
  branch_address_city?: string;
  branch_address_county?: string;
  branch_address_detail?: string;
  branch_address_post?: string;
  branch_address_district?: string;
  branch_address_long?: number;
  branch_address_lat?: number;
  branch_address_map?: string;
  branch_note?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface DeptRow {
  dept_id?: number;
  org_id?: number;
  branch_id?: number;
  branch_name?: string;
  parent_id?: number;
  parent_name?: string;
  tree_code?: string;
  dept_type?: string;
  dept_level?: number;
  dept_no?: string;
  dept_code?: string;
  dept_name?: string;
  dept_name_abbr?: string;
  dept_name_legend?: string;
  dept_location?: string;
  dept_telno?: string;
  dept_tag?: string;
  dept_note?: string;
  child_count?: number;
  director_id?: string;
  director_name?: string;
  director_tag?: string;
  icon_name?: string;
  icon_system?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  kb_code?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface DeptLinkRow {
  row_id?: number;
  dept_id?: number;
  dept_name?: string;
  link_id?: number;
  link_type?: string;
  link_name?: string;
  link_tag?: string;
  link_note?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RoleRow {
  role_id?: number;
  org_id?: number;
  owner_type?: string;
  owner_id?: number;
  catalog_id?: number;
  role_no?: string;
  role_code?: string;
  role_name?: string;
  role_tag?: string;
  role_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveRoleListReq {
  org_id?: number;
  catalog_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveRoleListRes extends ApiResult {
  role_list?: RoleRow[];
}

export interface GetOrgListReq {
  catalog_id?: number;
  tag_list?: string;
  include_invalid?: boolean;
  column_list?: string;
}

export interface GetOrgListRes extends ApiResult {
  org_list?: OrgRow[];
}

/** NewOrgReq 为平铺属性；协议中没有 org_id。 */
export type NewOrgReq = Omit<OrgRow, "org_id"> & { org_id?: never };

export interface NewOrgRes extends ApiResult {
  org_id?: number;
}

export interface GetOrgPropertyReq {
  org_id: number;
  column_list?: string;
}

export interface GetOrgPropertyRes extends ApiResult {
  org_property?: OrgRow;
}

export interface SaveOrgPropertyReq {
  org_id: number;
  org_property: OrgRow;
}

export interface SaveOrgPropertyRes extends ApiResult {}

export interface DeleteOrgReq {
  org_id: number;
  delete_note?: string;
}

export interface DeleteOrgRes extends ApiResult {}

export interface GetBranchListReq {
  org_id: number;
  include_invalid?: boolean;
  column_list?: string;
}

export interface GetBranchListRes extends ApiResult {
  branch_list?: BranchRow[];
}

/** NewBranchReq 为平铺属性；协议中没有 branch_id。 */
export type NewBranchReq = Omit<BranchRow, "branch_id"> & { branch_id?: never };

export interface NewBranchRes extends ApiResult {
  branch_id?: number;
}

export interface GetBranchPropertyReq {
  branch_id: number;
  column_list?: string;
}

export interface GetBranchPropertyRes extends ApiResult {
  branch_property?: BranchRow;
}

export interface SaveBranchPropertyReq {
  branch_id: number;
  branch_property: BranchRow;
}

export interface SaveBranchPropertyRes extends ApiResult {}

export interface DeleteBranchReq {
  branch_id: number;
  delete_note?: string;
}

export interface DeleteBranchRes extends ApiResult {}

export interface GetDeptListReq {
  org_id?: number;
  parent_id?: number;
  dept_type?: string;
  tag_list?: string;
  include_invalid?: boolean;
  include_descendant?: boolean;
  include_self?: boolean;
  column_list?: string;
}

export interface GetDeptListRes extends ApiResult {
  dept_list?: DeptRow[];
}

export interface GetDeptPropertyReq {
  dept_id?: number;
  dept_no?: string;
  column_list?: string;
}

export interface GetDeptPropertyRes extends ApiResult {
  dept_property?: DeptRow;
}

/** NewDept uses flat properties; dept_id=0 asks the server to allocate an ID. */
export type NewDeptReq = DeptRow & { org_id: number; dept_type: string; dept_name: string };
export interface NewDeptRes extends ApiResult {
  dept_id?: number;
}
export interface SaveDeptPropertyReq {
  dept_id: number;
  dept_property: DeptRow;
}
export interface DeleteDeptReq {
  dept_id: number;
  delete_note?: string;
}
export interface GetDeptLinkListReq {
  dept_id: number;
  link_type?: string;
  column_list?: string;
}
export interface GetDeptLinkListRes extends ApiResult {
  link_list?: DeptLinkRow[];
}
export interface SaveDeptLinkListReq {
  dept_id: number;
  /** 0 replaces all rows; an empty link_list clears all links. */
  delete_row: number;
  link_list: DeptLinkRow[];
}

export interface GetRoleListReq {
  org_id?: number;
  owner_type?: string;
  owner_id?: number;
  catalog_id?: number;
  include_invalid?: boolean;
  column_list?: string;
}

export interface GetRoleListRes extends ApiResult {
  role_list?: RoleRow[];
}

/** Editable role fields; IDs and audit data are supplied separately. */
export type RolePropertyData = Pick<
  RoleRow,
  "org_id" | "role_name" | "role_note" | "role_tag" | "sort_no"
>;

export interface GetRolePropertyReq {
  role_id: number;
  column_list?: string;
}

export interface GetRolePropertyRes extends ApiResult {
  role_property?: RoleRow;
}

/** NewRole accepts flat properties and allocates the role ID on the server. */
export type NewRoleReq = RolePropertyData & { role_id?: never };

export interface NewRoleRes extends ApiResult {
  role_id?: number;
}

export interface SaveRolePropertyReq {
  role_id: number;
  role_property: RolePropertyData;
}

export interface SaveRolePropertyRes extends ApiResult {}

export interface DeleteRoleReq {
  role_id: number;
  delete_note?: string;
}

export interface DeleteRoleRes extends ApiResult {}
