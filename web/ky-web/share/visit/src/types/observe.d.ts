/** 与 observe.proto / comm.proto ObserveRow 对齐 */

import type { ApiResult } from "./comm";

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

export interface GetObserveListReq {
  org_id?: number;
  patient_id?: number;
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

export interface NewObserveReq extends ObserveRow {}

export interface NewObserveRes extends ApiResult {
  observe_id?: number;
}

export interface SaveObservePropertyReq {
  observe_id: number;
  observe_property: ObserveRow;
}

export type SaveObservePropertyRes = ApiResult;

export interface DeleteObserveReq {
  observe_id: number;
  delete_note?: string;
}

export type DeleteObserveRes = ApiResult;
