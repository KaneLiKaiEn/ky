/** Generated from local talk 098c3a7f; protobuf JSON uses snake_case, number IDs and base64 bytes. */

export interface UnitRow {
  unit_id?: number;
  parent_id?: number;
  unit_name?: string;
  unit_code?: string;
  child_count?: number;
  unit_level?: number;
  unit_system?: string;
  unit_type?: string;
}
export interface GetUnitListReq {
  unit_system?: string;
  unit_type?: string;
  unit_level?: number;
  column_list?: string;
}
export interface GetUnitList2Req {
  parent_id: number;
  unit_type?: string;
  include_self?: boolean;
  include_descendant?: boolean;
  only_leaf?: boolean;
  column_list?: string;
}
export interface GetUnitListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: UnitRow[];
}
export interface GetUnitList2Res extends GetUnitListRes {}

export interface FactorRow {
  factor_id?: number;
  org_id?: number;
  catalog_id?: number;
  factor_no?: string;
  factor_code?: string;
  factor_name?: string;
  factor_version?: number;
  factor_freq?: string;
  factor_desc?: string;
  factor_tag?: string;
  factor_note?: string;
  value_type?: string;
  value_unit?: string;
  detail_type?: string;
  detail_id?: number;
  detail_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveFactorListReq {
  org_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  include_catalog?: boolean;
  column_list?: string;
}

export interface RetrieveFactorListRes {
  code?: number;
  message?: string;
  hint?: string;
  row_list?: FactorRow[];
  catalog_name?: string[];
}

export interface RetrieveUnitListReq {
  unit_system?: string;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}
export interface RetrieveUnitListRes extends GetUnitListRes {}
export interface GetUnitPropertyReq {
  unit_id?: number;
  org_id?: number;
  unit_name?: string;
  match_alias?: boolean;
  match_fuzzy?: boolean;
  column_list?: string;
}
export interface GetUnitPropertyRes {
  code?: number;
  message?: string;
  hint?: string;
  unit_property?: UnitRow;
}
