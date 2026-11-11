/** 与 material 服务对齐的类型（材料项目检索） */

import type { ApiResult } from "./comm";

/** material/item/RetrieveItemList */
export interface RetrieveItemListReq {
  org_id?: number;
  name_type?: string;
  name_tag?: string;
  catalog_id?: number;
  bill_type?: string;

  include_invalid?: boolean;

  retrieve_input?: string;
  retrieve_limit?: number;

  column_list?: string;
}

/** 材料项目 */
export interface ItemRow {
  item_id?: number;
  org_id?: number;
  name_id?: number;
  bill_type?: string;

  item_no?: string;
  item_code?: string;
  item_name?: string;
  item_name_order?: string;
  item_spec?: string;
  item_model?: string;
  item_unit?: string;
  item_tag?: string;
  item_note?: string;

  /** decimal */
  price_latest?: string;
  /** start-end */
  price_valid?: string;

  /** decimal */
  quantity_base?: string;

  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveItemListRes extends ApiResult {
  row_list?: ItemRow[];
}
