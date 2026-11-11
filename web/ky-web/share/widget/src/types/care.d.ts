/** 与 care.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";
import type { ElemRow } from "./elem";

export interface ObserveRow {
  observe_id?: number;
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;
  care_id?: number;
  user_id?: number;
  user_name?: string;
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  elem_unit?: string;
  observe_time?: string;
  observe_value?: string;
  observe_value_int?: number;
  observe_value_dec?: string;
  observe_value_tip?: string;
  observe_duration?: number;
  observe_body?: string;
  observe_method?: string;
  observe_device?: string;
  observe_app?: string;
  observe_tag?: string;
  observe_note?: string;
  observe_status?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  commit_time?: string;
  commit_session?: string;
  commit_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ObserveLatestRow {
  observe_id?: number;
  org_id?: number;
  visit_id?: number;
  baby_id?: number;
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  elem_unit?: string;
  observe_type?: string;
  observe_time?: string;
  observe_value?: string;
  observe_value_int?: number;
  observe_value_dec?: string;
  observe_value_tip?: string;
  observe_duration?: number;
  observe_body?: string;
  observe_method?: string;
  observe_device?: string;
  observe_app?: string;
  observe_tag?: string;
  observe_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ObserveFavoriteRow {
  row_id?: number;
  visit_id?: number;
  baby_id?: number;
  work_type?: string;
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  elem_unit?: string;
  favorite_duration?: number;
  favorite_unit?: string;
  favorite_tag?: string;
  favorite_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetObserveLatestReq {
  visit_id?: number;
  baby_id?: number;
  observe_type?: string;
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  column_list?: string;
}

export interface GetObserveLatestRes extends ApiResult {
  row_list?: ObserveLatestRow[];
}

export interface GetObserveFavoriteListReq {
  visit_id?: number;
  baby_id?: number;
  work_type?: string;
  column_list?: string;
}

export interface GetObserveFavoriteListRes extends ApiResult {
  row_list?: ObserveFavoriteRow[];
}

export interface SaveObserveFavoriteListReq {
  visit_id?: number;
  baby_id?: number;
  work_type?: string;
  delete_row?: number;
  row_list?: ObserveFavoriteRow[];
}

export interface SaveObserveFavoriteListRes extends ApiResult {}

export interface GetObserveListReq {
  visit_id?: number;
  baby_id?: number;
  observe_start?: string;
  observe_end?: string;
  observe_time_list?: string[];
  care_id_list?: number[];
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  observe_tag?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  dock_minute5?: boolean;
  column_list?: string;
}

export interface GetObserveListRes extends ApiResult {
  row_list?: ObserveRow[];
}

/** 关注项 UI 状态 */
export interface FavoriteItem extends ObserveFavoriteRow {
  checked: boolean;
  tempChecked: boolean;
}

/** 列表展示项：最新值 + 关注配置 + 数据元属性 + 历史趋势 */
export type VitalSignItem = ObserveLatestRow &
  ElemRow &
  FavoriteItem & {
    observeList?: ObserveRow[];
  };
