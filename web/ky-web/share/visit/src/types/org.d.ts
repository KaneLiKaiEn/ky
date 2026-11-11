/** 与 org.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

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
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveDeptListReq {
  org_id?: number;
  branch_id?: number;
  dept_type?: string;
  tag_list?: string;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveDeptListRes extends ApiResult {
  dept_list?: DeptRow[];
}
