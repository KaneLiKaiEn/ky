/**
 * 协议来源：https://github.com/xmhis/talk/tree/098c3a7f828324989f14a194b538b0d159134eeb
 * 核对版本：098c3a7f828324989f14a194b538b0d159134eeb。保持 proto 原字段名；行扩展值使用 unknown。
 */

import type { ApiResult, ProtoRow } from "./comm.d.ts";

/** sys/comm.proto · CatalogRow */
export interface CatalogRow extends ProtoRow {
  catalog_id?: number;
  org_id?: number;
  dept_id?: number;
  group_id?: number;
  unit_id?: number;
  user_id?: number;
  parent_id?: number;
  tree_code?: string;
  catalog_type?: string;
  catalog_no?: string;
  catalog_code?: string;
  catalog_level?: number;
  catalog_name?: string;
  catalog_tag?: string;
  catalog_note?: string;
  child_count?: number;
  icon_system?: string;
  icon_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface Dict2ItemRow extends ProtoRow {
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

/** sys/sys.proto · DeleteCatalogReq */
export interface DeleteCatalogReq {
  catalog_id: number;
  delete_note?: string;
}

/** sys/sys.proto · DeleteCatalogRes */
export interface DeleteCatalogRes extends ApiResult {}

/** sys/sys.proto · GetCatalogListReq */
export interface GetCatalogListReq {
  parent_id?: number;
  catalog_type?: string;
  org_id?: number;
  dept_id?: number;
  group_id?: number;
  unit_id?: number;
  user_id?: number;
  include_invalid?: boolean;
  include_descendant?: boolean;
  include_self?: boolean;
  column_list?: string;
}

/** sys/sys.proto · GetCatalogListRes */
export interface GetCatalogListRes extends ApiResult {
  catalog_list?: CatalogRow[];
}

/** sys/sys.proto · GetCatalogPropertyReq */
export interface GetCatalogPropertyReq {
  catalog_id: number;
  column_list?: string;
}

/** sys/sys.proto · GetCatalogPropertyRes */
export interface GetCatalogPropertyRes extends ApiResult {
  catalog_property?: CatalogRow;
}

/** sys/sys.proto · NewCatalogReq */
export interface NewCatalogReq {
  parent_id?: number;
  org_id?: number;
  dept_id?: number;
  group_id?: number;
  unit_id?: number;
  user_id?: number;
  tree_code?: string;
  catalog_type?: string;
  catalog_no?: string;
  catalog_code?: string;
  catalog_level?: number;
  catalog_name: string;
  catalog_tag?: string;
  catalog_note?: string;
  child_count?: number;
  icon_system?: string;
  icon_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** sys/sys.proto · NewCatalogRes */
export interface NewCatalogRes extends ApiResult {
  catalog_id?: number;
}

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

/** sys/sys.proto · SaveCatalogPropertyReq */
export interface SaveCatalogPropertyReq {
  catalog_id: number;
  catalog_property: CatalogRow;
}

/** sys/sys.proto · SaveCatalogPropertyRes */
export interface SaveCatalogPropertyRes extends ApiResult {}
