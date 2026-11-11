/** 与 federation.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface AppRow {
  app_code?: string;
  app_name?: string;
  app_tag?: string;
  app_note?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface AppEntryRow {
  app_code?: string;
  entry_code?: string;
  entry_name?: string;
  entry_tag?: string;
  entry_note?: string;
  icon_name?: string;
  icon_system?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetAppListReq {
  column_list?: string;
}

export interface GetAppListRes extends ApiResult {
  app_list?: AppRow[];
}

export interface GetAppEntryListReq {
  app_code?: string;
  column_list?: string;
}

export interface GetAppEntryListRes extends ApiResult {
  row_list?: AppEntryRow[];
}

export interface ModuleRow {
  module_id?: number;
  org_id?: number;
  catalog_id?: number;
  parent_id?: number;
  parent_name?: string;
  module_no?: string;
  module_code?: string;
  module_name?: string;
  module_abbr?: string;
  module_tag?: string;
  module_note?: string;
  icon_name?: string;
  icon_system?: string;
  app_code?: string;
  app_name?: string;
  entry_code?: string;
  entry_name?: string;
  entry_arg?: string;
  entry2_id?: string;
  entry2_name?: string;
  entry2_arg?: string;
  ext_url?: string;
  ext_file_win?: string;
  ext_path_win?: string;
  ext_arg_win?: string;
  ext_file_linux?: string;
  ext_path_linux?: string;
  ext_arg_linux?: string;
  ext_file_mac?: string;
  ext_path_mac?: string;
  ext_arg_mac?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ModuleAuthRow {
  row_id?: number;
  module_id?: number;
  module_name?: string;
  auth_type?: string;
  auth_id?: number;
  auth_name?: string;
  auth_tag?: string;
  auth_note?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewModuleReq {
  org_id?: number;
  catalog_id?: number;
  parent_id?: number;
  parent_name?: string;
  module_no?: string;
  module_code?: string;
  module_name?: string;
  module_abbr?: string;
  module_tag?: string;
  module_note?: string;
  icon_name?: string;
  icon_system?: string;
  app_code?: string;
  app_name?: string;
  entry_code?: string;
  entry_name?: string;
  entry_arg?: string;
  entry2_code?: string;
  entry2_name?: string;
  entry2_arg?: string;
  ext_url?: string;
  ext_file_win?: string;
  ext_path_win?: string;
  ext_arg_win?: string;
  ext_file_linux?: string;
  ext_path_linux?: string;
  ext_arg_linux?: string;
  ext_file_mac?: string;
  ext_path_mac?: string;
  ext_arg_mac?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewModuleRes extends ApiResult {
  module_id?: number;
}

export interface DeleteModuleReq {
  module_id?: number;
  delete_note?: string;
}

export interface DeleteModuleRes extends ApiResult {}

export interface GetModuleListReq {
  org_id?: number;
  catalog_id?: number;
  parent_id?: number;
  app_code?: string;
  include_invalid?: boolean;
  include_descendant?: boolean;
  include_self?: boolean;
  column_list?: string;
}

export interface GetModuleListRes extends ApiResult {
  row_list?: ModuleRow[];
}

export interface GetMyModuleListReq {
  app_code?: string;
  column_list?: string;
  column_app?: string;
}

export interface GetMyModuleListRes extends ApiResult {
  row_list?: ModuleRow[];
  app_list?: AppRow[];
}

export interface GetModulePropertyReq {
  module_id?: number;
  module_no?: string;
  module_code?: string;
  module_name?: string;
  column_list?: string;
}

export interface GetModulePropertyRes extends ApiResult {
  module_property?: ModuleRow;
}

export interface SaveModulePropertyReq {
  module_id?: number;
  module_property?: ModuleRow;
}

export interface SaveModulePropertyRes extends ApiResult {}

export interface GetModuleAuthListReq {
  module_id?: number;
  column_list?: string;
}

export interface GetModuleAuthListRes extends ApiResult {
  row_list?: ModuleAuthRow[];
}

export interface SaveModuleAuthListReq {
  module_id?: number;
  delete_row?: number;
  row_list?: ModuleAuthRow[];
}

export interface SaveModuleAuthListRes extends ApiResult {}

export interface GetAuthModuleListReq {
  auth_type?: string;
  auth_id?: number;
  column_list?: string;
}

export interface GetAuthModuleListRes extends ApiResult {
  row_list?: ModuleAuthRow[];
}

export interface SaveAuthModuleListReq {
  auth_type?: string;
  auth_id?: number;
  auth_name?: string;
  delete_row?: number;
  row_list?: ModuleAuthRow[];
}

export interface SaveAuthModuleListRes extends ApiResult {}
