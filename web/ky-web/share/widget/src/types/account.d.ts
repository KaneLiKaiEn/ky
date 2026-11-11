import type { ApiResult } from "./comm";

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

export interface VisitAccountRow {
  visit_id?: number;
  /** decimal.2 预交金余额 */
  prepay_amount?: string;
  credit_amount?: string;
  guarantee_amount?: string;
}

/** account/GetAccountList：按就诊批量取账户余额 */
export interface GetAccountListReq {
  visit_id_list?: number[];
  include_prepay?: boolean;
  include_credit?: boolean;
  include_guarantee?: boolean;
}

export interface GetAccountListRes extends ApiResult {
  row_list?: VisitAccountRow[];
}
