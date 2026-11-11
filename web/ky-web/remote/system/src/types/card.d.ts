/**
 * https://github.com/xmhis/talk/blob/dc7ce511ecaa5df3abe6c1188fd7858666cab635/card/card.proto
 * 核对版本 dc7ce511（2026-10-14）；字段以该协议为依据。
 */
import type { ApiResult } from "./comm";

/** 读卡器字典，来自 card/GetReaderList。 */
export interface ReaderRow {
  reader_type?: string;
  reader_name?: string;
  reader_version?: string;
  reader_param?: string;
  reader_tag?: string;
  reader_port?: number;
  reader_note?: string;
  icon_name?: string;
  icon_system?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ReaderOrgRow {
  row_id?: number;
  org_id?: number;
  org_name?: string;
  reader_type?: string;
  reader_tag?: string;
  /** 保持后端十进制字符串格式。 */
  deposit_amount?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export type OrgReaderRow = ReaderOrgRow;
/** ReaderOrgData 与 ReaderOrgRow 字段相同；JSON 可省略 protobuf 默认值。 */
export type ReaderOrgData = ReaderOrgRow;

/** GetReaderList 使用 google.protobuf.Empty。 */
export type GetReaderListReq = Record<string, never>;

export interface GetReaderListRes extends ApiResult {
  row_list?: ReaderRow[];
}

export interface GetOrgReaderListReq {
  org_id: number;
  column_list?: string;
}

export interface GetOrgReaderListRes extends ApiResult {
  reader_list?: OrgReaderRow[];
}

export interface SaveOrgReaderListReq {
  org_id: number;
  /** 0 表示整体替换；空列表会清空机构配置。 */
  delete_row: number;
  reader_list: ReaderOrgData[];
}

export interface SaveOrgReaderListRes extends ApiResult {}
