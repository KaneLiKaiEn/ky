/** 与 card.proto 对齐的类型定义（读卡器 / 卡类型 / 读卡患者） */

import type { ApiResult } from "@/types/comm";

/** 读卡器行 */
export interface ReaderRow {
  reader_type?: string;
  reader_name?: string;
  reader_version?: string;
  reader_port?: number;
  reader_param?: string;
  reader_tag?: string;
  reader_note?: string;

  icon_name?: string;
  icon_system?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** 激活的读卡器列表，传参为空 */
export interface GetActiveReaderListRes extends ApiResult {
  row_list?: ReaderRow[];
}

/** 读卡器支持的卡类型列表，传参为读卡器类型 */
export interface GetReaderCardTypeListReq {
  reader_type: string;
}

export interface CardTypeItem {
  card_type?: string;
  card_name?: string;
  card_tag?: string;
  card_note?: string;

  icon_name?: string;
  icon_system?: string;
}

export interface GetCardTypeListRes extends ApiResult {
  row_list?: CardTypeItem[];
}

/** 读卡信息 */
export interface CardReadInfo {
  card_type?: string;
  card_no?: string;
  card_id?: string;

  reader_type?: string;
  reader_tag?: string;
  reader_note?: string;

  read_no?: string;
  read_tag?: string;
  read_note?: string;
}

export interface GetPatientInfoReq {
  read_info?: CardReadInfo;

  /** 没有关联的患者，自动注册患者 */
  auto_insert?: boolean;
  /** 本地患者信息不一致时，自动更新 */
  auto_update?: boolean;
}

/** 读卡器读取患者信息，传参为读卡器类型和读卡信息 */
export interface GetReaderPatientInfoReq {
  reader_type: string;
  input_req?: GetPatientInfoReq;
}

export interface GetPatientInfoRes extends ApiResult {
  /** 最新的 patient_id */
  patient_id?: number;
  /** 存储匹配的所有 patient_id */
  patient_id_list?: number[];
}

/** 患者卡列表 */
export interface GetPatientCardListReq {
  patient_id: number;
  include_detach?: boolean;
  column_list?: string;
}

export interface CardPatientRow {
  row_id?: number;

  card_type?: string;
  card_no?: string;
  card_id?: string;
  patient_id?: number;

  attach_time?: string;
  attach_session?: string;
  attach_tag?: string;
  attach_note?: string;

  detach_time?: string;
  detach_session?: string;
  detach_tag?: string;
  detach_note?: string;
}

export interface GetPatientCardListRes extends ApiResult {
  row_list?: CardPatientRow[];
}

/** 挂失卡列表 */
export interface GetCardLostListReq {
  card_type?: string;
  card_no?: string;
  card_id?: string;
  column_list?: string;
}

export interface CardLostRow {
  lost_id?: number;
  card_type?: string;
  card_no?: string;
  card_id?: string;
  patient_id?: number;

  lost_time?: string;
  lost_tag?: string;
  lost_note?: string;

  found_time?: string;
  found_tag?: string;
  found_note?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetCardLostListRes extends ApiResult {
  row_list?: CardLostRow[];
}
