/** 与 file.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface WriteStringReq {
  link_app: string;
  link_name: string;
  link_value: number;
  link_data?: string;
  file_content?: string;
  revise_note?: string;
}

export interface WriteStringRes extends ApiResult {}

export interface ReadStringReq {
  link_app: string;
  link_name: string;
  link_value: number;
  link_data?: string;
  include_property?: boolean;
  revise_no?: number;
}

export interface ReadStringRes extends ApiResult {
  file_content?: string;
}
