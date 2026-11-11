/** 与 bill 服务对齐的类型 */

import type { ApiResult } from "./comm";

/** bill/GetBillAccount：按就诊取记费 / 扣费金额 */
export interface GetBillAccountReq {
  org_id?: number;
  visit_id?: number;
  /** 缺省=诊疗，*=全部 */
  bill_type?: string;
}

export interface GetBillAccountRes extends ApiResult {
  /** decimal.2 未扣费 */
  bill_amount?: string;
  /** decimal.2 已扣费 */
  charge_amount?: string;
}

/** bill/item/RetrieveItemList */
export interface RetrieveItemListReq {
  org_id?: number;
  visit_type?: string;
  /** 缺省：诊疗 */
  bill_type?: string;
  catalog_id?: number;

  retrieve_input?: string;
  retrieve_limit?: number;

  column_list?: string;
}

/** 计费项目 */
export interface ItemRow {
  item_id?: number;
  org_id?: number;
  catalog_id?: number;
  visit_type?: string;
  bill_type?: string;

  item_no?: string;
  item_code?: string;
  item_name?: string;
  /** 实际 proto 没有这个字段，但是为了对齐取值逻辑，增加这个字段 */
  item_name_order?: string;
  item_name_en?: string;
  item_desc?: string;
  item_material?: number;
  item_level?: number;
  item_risk?: number;
  /** decimal */
  item_hr?: string;
  item_unit?: string;
  /** item_unit 是时间单位时（例如：小时，半小时，两小时），用于计算 */
  item_unit_minute?: number;
  item_tag?: string;
  item_note?: string;

  /** decimal.6 */
  price_latest?: string;
  price_valid?: string;

  /** decimal */
  quantity_base?: string;

  day_amount?: string;
  day_id?: number;
  day_name?: string;
  day_tag?: string;
  day_note?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveItemListRes extends ApiResult {
  row_list?: ItemRow[];
}
