import type { ApiResult, ProtoRow } from "./comm.d.ts";
export interface SourceRow extends ProtoRow {
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
export interface GetSourceListReq {
  org_id: number;
  column_list?: string;
}
export interface GetSourceListRes extends ApiResult {
  row_list?: SourceRow[];
}

// talk 098c3a7f: management and preview protocols.
export interface DriverRow extends ProtoRow {
  driver_code?: string;
  driver_name?: string;
  driver_tag?: string;
  driver_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewSourceReq {
  org_id: number;
  source_no?: number;
  source_code?: string;
  source_name: string;
  source_url?: string;
  source_user?: string;
  source_pwd?: string;
  source_pwd_system?: string;
  source_tag?: string;
  source_note?: string;
  driver_code: string;
  driver_name?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewSourceRes extends ApiResult {
  source_id?: number;
}

export interface DeleteSourceReq {
  source_id: number;
  delete_note?: string;
}

export interface DeleteSourceRes extends ApiResult {}

export interface GetSourcePropertyReq {
  source_id: number;
  source_no?: number;
  source_code?: string;
  column_list?: string;
}

export interface GetSourcePropertyRes extends ApiResult {
  source_property?: SourceRow;
}

export interface SaveSourcePropertyReq {
  source_id: number;
  source_property: SourceRow;
}

export interface SaveSourcePropertyRes extends ApiResult {}

export interface GetDriverListReq {
  column_list?: string;
}

export interface GetDriverListRes extends ApiResult {
  row_list?: DriverRow[];
}

export interface TestReq {
  driver_code?: string;
  source_id?: number;
  source_url?: string;
  source_user?: string;
  source_pwd?: string;
}

export interface TestRes extends ApiResult {}
