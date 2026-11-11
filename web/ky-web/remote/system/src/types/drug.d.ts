/** 与 drug.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface ItemRow {
  item_id?: number;
  item_no?: string;
  item_code?: string;
  item_name?: string;
  dosage_unit?: string;
  quantity_unit?: string;
  item_tag?: string;
  item_note?: string;
  sort_no?: string;
}

export interface RetrieveItemListReq {
  org_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveItemListRes extends ApiResult {
  row_list?: ItemRow[];
}
