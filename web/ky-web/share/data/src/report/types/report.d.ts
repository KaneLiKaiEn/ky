/** Generated from local talk 098c3a7f; protobuf JSON uses snake_case, number IDs and base64 bytes. */
import type { ArgValueRow } from "./source.d.ts";
import type { CatalogRow } from "./sys.d.ts";

/** Preview messages from report/report.proto; JSON bytes may be decoded by the API gateway. */
export interface PreviewResult {
  code?: number;
  message?: string;
  hint?: string;
}
export interface GetHomeReportReq {
  user_id: number;
}
export interface GetHomeReportRes extends PreviewResult {
  report_id?: number;
  report_name?: string;
}
export interface SaveHomeReportReq {
  user_id: number;
  report_id: number;
  report_name?: string;
}
export interface SaveHomeReportRes extends PreviewResult {}
export interface GetMyCatalogListReq {
  parent_id: number;
  column_list?: string;
}
export interface GetMyCatalogListRes extends PreviewResult {
  row_list?: CatalogRow[];
}
export interface GetMyReportListReq {
  catalog_id: number;
  column_list?: string;
}
export interface GetMyReportListRes extends PreviewResult {
  row_list?: ReportRow[];
}
export interface RetrieveMyReportListReq {
  retrieve_input: string;
  retrieve_limit?: number;
  column_list?: string;
}
export interface RetrieveMyReportListRes extends PreviewResult {
  row_list?: ReportRow[];
}
export interface GetReportArgList2Req {
  report_id: number;
  column_list?: string;
}
export interface GetReportArgList2Res extends PreviewResult {
  row_list?: ReportArgRow[];
}
export interface BuildReportColumnReq {
  report_id: number;
  return_format?: string;
}
export interface BuildReportColumnRes extends PreviewResult {
  data?: unknown;
}
export interface CountReportDataReq {
  report_id: number;
  arg_list: ArgValueRow[];
}
export interface CountReportDataRes extends PreviewResult {
  row_count?: number;
}
export interface RetrieveReportDataReq extends CountReportDataReq {
  page_no?: number;
  page_size?: number;
  return_format?: string;
}
export interface RetrieveReportDataRes extends PreviewResult {
  data?: unknown;
}
export interface RetrieveReportCellReq extends CountReportDataReq {}
export interface ReportCell {
  r: number;
  c: number;
  v?: string;
  ln?: string;
  lv?: string;
  la?: string;
  lt?: string;
  lo?: string;
  ah?: string;
  av?: string;
  mh?: number;
  mv?: number;
  cb?: string;
  cf?: string;
  ff?: string;
  fs?: string;
}
export interface RetrieveReportCellRes extends PreviewResult {
  cell_list?: ReportCell[];
}
export interface CellValue {
  k: string;
  v: string;
}
export interface EditReportCellReq extends CountReportDataReq {
  row_data: CellValue[];
  edit_key: string;
  edit_value: string;
}
export interface EditReportCellRes extends PreviewResult {}
export interface PrintReportReq {
  report_id: number;
  arg_list: ReportArgRow[];
  data_format: string;
  data_content: string;
}
export interface PrintReportRes extends PreviewResult {
  file_format?: string;
  file_content?: string;
}

export interface DeleteReportReq {
  report_id?: number;
  delete_note?: string;
}

export interface DeleteReportRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface GetReportArgListReq {
  report_id?: number;
  column_list?: string;
}

export interface GetReportArgListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportArgRow[];
}

export interface GetReportAuthListReq {
  report_id?: number;
  column_list?: string;
}

export interface GetReportAuthListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportAuthRow[];
}

export interface GetReportCmdListReq {
  report_id?: number;
  column_list?: string;
}

export interface GetReportCmdListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportCmdRow[];
}

export interface GetReportColListReq {
  report_id?: number;
  column_list?: string;
}

export interface GetReportColListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportColRow[];
}

export interface GetReportContentReq {
  report_id?: number;
  arg_list?: ArgValueRow[];
}

export interface GetReportContentRes {
  code?: number;
  message?: string;
  hint?: string;
  report_format?: string;
  report_content?: string;
}

export interface GetReportListReq {
  catalog_id?: number;
  include_descendant?: boolean;
  column_list?: string;
}

export interface GetReportListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportRow[];
}

export interface GetReportPropertyReq {
  report_id?: number;
  column_list?: string;
}

export interface GetReportPropertyRes {
  code?: number;
  message?: string;
  hint?: string;
  report_property?: ReportRow;
}

export interface GetReportRowListReq {
  report_id?: number;
  column_list?: string;
}

export interface GetReportRowListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportRowRow[];
}

export interface GetReportStyleReq {
  report_id?: number;
}

export interface GetReportStyleRes {
  code?: number;
  message?: string;
  hint?: string;
  style_content?: string;
  style_name?: string;
  style_format?: string;
}

export interface GetReportValListReq {
  report_id?: number;
  column_list?: string;
}

export interface GetReportValListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportValRow[];
}

export interface GetReportVarListReq {
  report_id?: number;
  column_list?: string;
}

export interface GetReportVarListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportVarRow[];
}

