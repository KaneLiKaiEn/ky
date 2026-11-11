/**
 * https://github.com/xmhis/talk/blob/dc7ce511ecaa5df3abe6c1188fd7858666cab635/pay/pay.proto
 * 核对版本 dc7ce511（2026-10-14）；字段以该协议为依据。
 */
import type { ApiResult } from "./comm";

/** 支付方式字典，来自 pay/GetDealerList。 */
export interface DealerRow {
  pay_type?: string;
  pay_name?: string;
  dealer_name?: string;
  dealer_version?: string;
  dealer_port?: number;
  dealer_tag?: string;
  dealer_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface DealerOrgRow {
  row_id?: number;
  org_id?: number;
  org_name?: string;
  pay_type?: string;
  account_id?: number;
  account_type?: string;
  account_name?: string;
  account_no?: string;
  account_tag?: string;
  account_note?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export type OrgDealerRow = DealerOrgRow;
/** DealerOrgData 与 DealerOrgRow 字段相同；JSON 可省略 protobuf 默认值。 */
export type DealerOrgData = DealerOrgRow;

/** GetDealerList 使用 google.protobuf.Empty。 */
export type GetDealerListReq = Record<string, never>;

export interface GetDealerListRes extends ApiResult {
  row_list?: DealerRow[];
}

export interface GetOrgDealerListReq {
  org_id: number;
  column_list?: string;
}

export interface GetOrgDealerListRes extends ApiResult {
  dealer_list?: OrgDealerRow[];
}

export interface SaveOrgDealerListReq {
  org_id: number;
  /** 0 表示整体替换；空列表会清空机构配置。 */
  delete_row: number;
  dealer_list: DealerOrgData[];
}

export interface SaveOrgDealerListRes extends ApiResult {}
