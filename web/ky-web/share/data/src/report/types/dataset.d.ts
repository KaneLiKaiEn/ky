/** Generated from local talk 098c3a7f; protobuf JSON uses snake_case, number IDs and base64 bytes. */

export interface GetDatasetArgOptionReq {
  arg_id: number;
  retrieve_input?: string;
  retrieve_limit?: number;
}
export interface GetDatasetArgOptionRes {
  code?: number;
  message?: string;
  hint?: string;
  data?: unknown;
}

export interface DatasetRow {
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

export interface GetDatasetListReq {
  org_id?: number;
  catalog_id?: number;
  column_list?: string;
}

export interface GetDatasetListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: DatasetRow[];
}

export interface GetDatasetPropertyReq {
  dataset_id?: number;
  dataset_code?: string;
  column_list?: string;
  column_pump?: string;
  column_post?: string;
}

export interface GetDatasetPropertyRes {
  code?: number;
  message?: string;
  hint?: string;
  dataset_property?: DatasetRow;
  pump_property?: PumpRow;
  post_property?: PostRow;
}

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

export interface NewDatasetRes {
  code?: number;
  message?: string;
  hint?: string;
  dataset_id?: number;
  subset_id?: number;
}

export interface PostRow {
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

export interface PumpRow {
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
