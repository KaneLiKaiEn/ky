/** 来源：本地 talk；bytes 按 protobuf JSON 使用 base64。 */
import type { ApiResult, ProtoRow } from "./comm.d.ts";

export interface DatasetRow extends ProtoRow {
  dataset_id?: number;
  org_id?: number;
  catalog_id?: number;
  dataset_code?: string;
  dataset_name?: string;
  dataset_format?: string;
  dataset_tag?: string;
  dataset_note?: string;
  count_source?: number;
  count_stmt?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDatasetListReq {
  org_id?: number;
  catalog_id?: number;
  column_list?: string;
}

export interface GetDatasetListRes extends ApiResult {
  row_list?: DatasetRow[];
}

export interface GetDatasetPropertyReq {
  dataset_id?: number;
  dataset_code?: string;
  column_list?: string;
  column_pump?: string;
  column_post?: string;
}

export interface GetDatasetPropertyRes extends ApiResult {
  dataset_property?: DatasetRow;
  pump_property?: PumpRow;
  post_property?: PostRow;
}

export interface PumpRow extends ProtoRow {
  dataset_id?: number;
  org_id?: number;
  source_id?: number;
  source_name?: string;
  table_name?: string;
  pump_before?: string;
  pump_row?: string;
  pump_after?: string;
  pump_mq?: string;
  pump_tag?: string;
  pump_note?: string;
  freq_month?: string;
  freq_week?: string;
  freq_day?: string;
  freq_time?: string;
  freq_tag?: string;
  freq_note?: string;
  loop_time?: number;
  loop_range?: string;
  loop_tag?: string;
  loop_note?: string;
  pre_id?: number;
  pre_name?: string;
  post_id?: number;
  post_name?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface PostRow extends ProtoRow {
  dataset_id?: number;
  org_id?: number;
  freq_month?: string;
  freq_week?: string;
  freq_day?: string;
  freq_time?: string;
  freq_tag?: string;
  freq_note?: string;
  loop_time?: number;
  loop_range?: string;
  loop_tag?: string;
  loop_note?: string;
  post_script?: string;
  post_tag?: string;
  post_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface DatasetArgRow extends ProtoRow {
  arg_id?: number;
  dataset_id?: number;
  arg_code?: string;
  arg_name?: string;
  arg_type?: string;
  arg_value?: string;
  arg_text?: string;
  arg_desc?: string;
  arg_tag?: string;
  arg_note?: string;
  value_min?: string;
  value_max?: string;
  source_type?: string;
  source_id?: number;
  source_value?: string;
  source_tag?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ArgValueRow extends ProtoRow {
  arg_code?: string;
  arg_type?: string;
  arg_value?: string;
}

export interface RoleRow extends ProtoRow {
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
  owner_type?: string;
  owner_id?: number;
  catalog_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveRoleListRes extends ApiResult {
  role_list?: RoleRow[];
}

export interface UserRow extends ProtoRow {
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

export interface MetricRow extends ProtoRow {
  metric_id?: number;
  org_id?: number;
  lib_id?: number;
  catalog_id?: number;
  metric_type?: string;
  metric_no?: string;
  metric_code?: string;
  metric_name?: string;
  metric_title?: string;
  metric_desc?: string;
  metric_orientation?: string;
  metric_tag?: string;
  metric_note?: string;
  child_count?: number;
  value_digit?: number;
  value_ratio?: string;
  value_unit?: string;
  value_tag?: string;
  admin_type?: string;
  admin_id?: number;
  admin_name?: string;
  admin_user?: string;
  admin_freq?: string;
  icon_system?: string;
  icon_name?: string;
  component_id?: number;
  component_name?: string;
  component_color?: string;
  board_id?: number;
  board_name?: string;
  cause_id?: number;
  cause_name?: string;
  unit_id?: number;
  unit_name?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  commit_time?: string;
  commit_session?: string;
  commit_note?: string;
  source_time?: string;
  source_session?: string;
  source_note?: string;
  approve_time?: string;
  approve_session?: string;
  approve_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface LibRow extends ProtoRow {
  lib_id?: number;
  org_id?: number;
  lib_no?: string;
  lib_code?: string;
  lib_name?: string;
  lib_date?: string;
  lib_tag?: string;
  lib_note?: string;
  metric_count?: number;
  icon_system?: string;
  icon_name?: string;
  board_id?: number;
  board_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveMetricListReq {
  lib_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  include_alias?: boolean;
  column_list?: string;
  column_lib?: string;
}

export interface RetrieveMetricListRes extends ApiResult {
  row_list?: MetricRow[];
  lib_list?: LibRow[];
}

export interface ReportRow extends ProtoRow {
  report_id?: number;
  org_id?: number;
  catalog_id?: number;
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;
  report_type?: string;
  report_no?: string;
  report_code?: string;
  report_name?: string;
  report_title?: string;
  report_tag?: string;
  report_note?: string;
  dataset_id?: number;
  data_start?: number;
  column_freeze?: number;
  style_name?: string;
  style_format?: string;
  icon_name?: string;
  icon_system?: string;
  board_id?: number;
  board_name?: string;
  board_width?: number;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveReportListReq {
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveReportListRes extends ApiResult {
  row_list?: ReportRow[];
}

export interface ReadReq {
  link_app?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  include_property?: boolean;
  revise_no?: number;
}

export interface ReadRes extends ApiResult {
  file_content?: string;
  property_list?: FileProperty[];
}

export interface WriteReq {
  link_app?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  file_content?: string;
  revise_note?: string;
  property_list?: FileProperty[];
}

export interface WriteRes extends ApiResult {}

export interface FileProperty {
  key?: string;
  value?: string;
}

export interface GetDatasetArgOptionReq {
  arg_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
}
export interface GetDatasetArgOptionRes extends ApiResult {
  data?: unknown;
}
export interface UnitRow extends ProtoRow {
  unit_type?: string;
  unit_id?: number;
  parent_id?: number;
  unit_name?: string;
  child_count?: number;
}
export interface GetUnitListReq {
  unit_system?: string;
  unit_type?: string;
  unit_level?: number;
  column_list?: string;
}
export interface GetUnitListRes extends ApiResult {
  row_list?: UnitRow[];
}
export interface GetUnitList2Req {
  parent_id?: number;
  unit_type?: string;
  include_self?: boolean;
  include_descendant?: boolean;
  only_leaf?: boolean;
  column_list?: string;
}
export interface GetUnitList2Res extends ApiResult {
  row_list?: UnitRow[];
}

export interface RetrieveUnitListReq {
  unit_system?: string;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}
export interface RetrieveUnitListRes extends GetUnitListRes {}
export interface GetUnitPropertyReq {
  unit_id?: number;
  org_id?: number;
  unit_name?: string;
  match_alias?: boolean;
  match_fuzzy?: boolean;
  column_list?: string;
}
export interface GetUnitPropertyRes {
  code?: number;
  message?: string;
  hint?: string;
  unit_property?: UnitRow;
}
