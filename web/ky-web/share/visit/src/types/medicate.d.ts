/** 与 medicate.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface GetPrefabListReq {
  org_id?: number;
  dept_id?: number;
  user_id?: number;

  include_org?: boolean;
  include_dept?: boolean;

  prefab_type?: string;

  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  column_list?: string;
}

export interface PrefabRow {
  /** 行 ID */
  prefab_id?: number;
  org_id?: number;
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;

  prefab_type?: string;
  prefab_name?: string;
  prefab_tag?: string;
  prefab_note?: string;

  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPrefabListRes extends ApiResult {
  row_list?: PrefabRow[];
}

export interface GetPrefabDetailReq {
  prefab_id?: number;
  column_list?: string;
}

export interface PrefabDetailRow {
  prefab_id?: number;

  item_type?: string;
  item_id?: number;
  item_name?: string;
  item_quantity?: string;
  item_tag?: string;
  item_note?: string;

  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPrefabDetailRes extends ApiResult {
  row_list?: PrefabDetailRow[];
}
