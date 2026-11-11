/** 与 org.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface OrgLogoRow {
  org_id?: number;

  logo_light?: string;
  logo_light_name?: string;
  logo_dark?: string;
  logo_dark_name?: string;

  logo_format?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetOrgLogoReq {
  org_id?: number;
  column_list?: string;
}

export interface GetOrgLogoRes extends ApiResult {
  org_logo?: OrgLogoRow;
}