export interface NewReportReq {
  org_id?: number;
  catalog_id?: number;
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;
  report_type?: string;
  report_no?: string;
  report_code?: string;
  report_name?: string;
  report_title?: string;
  report_tag?: string;
  report_note?: string;
  dataset_id?: number;
  data_start?: number;
  column_freeze?: number;
  style_name?: string;
  style_format?: string;
  icon_name?: string;
  icon_system?: string;
  board_id?: number;
  board_name?: string;
  board_width?: number;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewReportRes {
  code?: number;
  message?: string;
  hint?: string;
  report_id?: number;
}

export interface NewReportStyleReq {
  report_id?: number;
}

export interface NewReportStyleRes {
  code?: number;
  message?: string;
  hint?: string;
  style_content?: string;
  style_name?: string;
  style_format?: string;
}

export interface ParseReportColListReq {
  report_id?: number;
}

export interface ParseReportColListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportColRow[];
}

export interface RemoveReportStyleReq {
  report_id?: number;
}

export interface RemoveReportStyleRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface ReportArgRow {
  arg_id?: number;
  report_id?: number;
  arg_code?: string;
  arg_name?: string;
  arg_type?: string;
  arg_value?: string;
  arg_text?: string;
  arg_desc?: string;
  arg_tag?: string;
  arg_note?: string;
  value_min?: string;
  value_max?: string;
  source_type?: string;
  source_id?: number;
  source_value?: string;
  source_tag?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ReportAuthRow {
  row_id?: number;
  report_id?: number;
  auth_type?: string;
  auth_id?: number;
  auth_name?: string;
  sort_no?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ReportCmdRow {
  cmd_id?: number;
  report_id?: number;
  cmd_code?: string;
  cmd_name?: string;
  cmd_text?: string;
  cmd_script?: string;
  cmd_tag?: string;
  cmd_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ReportColRow {
  col_id?: number;
  report_id?: number;
  col_code?: string;
  col_name?: string;
  col_type?: string;
  col_align?: string;
  col_format?: string;
  col_width?: string;
  col_calc?: string;
  col_tag?: string;
  col_note?: string;
  link_name?: string;
  link_value?: string;
  link_arg?: string;
  link_tag?: string;
  link_note?: string;
  edit_source?: number;
  edit_stmt?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ReportRow {
  report_id?: number;
  org_id?: number;
  catalog_id?: number;
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;
  report_type?: string;
  report_no?: string;
  report_code?: string;
  report_name?: string;
  report_title?: string;
  report_tag?: string;
  report_note?: string;
  dataset_id?: number;
  data_start?: number;
  column_freeze?: number;
  style_name?: string;
  style_format?: string;
  icon_name?: string;
  icon_system?: string;
  board_id?: number;
  board_name?: string;
  board_width?: number;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ReportRowRow {
  row_id?: number;
  report_id?: number;
  row_code?: string;
  row_name?: string;
  row_type?: string;
  row_tag?: string;
  row_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ReportValRow {
  val_id?: number;
  report_id?: number;
  val_code?: string;
  val_name?: string;
  val_type?: string;
  val_calc?: string;
  val_tag?: string;
  val_note?: string;
  link_name?: string;
  link_value?: string;
  link_arg?: string;
  link_tag?: string;
  link_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ReportVarRow {
  var_id?: number;
  report_id?: number;
  var_code?: string;
  var_name?: string;
  var_type?: string;
  var_value?: string;
  var_tag?: string;
  var_note?: string;
  data_type?: string;
  data_id?: number;
  data_name?: string;
  data_tag?: string;
  data_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveReportListReq {
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveReportListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: ReportRow[];
}

export interface SaveReportArgListReq {
  report_id?: number;
  delete_row?: number;
  row_list?: ReportArgRow[];
}

export interface SaveReportArgListRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface SaveReportAuthListReq {
  report_id?: number;
  delete_row?: number;
  row_list?: ReportAuthRow[];
}

export interface SaveReportAuthListRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface SaveReportCmdListReq {
  report_id?: number;
  delete_row?: number;
  row_list?: ReportCmdRow[];
}

export interface SaveReportCmdListRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface SaveReportColListReq {
  report_id?: number;
  delete_row?: number;
  row_list?: ReportColRow[];
}

export interface SaveReportColListRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface SaveReportContentReq {
  report_id?: number;
  arg_list?: ArgValueRow[];
  report_format?: string;
  report_content?: string;
}

export interface SaveReportContentRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface SaveReportPropertyReq {
  report_id?: number;
  report_property?: ReportRow;
}

export interface SaveReportPropertyRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface SaveReportRowListReq {
  report_id?: number;
  delete_row?: number;
  row_list?: ReportRowRow[];
}

export interface SaveReportRowListRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface SaveReportStyleReq {
  report_id?: number;
  style_content?: string;
  style_name?: string;
  style_format?: string;
}

export interface SaveReportStyleRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface SaveReportValListReq {
  report_id?: number;
  delete_row?: number;
  row_list?: ReportValRow[];
}

export interface SaveReportValListRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface SaveReportVarListReq {
  report_id?: number;
  delete_row?: number;
  row_list?: ReportVarRow[];
}

export interface SaveReportVarListRes {
  code?: number;
  message?: string;
  hint?: string;
}
