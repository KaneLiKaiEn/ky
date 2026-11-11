/** 与 sys.proto 对齐的类型定义（系统字典） */

import type { ApiResult } from "./comm";

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

/** 检索区域列表 */
export interface RetrieveAreaListReq {
  /** 父节点 ID，0=不限 */
  parent_id?: number;
  /** 等级，0=不限 */
  area_level?: number;

  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

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

export interface RetrieveAreaListRes extends ApiResult {
  row_list?: AreaRow[];
}

/** 获取区域属性（参保地等） */
export interface GetAreaPropertyReq {
  area_id: number;
}

export interface GetAreaPropertyRes extends ApiResult {
  area_property?: AreaRow;
}