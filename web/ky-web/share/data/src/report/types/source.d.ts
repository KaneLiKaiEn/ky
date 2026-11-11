/** Generated from local talk 098c3a7f; protobuf JSON uses snake_case, number IDs and base64 bytes. */

export interface ArgValueRow {
  arg_code?: string;
  arg_type?: string;
  arg_value?: string;
}

export interface GetSourceListReq {
  org_id?: number;
  column_list?: string;
}

export interface GetSourceListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: SourceRow[];
}

export interface SourceRow {
  source_id?: number;
  org_id?: number;
  source_no?: number;
  source_code?: string;
  source_name?: string;
  source_url?: string;
  source_user?: string;
  source_pwd?: string;
  source_pwd_system?: string;
  source_tag?: string;
  source_note?: string;
  driver_code?: string;
  driver_name?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
