import type { ApiResult } from "./comm";

export interface ArgValueRow {
  arg_code?: string;
  arg_type?: string;
  arg_value?: string;
}

export interface RetrieveDatasetReq {
  dataset_id?: number;
  dataset_code?: string;
  page_size?: number;
  page_no?: number;
  arg_list?: ArgValueRow[];
  no_trans?: boolean;
  return_format?: string;
}

export interface RetrieveDatasetRes extends ApiResult {
  /** 接口层已将 bytes 转为 json */
  data?: unknown;
}
