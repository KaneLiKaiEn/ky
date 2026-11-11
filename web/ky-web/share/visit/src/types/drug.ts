/** 与 drug/item/GetItemProperty 对齐的类型 */

import type { ApiResult } from "./comm";

export interface GetItemPropertyReq {
  /** 优先 */
  item_id?: number;
  /** 其次 + org_id */
  item_no?: string;
  /** 再次 + org_id */
  item_code?: string;

  column_list?: string;
  /** item_name.column，空不取 */
  column_name?: string;
}

/** 药品属性。费用明细用最新价 ÷ 计价换算系数 */
export interface ItemRow {
  item_id?: number;
  /** dec */
  price_latest?: string;
  /** dec，计价单位到计量单位系数；与 price_latest 同单位体系 */
  price_quantity?: string;
}

export interface GetItemPropertyRes extends ApiResult {
  item_property?: ItemRow;
}
