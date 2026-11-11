import type { ApiResult } from "./comm";

export interface GetParamValueReq {    org_id?: number;
    dept_id?: number;
    user_id?: number;
    item_code?: string;
  }
  
  export interface GetParamValueRes extends ApiResult {
    item_value?: string;
    item_value_int?: number;
    item_value_dec?: string;
  }

export interface Dict2ItemRow {
  row_id?: number;
  version_no?: number;
  dict_id?: number;
  item_id?: number;
  item_no?: string;
  item_code?: string;
  item_name?: string;
  item_spec?: string;
  item_unit?: string;
  item_value?: string;
  item_value_int?: number;
  item_value_dec?: string;
  item_tag?: string;
  item_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveDict2ItemListReq {
  dict_id?: number;
  dict_no?: string;
  dict_code?: string;
  dict_name?: string;
  org_id?: number;
  owner_type?: string;
  owner_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveDict2ItemListRes extends ApiResult {
  row_list?: Dict2ItemRow[];
}
