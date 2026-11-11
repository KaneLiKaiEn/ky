/** 与 settle.proto 对齐的类型定义（结算系统 / 保险信息） */

import type { ApiResult } from "./comm";
import type { CardReadInfo } from "./card";

/** 结算系统列表 */
export interface GetDealerListReq {
  only_active?: boolean;
}

export interface DealerRow {
  dealer_code?: string;

  dealer_name?: string;
  dealer_version?: string;
  dealer_port?: number;
  dealer_tag?: string;
  dealer_note?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetDealerListRes extends ApiResult {
  row_list?: DealerRow[];
}

/** 获取结算服务 / 保险信息 */
export interface GetSettleServiceInfoReq {
  settle_type: string;
  patient_id: number;
  read_info?: CardReadInfo;
}

export interface GetSettleServiceInfoRes extends ApiResult {
  /** 0=服务端交互；>0 客户端交互，本地端口号 */
  dealer_port?: number;

  /** 服务端模式 */
  service_code?: string;
  service_name?: string;
  service_status?: string;
  service_tag?: string;
  service_note?: string;

  insurance_type?: string;
  insurance_name?: string;
  insurance_no?: string;
  insurance_code?: string;
  insurance_district?: string;
  insurance_tag?: string;
  insurance_note?: string;
}

/** 获取结算登记信息（登记号） */
export interface GetSettleHandleInfoReq {
  settle_type: string;
  patient_id: number;
}

export interface GetSettleHandleInfoRes extends ApiResult {
  handle_id?: number;
  handle_no?: string;
  handle_tag?: string;
  handle_note?: string;
}
