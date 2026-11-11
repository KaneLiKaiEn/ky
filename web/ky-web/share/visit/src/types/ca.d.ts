/** 与 ca.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface GetSignImageReq {
  user_id?: number;
  visit_id?: number;
  data_format?: string;
  data_encode?: string;
  data_content?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
}

export interface GetSignImageRes extends ApiResult {
  sign_id?: number;
  /** proto 未声明，部分 CA 实现会一并返回 */
  sign_time?: string;
  image_format?: string;
  image_content?: string;
  image_width?: number;
  image_height?: number;
}

export interface ConsentItemRow {
  consent_id?: number;
  consent_code?: string;
  consent_title?: string;
  consent_desc?: string;
  consent_option?: string;
}

export interface GetConsentImageReq {
  visit_id?: number;
  data_format?: string;
  data_encode?: string;
  data_content?: string;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
  row_list?: ConsentItemRow[];
}

export interface GetConsentImageRes extends ApiResult {
  sign_id?: number;
  sign_time?: string;
  sign_tag?: string;
  sign_note?: string;
  image_format?: string;
  image_content?: string;
  image_width?: number;
  image_height?: number;
}
