/** 麻醉计费（LinkBill）相关类型定义 */
import type { ApiResult } from "./comm";

/** 计费项目类型 */
export type BillItemType = "DRUG" | "CHARGE" | "MATERIAL";

/** 计费状态 */
export type BillStatus = "CHARGE" | "APPROVE";

/* ------------------------------ 会话 / 科室 ------------------------------ */

export interface SessionInfo {
  session_id?: string;
  user_id?: number;
  user_name?: string;
  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  [key: string]: unknown;
}

export interface GetSessionInfoRes extends ApiResult {
  session_info?: SessionInfo;
}

export interface DeptRow {
  dept_id?: number | string;
  dept_name?: string;
  dept_flag_id?: string;
  dept_flag?: string;
  [key: string]: unknown;
}

/* ------------------------------ 计费列表 ------------------------------ */

export interface GetBillListReq {
  visit_id?: number;
  link_name?: string;
  link_value?: number;
  column_list?: string;
  column_item?: string;
  column_apply?: string;
  column_exec?: string;
}

export interface GetBillListRes extends ApiResult {
  row_list?: any[];
  item_list?: any[];
  apply_list?: any[];
  exec_list?: any[];
}

/* ------------------------------ 计费操作 ------------------------------ */

export interface ApplyProperty {
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;
}

export interface ExecProperty {
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;
}

export interface SaveBillPropertyReq {
  bill_id?: number;
  bill_time?: string;
  bill_tag?: string;
  item_quantity?: string;
  usage_id?: number;
  usage_name?: string;
  usage_note?: string;
  usage_quantity?: string;
  batch_no?: string;
  link_data?: string;
  apply_property?: ApplyProperty;
  exec_property?: ExecProperty;
}

export interface NewBillRow {
  item_id?: number;
  item_type?: string;
  item_price?: string | number;
  item_quantity?: string | number;
  usage_id?: number | null;
  usage_name?: string | null;
  usage_note?: string;
  usage_quantity?: string | null;
  usage_unit?: string | null;
  store_id?: number;
  store_name?: string | null;
  bill_tag?: string;
  bill_time?: string;
  link_data?: string;
  link_tag?: string;
  item_quantity_unit?: string;
  batch_no?: string;
}

export interface NewBillReq {
  visit_id?: number;
  link_name?: string;
  link_value?: number;
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;
  exec_info?: ExecProperty;
  row_list?: NewBillRow[];
}

export interface ChargeBillReq {
  bill_id?: number[];
  ext_list?: {
    item_code: string;
    item_name: string;
    item_value: string;
    item_value_int?: number;
  }[];
}

export interface DeleteBillReq {
  bill_id?: number;
}

export interface RefundBillReq {
  bill_id?: number;
  refund_quantity?: string;
}

/* ------------------------------ 处方申请 ------------------------------ */

export interface GetBillApplyReq {
  bill_id?: number;
}

export interface ApplyRow {
  apply_id?: number;
  apply_status?: string;
  [key: string]: unknown;
}

export interface GetBillApplyRes extends ApiResult {
  apply_list?: ApplyRow[];
}

export interface GetApplyDetailDispenseListReq {
  bill_id?: number;
}

export interface ApplyDetailDispenseRow {
  dispense_id?: number;
  detail_id?: number;
  apply_id?: number;
  item_id?: number;
  batch_no?: string;
  trace_no?: string;
  dispense_quantity?: string;
  dispense_tag?: string;
  dispense_note?: string;
  withdraw_quantity?: string;
  [key: string]: unknown;
}

export interface GetApplyDetailDispenseListRes extends ApiResult {
  row_list?: ApplyDetailDispenseRow[];
}

export interface ApplyWithdrawDetailRowReq {
  dispense_id?: number;
  detail_id?: number;
  visit_id?: number;
  patient_id?: number;
  baby_id?: number;
  withdraw_quantity?: string;
}

export interface NewApplyWithdrawReq {
  apply_id?: number;
  org_id?: number;
  withdraw_time?: string;
  withdraw_note?: string;
  user_id?: number;
  user_name?: string;
  dept_id?: number;
  dept_name?: string;
  store_id?: number;
  store_name?: string;
  row_list?: ApplyWithdrawDetailRowReq[];
}

/* ------------------------------ 麻醉用药 / PCA ------------------------------ */

export interface GetAnesDrugListRes extends ApiResult {
  row_list?: any[];
}

export interface GetPcaListRes extends ApiResult {
  row_list?: any[];
}

export interface GetPcaDrugListRes extends ApiResult {
  row_list?: any[];
}

/* ------------------------------ 检索 ------------------------------ */

export interface RetrieveItemListRes extends ApiResult {
  row_list?: any[];
}

export interface RetrieveUsageListRes extends ApiResult {
  row_list?: any[];
}

export interface RetrieveUserListRes extends ApiResult {
  user_list?: any[];
}

/* ------------------------------ 库存单元（药房） ------------------------------ */

export interface StoreRow {
  store_id?: number;
  store_name?: string;
}

export interface GetStockListRes extends ApiResult {
  row_list?: StoreRow[];
}

export interface GetCatalogListRes extends ApiResult {
  catalog_list?: any[];
}

export interface GetCatalogPropertyRes extends ApiResult {
  catalog_property?: Record<string, unknown>;
}

/* ------------------------------ 模板 ------------------------------ */

export interface GetPrefabListRes extends ApiResult {
  row_list?: any[];
}

export interface GetPrefabDetailRes extends ApiResult {
  row_list?: any[];
}

/* ------------------------------ 打印 / 文档 ------------------------------ */

export interface GetDocTagListReq {
  doc_type?: string;
  doc_name?: string;
}

export interface DocTagRow {
  tag_id?: number;
  name_id?: number;
  doc_tag?: string;
  doc_code?: string;
  [key: string]: unknown;
}

export interface GetDocTagListRes extends ApiResult {
  row_list?: DocTagRow[];
}
