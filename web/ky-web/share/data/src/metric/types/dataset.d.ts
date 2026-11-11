/** 协议来源：本地 talk，098c3a7f；保持原始字段名。bytes 在 JSON 中为 base64，测试 data 由 HTTP 层转为 JSON。 */
import type { ApiResult, ProtoRow } from "./comm.d.ts";

/** dataset/comm.proto · DatasetArgRow */
export interface DatasetArgRow extends ProtoRow {
  arg_id?: number;
  dataset_id?: number;
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

/** dataset/dataset.proto · DatasetRow */
export interface DatasetRow extends ProtoRow {
  dataset_id?: number;
  org_id?: number;
  catalog_id?: number;
  dataset_code?: string;
  dataset_name?: string;
  dataset_format?: string;
  dataset_tag?: string;
  dataset_note?: string;
  count_source?: number;
  count_stmt?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · DatasetColRow */
export interface DatasetColRow extends ProtoRow {
  dataset_id?: number;
  col_code?: string;
  col_trans?: string;
  col_calc?: string;
  col_format?: string;
  col_tag?: string;
  col_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · DatasetTransRow */
export interface DatasetTransRow extends ProtoRow {
  dataset_id?: number;
  trans_script?: string;
  trans_tag?: string;
  trans_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · DatasetLocateRow */
export interface DatasetLocateRow extends ProtoRow {
  dataset_id?: number;
  default_state?: string;
  default_city?: string;
  address_detail?: string;
  address_state?: string;
  address_city?: string;
  location_field?: string;
  location_tag?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · PostRow */
export interface PostRow extends ProtoRow {
  dataset_id?: number;
  org_id?: number;
  freq_month?: string;
  freq_week?: string;
  freq_day?: string;
  freq_time?: string;
  freq_tag?: string;
  freq_note?: string;
  loop_time?: number;
  loop_range?: string;
  loop_tag?: string;
  loop_note?: string;
  post_script?: string;
  post_tag?: string;
  post_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · PostLogRow */
export interface PostLogRow extends ProtoRow {
  log_id?: number;
  org_id?: number;
  dataset_id?: number;
  dataset_name?: string;
  post_date?: string;
  fire_time?: string;
  recv_type?: string;
  recv_id?: number;
  recv_no?: string;
  recv_name?: string;
  recv_tag?: string;
  recv_note?: string;
  begin_time?: string;
  begin_no?: string;
  begin_tag?: string;
  begin_note?: string;
  end_time?: string;
  end_no?: string;
  end_tag?: string;
  end_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · PostRecvRow */
export interface PostRecvRow extends ProtoRow {
  row_id?: number;
  dataset_id?: number;
  recv_type?: string;
  recv_id?: number;
  recv_no?: string;
  recv_name?: string;
  recv_tag?: string;
  recv_note?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · PumpRow */
export interface PumpRow extends ProtoRow {
  dataset_id?: number;
  org_id?: number;
  source_id?: number;
  source_name?: string;
  table_name?: string;
  pump_before?: string;
  pump_row?: string;
  pump_after?: string;
  pump_mq?: string;
  pump_tag?: string;
  pump_note?: string;
  freq_month?: string;
  freq_week?: string;
  freq_day?: string;
  freq_time?: string;
  freq_tag?: string;
  freq_note?: string;
  loop_time?: number;
  loop_range?: string;
  loop_tag?: string;
  loop_note?: string;
  pre_id?: number;
  pre_name?: string;
  post_id?: number;
  post_name?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · PumpAdminRow */
export interface PumpAdminRow extends ProtoRow {
  dataset_id?: number;
  user_id?: number;
  user_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · PumpLogRow */
export interface PumpLogRow extends ProtoRow {
  log_id?: number;
  org_id?: number;
  dataset_id?: number;
  dataset_name?: string;
  pump_date?: string;
  fire_time?: string;
  begin_time?: string;
  begin_tag?: string;
  begin_note?: string;
  end_time?: string;
  end_tag?: string;
  end_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · PumpTaskRow */
export interface PumpTaskRow extends ProtoRow {
  org_id?: number;
  pump_mq?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · SubsetRow */
export interface SubsetRow extends ProtoRow {
  subset_id?: number;
  dataset_id?: number;
  source_id?: number;
  source_name?: string;
  subset_code?: string;
  subset_name?: string;
  subset_stmt?: string;
  subset_tag?: string;
  subset_note?: string;
  link_name?: string;
  link_param?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · SubsetTransRow */
export interface SubsetTransRow extends ProtoRow {
  subset_id?: number;
  trans_script?: string;
  trans_tag?: string;
  trans_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · GetDatasetListReq */
export interface GetDatasetListReq {
  org_id?: number;
  catalog_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetDatasetListRes */
export interface GetDatasetListRes extends ApiResult {
  row_list?: DatasetRow[];
}

/** dataset/dataset.proto · NewDatasetReq */
export interface NewDatasetReq {
  org_id?: number;
  catalog_id?: number;
  dataset_code?: string;
  dataset_name?: string;
  dataset_format?: string;
  dataset_tag?: string;
  dataset_note?: string;
  count_source?: number;
  count_stmt?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · NewDatasetRes */
export interface NewDatasetRes extends ApiResult {
  dataset_id?: number;
  subset_id?: number;
}

/** dataset/dataset.proto · DeleteDatasetReq */
export interface DeleteDatasetReq {
  dataset_id?: number;
  delete_note?: string;
}

/** dataset/dataset.proto · DeleteDatasetRes */
export interface DeleteDatasetRes extends ApiResult {}

/** dataset/dataset.proto · GetDatasetPropertyReq */
export interface GetDatasetPropertyReq {
  dataset_id?: number;
  dataset_code?: string;
  column_list?: string;
  column_pump?: string;
  column_post?: string;
}

/** dataset/dataset.proto · GetDatasetPropertyRes */
export interface GetDatasetPropertyRes extends ApiResult {
  dataset_property?: DatasetRow;
  pump_property?: PumpRow;
  post_property?: PostRow;
}

/** dataset/dataset.proto · SaveDatasetPropertyReq */
export interface SaveDatasetPropertyReq {
  dataset_id?: number;
  dataset_property?: DatasetRow;
}

/** dataset/dataset.proto · SaveDatasetPropertyRes */
export interface SaveDatasetPropertyRes extends ApiResult {}

/** dataset/dataset.proto · GetDatasetArgListReq */
export interface GetDatasetArgListReq {
  dataset_id?: number;
  replace_default?: boolean;
  column_list?: string;
}

/** dataset/dataset.proto · GetDatasetArgListRes */
export interface GetDatasetArgListRes extends ApiResult {
  row_list?: DatasetArgRow[];
}

/** dataset/dataset.proto · SaveDatasetArgListReq */
export interface SaveDatasetArgListReq {
  dataset_id?: number;
  delete_row?: number;
  row_list?: DatasetArgRow[];
}

/** dataset/dataset.proto · SaveDatasetArgListRes */
export interface SaveDatasetArgListRes extends ApiResult {}

/** dataset/dataset.proto · GetDatasetArgOptionReq */
export interface GetDatasetArgOptionReq {
  arg_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
}

/** dataset/dataset.proto · GetDatasetArgOptionRes */
export interface GetDatasetArgOptionRes extends ApiResult {
  data?: unknown;
}

/** dataset/dataset.proto · GetDatasetColListReq */
export interface GetDatasetColListReq {
  dataset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetDatasetColListRes */
export interface GetDatasetColListRes extends ApiResult {
  row_list?: DatasetColRow[];
}

/** 兼容旧 HTTP 接口：row_list 使用数组；098c3a7f proto 误声明为单行，需联调确认。 */
export interface SaveDatasetColListReq {
  dataset_id?: number;
  row_list?: DatasetColRow[];
}

/** dataset/dataset.proto · SaveDatasetColListRes */
export interface SaveDatasetColListRes extends ApiResult {}

/** dataset/dataset.proto · GetDatasetTransReq */
export interface GetDatasetTransReq {
  dataset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetDatasetTransRes */
export interface GetDatasetTransRes extends ApiResult {
  trans_property?: DatasetTransRow;
}

/** dataset/dataset.proto · SaveDatasetTransReq */
export interface SaveDatasetTransReq {
  dataset_id?: number;
  trans_property?: DatasetTransRow;
}

/** dataset/dataset.proto · SaveDatasetTransRes */
export interface SaveDatasetTransRes extends ApiResult {}

/** dataset/dataset.proto · GetDatasetLocateReq */
export interface GetDatasetLocateReq {
  dataset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetDatasetLocateRes */
export interface GetDatasetLocateRes extends ApiResult {
  locate_property?: DatasetLocateRow;
}

/** dataset/dataset.proto · SaveDatasetLocateReq */
export interface SaveDatasetLocateReq {
  dataset_id?: number;
  locate_property?: DatasetLocateRow;
}

/** dataset/dataset.proto · SaveDatasetLocateRes */
export interface SaveDatasetLocateRes extends ApiResult {}

/** dataset/dataset.proto · CountDatasetReq */
export interface CountDatasetReq {
  dataset_id?: number;
  arg_list?: ArgValueRow[];
}

/** dataset/dataset.proto · CountDatasetRes */
export interface CountDatasetRes extends ApiResult {
  row_count?: number;
}

/** dataset/dataset.proto · RetrieveDatasetReq */
export interface RetrieveDatasetReq {
  dataset_id?: number;
  dataset_code?: string;
  page_size?: number;
  page_no?: number;
  arg_list?: ArgValueRow[];
  no_trans?: boolean;
  return_format?: string;
}

/** dataset/dataset.proto · RetrieveDatasetRes */
export interface RetrieveDatasetRes extends ApiResult {
  data?: unknown;
}

/** dataset/dataset.proto · TestDatasetReq */
export interface TestDatasetReq {
  dataset_id?: number;
  dataset_code?: string;
  arg_list?: ArgValueRow[];
  no_trans?: boolean;
  return_format?: string;
}

/** dataset/dataset.proto · TestDatasetRes */
export interface TestDatasetRes extends ApiResult {
  data?: unknown;
}

/** dataset/dataset.proto · ReceiveDatasetReq */
export interface ReceiveDatasetReq {
  dataset_id?: number;
  dataset_code?: string;
  arg_list?: ArgValueRow[];
  body_data?: string;
}

/** dataset/dataset.proto · ReceiveDatasetRes */
export interface ReceiveDatasetRes extends ApiResult {}

/** dataset/dataset.proto · ExpDatasetReq */
export interface ExpDatasetReq {
  dataset_id?: number;
}

/** dataset/dataset.proto · ExpDatasetRes */
export interface ExpDatasetRes extends ApiResult {
  dataset_name?: string;
  dataset_data?: string;
}

/** dataset/dataset.proto · ImpDatasetReq */
export interface ImpDatasetReq {
  dataset_id?: number;
  dataset_data?: string;
}

/** dataset/dataset.proto · ImpDatasetRes */
export interface ImpDatasetRes extends ApiResult {}

/** dataset/dataset.proto · GetSubsetListReq */
export interface GetSubsetListReq {
  dataset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetSubsetListRes */
export interface GetSubsetListRes extends ApiResult {
  row_list?: SubsetRow[];
}

/** dataset/dataset.proto · NewSubsetReq */
export interface NewSubsetReq {
  dataset_id?: number;
  source_id?: number;
  source_name?: string;
  subset_code?: string;
  subset_name?: string;
  subset_stmt?: string;
  subset_tag?: string;
  subset_note?: string;
  link_name?: string;
  link_param?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** dataset/dataset.proto · NewSubsetRes */
export interface NewSubsetRes extends ApiResult {
  subset_id?: number;
}

/** dataset/dataset.proto · DeleteSubsetReq */
export interface DeleteSubsetReq {
  subset_id?: number;
  delete_note?: string;
}

/** dataset/dataset.proto · DeleteSubsetRes */
export interface DeleteSubsetRes extends ApiResult {}

/** dataset/dataset.proto · GetSubsetPropertyReq */
export interface GetSubsetPropertyReq {
  subset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetSubsetPropertyRes */
export interface GetSubsetPropertyRes extends ApiResult {
  subset_property?: SubsetRow;
}

/** dataset/dataset.proto · SaveSubsetPropertyReq */
export interface SaveSubsetPropertyReq {
  subset_id?: number;
  subset_property?: SubsetRow;
}

/** dataset/dataset.proto · SaveSubsetPropertyRes */
export interface SaveSubsetPropertyRes extends ApiResult {}

/** dataset/dataset.proto · GetSubsetTransReq */
export interface GetSubsetTransReq {
  subset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetSubsetTransRes */
export interface GetSubsetTransRes extends ApiResult {
  trans_property?: SubsetTransRow;
}

/** dataset/dataset.proto · SaveSubsetTransReq */
export interface SaveSubsetTransReq {
  subset_id?: number;
  trans_property?: SubsetTransRow;
}

/** dataset/dataset.proto · SaveSubsetTransRes */
export interface SaveSubsetTransRes extends ApiResult {}

/** dataset/dataset.proto · TestSubsetReq */
export interface TestSubsetReq {
  subset_id?: number;
  arg_list?: ArgValueRow[];
  source_id?: number;
  subset_stmt?: string;
  no_trans?: boolean;
  return_format?: string;
}

/** dataset/dataset.proto · TestSubsetRes */
export interface TestSubsetRes extends ApiResult {
  data?: unknown;
}

/** dataset/dataset.proto · GetPumpPropertyReq */
export interface GetPumpPropertyReq {
  dataset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetPumpPropertyRes */
export interface GetPumpPropertyRes extends ApiResult {
  pump_property?: PumpRow;
}

/** dataset/dataset.proto · SavePumpPropertyReq */
export interface SavePumpPropertyReq {
  dataset_id?: number;
  pump_property?: PumpRow;
}

/** dataset/dataset.proto · SavePumpPropertyRes */
export interface SavePumpPropertyRes extends ApiResult {}

/** dataset/dataset.proto · GetPumpAdminListReq */
export interface GetPumpAdminListReq {
  dataset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetPumpAdminListRes */
export interface GetPumpAdminListRes extends ApiResult {
  row_list?: PumpAdminRow[];
}

/** dataset/dataset.proto · SavePumpAdminListReq */
export interface SavePumpAdminListReq {
  dataset_id?: number;
  row_list?: PumpAdminRow[];
}

/** dataset/dataset.proto · SavePumpAdminListRes */
export interface SavePumpAdminListRes extends ApiResult {}

/** dataset/dataset.proto · PumpDatasetReq */
export interface PumpDatasetReq {
  dataset_id?: number;
  pump_start?: string;
  pump_end?: string;
  pump_mq?: string;
}

/** dataset/dataset.proto · PumpDatasetRes */
export interface PumpDatasetRes extends ApiResult {}

/** dataset/dataset.proto · GetPumpLogListReq */
export interface GetPumpLogListReq {
  dataset_id?: number;
  pump_start?: string;
  pump_end?: string;
  fire_start?: string;
  fire_end?: string;
  only_error?: boolean;
  miss_date?: boolean;
  row_limit?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetPumpLogListRes */
export interface GetPumpLogListRes extends ApiResult {
  row_list?: PumpLogRow[];
}

/** dataset/dataset.proto · ActivePumpTaskReq */
export interface ActivePumpTaskReq {
  org_id?: number;
  pump_mq?: string;
}

/** dataset/dataset.proto · ActivePumpTaskRes */
export interface ActivePumpTaskRes extends ApiResult {}

/** dataset/dataset.proto · GetPumpTaskListReq */
export interface GetPumpTaskListReq {
  org_id?: number;
  only_active?: boolean;
}

/** dataset/dataset.proto · GetPumpTaskListRes */
export interface GetPumpTaskListRes extends ApiResult {
  row_list?: PumpTaskRow[];
}

/** dataset/dataset.proto · GetPostPropertyReq */
export interface GetPostPropertyReq {
  dataset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetPostPropertyRes */
export interface GetPostPropertyRes extends ApiResult {
  post_property?: PostRow;
}

/** dataset/dataset.proto · SavePostPropertyReq */
export interface SavePostPropertyReq {
  dataset_id?: number;
  post_property?: PostRow;
}

/** dataset/dataset.proto · SavePostPropertyRes */
export interface SavePostPropertyRes extends ApiResult {}

/** dataset/dataset.proto · PostDatasetReq */
export interface PostDatasetReq {
  dataset_id?: number;
  post_start?: string;
  post_end?: string;
  post_mq?: string;
}

/** dataset/dataset.proto · PostDatasetRes */
export interface PostDatasetRes extends ApiResult {}

/** dataset/dataset.proto · GetPostLogListReq */
export interface GetPostLogListReq {
  dataset_id?: number;
  post_start?: string;
  post_end?: string;
  fire_start?: string;
  fire_end?: string;
  only_error?: boolean;
  miss_date?: boolean;
  row_limit?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetPostLogListRes */
export interface GetPostLogListRes extends ApiResult {
  row_list?: PostLogRow[];
}

/** dataset/dataset.proto · GetPostRecvListReq */
export interface GetPostRecvListReq {
  dataset_id?: number;
  column_list?: string;
}

/** dataset/dataset.proto · GetPostRecvListRes */
export interface GetPostRecvListRes extends ApiResult {
  row_list?: PostRecvRow[];
}

/** dataset/dataset.proto · SavePostRecvListReq */
export interface SavePostRecvListReq {
  dataset_id?: number;
  delete_row?: number;
  row_list?: PostRecvRow[];
}

/** dataset/dataset.proto · SavePostRecvListRes */
export interface SavePostRecvListRes extends ApiResult {}

/** source/comm.proto · ArgValueRow */
export interface ArgValueRow extends ProtoRow {
  arg_code: string;
  arg_type: string;
  arg_value: string;
}
