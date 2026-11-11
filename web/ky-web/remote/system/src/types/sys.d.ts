/** 与 sys.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface Dict2Row {
  dict_id?: number;
  version_no?: number;
  org_id?: number;
  owner_type?: string;
  owner_id?: number;
  catalog_id?: number;
  dict_type?: string;
  dict_level?: string;
  dict_no?: string;
  dict_code?: string;
  dict_code_system?: string;
  dict_name?: string;
  dict_tag?: string;
  dict_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface Dict2ItemRow {
  row_id?: number;
  version_no?: number;
  dict_id?: number;
  item_id?: number;
  item_no?: string;
  item_code?: string;
  item_name?: string;
  item_spec?: string;
  item_unit?: string;
  item_value?: string;
  item_value_int?: number;
  item_value_dec?: string;
  item_tag?: string;
  item_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveDict2ListReq {
  org_id?: number;
  owner_type?: string;
  owner_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveDict2ListRes extends ApiResult {
  row_list?: Dict2Row[];
}

export interface NewDict2Req {
  version_no?: number;
  org_id?: number;
  owner_type?: string;
  owner_id?: number;
  catalog_id?: number;
  dict_type?: string;
  dict_level?: string;
  dict_no?: string;
  dict_code?: string;
  dict_code_system?: string;
  dict_name?: string;
  dict_tag?: string;
  dict_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewDict2Res extends ApiResult {
  dict_id?: number;
}

export interface DeleteDict2Req {
  dict_id?: number;
  delete_note?: string;
}

export interface DeleteDict2Res extends ApiResult {}

export interface SaveDict2PropertyReq {
  dict_id?: number;
  dict_property?: Dict2Row;
}

export interface SaveDict2PropertyRes extends ApiResult {}

export interface RetrieveDict2ItemListReq {
  dict_id?: number;
  dict_no?: string;
  dict_code?: string;
  dict_name?: string;
  org_id?: number;
  owner_type?: string;
  owner_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveDict2ItemListRes extends ApiResult {
  row_list?: Dict2ItemRow[];
}

export interface NewDict2ItemReq {
  version_no?: number;
  dict_id?: number;
  item_id?: number;
  item_no?: string;
  item_code?: string;
  item_name?: string;
  item_spec?: string;
  item_unit?: string;
  item_value?: string;
  item_value_int?: number;
  item_value_dec?: string;
  item_tag?: string;
  item_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewDict2ItemRes extends ApiResult {
  row_id?: number;
}

export interface DeleteDict2ItemReq {
  row_id?: number;
  delete_note?: string;
}

export interface DeleteDict2ItemRes extends ApiResult {}

export interface SaveDict2ItemPropertyReq {
  row_id?: number;
  item_property?: Dict2ItemRow;
}

export interface SaveDict2ItemPropertyRes extends ApiResult {}

export interface GetParamValueReq {
  org_id?: number;
  dept_id?: number;
  user_id?: number;
  item_code?: string;
}

export interface GetParamValueRes extends ApiResult {
  item_value?: string;
  item_value_int?: number;
  item_value_dec?: string;
}

export interface SysAppRow {
  app_id?: number;
  app_name?: string;
  icon_name?: string;
  kb_code?: string;
}

export interface GetSysAppListReq {
  column_list?: string;
}

export interface GetSysAppListRes extends ApiResult {
  app_list?: SysAppRow[];
}

export interface AuthAppRow {
  row_id?: number;
  app_id?: number;
  app_name?: string;
  sort_no?: string;
  kb_code?: string;
}

export interface GetAuthAppListReq {
  auth_type?: string;
  auth_id?: number;
  org_id?: number;
  column_list?: string;
}

export interface GetAuthAppListRes extends ApiResult {
  row_list?: AuthAppRow[];
}

export interface AddAuthAppReq {
  auth_type?: string;
  auth_id?: number;
  auth_name?: string;
  app_id?: number;
  app_name?: string;
  sort_no?: string;
}

export interface AddAuthAppRes extends ApiResult {}

export interface DeleteAuthAppReq {
  row_id?: number;
}

export interface DeleteAuthAppRes extends ApiResult {}

export interface SysModuleRow {
  module_id?: number;
  module_name?: string;
  kb_code?: string;
}

export interface GetSysModuleListReq {
  catalog_id?: number;
  include_invalid?: boolean;
  column_list?: string;
}

export interface GetSysModuleListRes extends ApiResult {
  module_list?: SysModuleRow[];
}

export interface AuthModuleRow {
  row_id?: number;
  module_id?: number;
  module_name?: string;
  org_id?: number;
  auth_type?: string;
  auth_id?: number;
  auth_name?: string;
  sort_no?: string;
  kb_code?: string;
}

export interface GetAuthModuleListReq {
  auth_type?: string;
  auth_id?: number;
  org_id?: number;
  app_id?: number;
  column_list?: string;
}

export interface GetAuthModuleListRes extends ApiResult {
  row_list?: AuthModuleRow[];
}

export interface SaveAuthModuleListReq {
  auth_type?: string;
  auth_id?: number;
  auth_name?: string;
  org_id?: number;
  delete_row?: number;
  row_list?: AuthModuleRow[];
}

export interface SaveAuthModuleListRes extends ApiResult {}

/**
 * 地址相关协议已核对 xmhis/talk 的 dc7ce511 版本（含 RetrieveDict2ItemList）。
 * https://github.com/xmhis/talk/blob/dc7ce511ecaa5df3abe6c1188fd7858666cab635/sys/sys.proto
 */
export interface AreaRow {
  area_id?: number;
  parent_id?: number;
  area_name?: string;
  area_name_full?: string;
  area_name_short?: string;
  area_level?: number;
  area_district?: string;
  area_post?: string;
  area_tag?: string;
  area_note?: string;
  map_long?: string;
  map_lat?: string;
  kb_code?: string;
}

export interface GetAreaListReq {
  parent_id: number;
  column_list?: string;
}

export interface GetAreaListRes extends ApiResult {
  row_list?: AreaRow[];
}

export interface RetrieveAreaListReq {
  parent_id?: number;
  area_level?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveAreaListRes extends ApiResult {
  row_list?: AreaRow[];
}
