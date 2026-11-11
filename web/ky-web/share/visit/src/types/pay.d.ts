/** 与 pay.proto 对齐的支付渠道类型定义 */

import type { ApiResult } from "./comm";

export interface GetActiveDealerListReq {}

export interface DealerRow {
  pay_type?: string;
  pay_name?: string;

  dealer_name?: string;
  dealer_version?: string;
  dealer_port?: number;
  /** 如 QR_ACTIVE / QR_PASSIVE，可组合 */
  dealer_tag?: string;
  dealer_note?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetActiveDealerListRes extends ApiResult {
  row_list?: DealerRow[];
}

export interface GetPayListReq {
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
}

export interface PayRow {
  pay_id?: number;
  org_id?: number;
  patient_id?: number;

  pay_type?: string;
  pay_name?: string;
  /** decimal.2 */
  pay_amount?: string;
  pay_tag?: string;
  pay_note?: string;

  /** decimal.2 */
  refund_amount?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  start_time?: string;
  end_time?: string;

  deal_time?: string;
  deal_id?: number;
  deal_no?: string;
  deal_result?: string;
  deal_tag?: string;
  deal_note?: string;
  deal_user_id?: number;
  deal_user_name?: string;

  publish_time?: string;
  publish_id?: number;

  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPayListRes extends ApiResult {
  row_list?: PayRow[];
}

export interface GetPayDealListReq {
  pay_id?: number;
  column_list?: string;
}

export interface PayDealRow {
  deal_id?: number;
  deal_type?: string;
  pay_id?: number;

  pay_type?: string;
  pay_name?: string;
  /** decimal.2 */
  pay_amount?: string;
  pay_tag?: string;
  pay_note?: string;

  account_type?: string;
  account_id?: number;
  account_name?: string;
  account_no?: string;
  account_tag?: string;
  account_note?: string;

  start_time?: string;
  start_no?: string;
  start_tag?: string;
  start_note?: string;

  end_time?: string;
  deal_time?: string;
  deal_no?: string;
  /** SUCCESS/FAIL */
  deal_result?: string;
  deal_tag?: string;
  deal_note?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPayDealListRes extends ApiResult {
  row_list?: PayDealRow[];
}
