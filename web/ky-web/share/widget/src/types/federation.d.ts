/** 与 federation.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface WidgetRow {
  widget_code?: string;
  widget_type?: string;
  widget_name?: string;
  widget_tag?: string;
  widget_note?: string;
  widget_width?: number;
  widget_height?: number;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetWidgetListReq {
  widget_type?: string;
  column_list?: string;
}

export interface GetWidgetListRes extends ApiResult {
  row_list?: WidgetRow[];
}
