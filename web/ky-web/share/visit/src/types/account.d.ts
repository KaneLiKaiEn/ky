/** 与 account.proto 对齐的预交金类型定义 */

import type { ApiResult } from "./comm";

/** O-门诊，I-住院，S-膳食，*-统一 */
export type PrepayType = "O" | "I" | "S" | "*";

export interface NewPrepayReq {
  org_id?: number;
  patient_id?: number;

  /** O-门诊，I-住院，S-膳食，*-统一 */
  prepay_type?: string;
  prepay_time?: string;
  /** decimal.2 */
  prepay_amount?: string;
  prepay_tag?: string;
  prepay_note?: string;

  /** 有值时自动登记 payid */
  pay_type?: string;
  pay_name?: string;
  pay_user_id?: number;
  pay_user_name?: string;
  pay_tag?: string;
  pay_note?: string;

  /** decimal.2 */
  refund_amount?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  stat_id?: number;

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

export interface NewPrepayRes extends ApiResult {
  prepay_id?: number;
  pay_id?: number;
}

export interface StartPrepayPayReq {
  prepay_id?: number;

  /** 可选：支持新建 pay 或变更 paytype */
  pay_type?: string;
  pay_name?: string;
  pay_tag?: string;
  pay_note?: string;

  /**
   * QR_ACTIVE-主动扫码（患者提供付款码）；
   * QR_PASSIVE-被动扫码（生成二维码供患者扫）；
   * WX_APPLET-微信小程序；
   * 空-无需扫码（例如：现金）
   */
  deal_type?: string;
  /** deal_type=QR_ACTIVE 时，患者付款码 */
  deal_code?: string;
}

export interface StartPrepayPayRes extends ApiResult {
  pay_id?: number;
  deal_id?: number;

  /** deal_type=QR_PASSIVE: 生成的二维码 */
  image_format?: string;
  image_content?: string;
  image_width?: number;
  image_height?: number;

  ext_data?: string;
  ext_data2?: string;
  ext_data3?: string;
  ext_data4?: string;
  ext_data5?: string;
  ext_data6?: string;
  ext_data7?: string;
  ext_data8?: string;
  ext_data9?: string;
}

export interface GetPrepayListReq {
  org_id?: number;
  patient_id?: number;
  /** O-门诊，I-住院，S-膳食，*-统一 */
  prepay_type?: string;

  prepay_start?: string;
  prepay_end?: string;
  pay_type?: string;

  include_invalid?: boolean;

  column_list?: string;
}

export interface PrepayRow {
  prepay_id?: number;
  org_id?: number;
  patient_id?: number;

  prepay_type?: string;
  prepay_time?: string;
  /** decimal.2 */
  prepay_amount?: string;
  prepay_tag?: string;
  prepay_note?: string;

  pay_time?: string;
  pay_id?: number;
  pay_type?: string;
  pay_name?: string;
  pay_user_id?: number;
  pay_user_name?: string;
  pay_tag?: string;
  pay_note?: string;

  /** decimal.2 */
  refund_amount?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  stat_id?: number;
  stat_time?: string;

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

export interface GetPrepayListRes extends ApiResult {
  row_list?: PrepayRow[];
}

export interface GetPrepayPropertyReq {
  prepay_id?: number;
  column_list?: string;
}

export interface GetPrepayPropertyRes extends ApiResult {
  prepay_property?: PrepayRow;
}

export interface GetPrepayAccountReq {
  org_id?: number;
  patient_id?: number;
  /** O-门诊，I-住院，S-膳食，*-统一 */
  prepay_type?: string;
}

export interface GetPrepayAccountRes extends ApiResult {
  /** decimal.2 */
  prepay_amount?: string;
  prepay_tag?: string;
  prepay_note?: string;
}

export interface RefundPrepayReq {
  prepay_id?: number;
  /** decimal.2 */
  refund_amount?: string;
  refund_tag?: string;
  refund_note?: string;
  auto_pay?: boolean;
}

export interface RefundPrepayRes extends ApiResult {
  refund_prepay_id?: number;
  refund_pay_id?: number;
}

export interface DeletePrepayReq {
  prepay_id?: number;
  delete_note?: string;
}

export interface DeletePrepayRes extends ApiResult {}

export interface RefundPrepay2Req {
  patient_id?: number;
  /** O-门诊，I-住院，S-膳食，*-统一 */
  prepay_type?: string;
  /** decimal.2 */
  refund_amount?: string;
  refund_tag?: string;
  refund_note?: string;
  auto_pay?: boolean;
}

export interface RefundPrepay2Res extends ApiResult {
  refund_prepay_id?: number[];
}

export interface GetGuaranteeListReq {
  visit_id?: number;
  include_invalid?: boolean;
  column_list?: string;
}

export interface GuaranteeRow {
  guarantee_id?: number;
  org_id?: number;
  visit_id?: number;

  user_id?: number;
  user_name?: string;

  guarantee_time?: string;
  /** decimal.2 */
  guarantee_amount?: string;
  guarantee_tag?: string;
  guarantee_note?: string;

  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetGuaranteeListRes extends ApiResult {
  row_list?: GuaranteeRow[];
}

export interface NewGuaranteeReq {
  visit_id?: number;

  user_id?: number;
  user_name?: string;

  guarantee_time?: string;
  /** decimal.2 */
  guarantee_amount?: string;
  guarantee_tag?: string;
  guarantee_note?: string;

  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewGuaranteeRes extends ApiResult {
  guarantee_id?: number;
}

export interface DeleteGuaranteeReq {
  guarantee_id?: number;
  delete_note?: string;
}

export interface DeleteGuaranteeRes extends ApiResult {}

/** account/GetAccount：按就诊取账户余额 */
export interface GetAccountReq {
  visit_id?: number;
  include_prepay?: boolean;
  include_credit?: boolean;
  include_guarantee?: boolean;
}

export interface GetAccountRes extends ApiResult {
  /** decimal.2 预交金余额 */
  prepay_amount?: string;
  credit_amount?: string;
  guarantee_amount?: string;
}
export interface GetCreditReq {
  visit_id?: number;
}
export interface GetCreditRes extends ApiResult {
  /** decimal.2 */
  credit_amount?: string;
  credit_tag?: string;
  credit_note?: string;
}
export interface SaveCreditReq {
  visit_id?: number;
  credit_amount?: string;
  credit_tag?: string;
  credit_note?: string;
}