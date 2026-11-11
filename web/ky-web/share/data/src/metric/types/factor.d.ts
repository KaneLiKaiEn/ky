/**
 * 协议来源：https://github.com/xmhis/talk/tree/098c3a7f828324989f14a194b538b0d159134eeb
 * 核对版本：098c3a7f828324989f14a194b538b0d159134eeb。保持 proto 原字段名；行扩展值使用 unknown。
 */

import type { ApiResult, ProtoRow } from "./comm.d.ts";

/** factor/factor.proto · UserOwnerRow and its management protocols */
export interface UserOwnerRow extends ProtoRow {
  row_id?: number;
  org_id?: number;
  owner_type?: string;
  user_no?: number;
  user_code?: string;
  user_name?: string;
  dept_no?: number;
  dept_code?: string;
  dept_name?: string;
  branch_no?: number;
  branch_code?: string;
  branch_name?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
export interface GetUserOwnerListReq {
  org_id: number;
  owner_type?: string;
  user_no?: number;
  user_code?: string;
  page_size?: number;
  page_no?: number;
  column_list?: string;
}
export interface GetUserOwnerListRes extends ApiResult {
  page_count?: number;
  row_list?: UserOwnerRow[];
}
export interface NewUserOwnerReq {
  org_id: number;
  owner_type?: string;
  user_no: number;
  user_code?: string;
  user_name?: string;
  dept_no?: number;
  dept_code?: string;
  dept_name?: string;
  branch_no?: number;
  branch_code?: string;
  branch_name?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
export interface NewUserOwnerRes extends ApiResult {
  row_id?: number;
}
export interface DeleteUserOwnerReq {
  row_id: number;
  delete_note?: string;
}
export interface DeleteUserOwnerRes extends ApiResult {}
export interface GetUserOwnerPropertyReq {
  row_id: number;
  column_list?: string;
}
export interface GetUserOwnerPropertyRes extends ApiResult {
  owner_property?: UserOwnerRow;
}
export interface SaveUserOwnerPropertyReq {
  row_id: number;
  owner_property: UserOwnerRow;
}
export interface SaveUserOwnerPropertyRes extends ApiResult {}

/** factor/factor.proto · FactorRow */
export interface FactorRow extends ProtoRow {
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

/** factor/comm.proto · UnitRow */
export interface UnitRow extends ProtoRow {
  unit_id?: number;
  org_id?: number;
  parent_id?: number;
  unit_system?: string;
  unit_type?: string;
  unit_no?: string;
  unit_code?: string;
  unit_name?: string;
  unit_level?: number;
  unit_tag?: string;
  unit_note?: string;
  child_count?: number;
  entity_count?: number;
  group_count?: number;
  admin_id?: number;
  admin_name?: string;
  admin_telno?: string;
  admin_note?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** factor/factor.proto · RetrieveFactorListReq */
export interface RetrieveFactorListReq {
  org_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  include_catalog?: boolean;
  column_list?: string;
}

/** factor/factor.proto · RetrieveFactorListRes */
export interface RetrieveFactorListRes extends ApiResult {
  row_list?: FactorRow[];
  catalog_name?: string[];
}

/** factor/factor.proto · RetrieveUnitListReq */
export interface RetrieveUnitListReq {
  unit_system?: string;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

/** factor/factor.proto · RetrieveUnitListRes */
export interface RetrieveUnitListRes extends ApiResult {
  row_list?: UnitRow[];
}

/** factor/factor.proto · 绩效单元管理 */
export interface EntityRow extends ProtoRow {
  entity_id?: number;
  org_id?: number;
  parent_id?: number;
  parent_type?: string;
  entity_type?: string;
  entity_no?: number;
  entity_code?: string;
  entity_name?: string;
  entity_tag?: string;
  entity_note?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** factor/factor.proto · 实体管理 */
export interface EntityAuthRow extends ProtoRow {
  row_id?: number;
  entity_id?: number;
  auth_type?: string;
  auth_id?: number;
  auth_name?: string;
  auth_tag?: string;
  auth_note?: string;
  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
export interface GetEntityListReq {
  entity_type: string;
  no_unit?: boolean;
  column_list?: string;
}
export interface GetEntityListRes extends ApiResult {
  row_list?: EntityRow[];
}
export interface GetEntityList2Req {
  parent_id: number;
  entity_type?: string;
  include_self?: boolean;
  include_descendant?: boolean;
  no_unit?: boolean;
  column_list?: string;
}
export interface GetEntityList2Res extends ApiResult {
  row_list?: EntityRow[];
}
export interface GetEntityPropertyReq {
  entity_id: number;
  column_list?: string;
}
export interface GetEntityPropertyRes extends ApiResult {
  entity_property?: EntityRow;
}
export interface SaveEntityPropertyReq {
  entity_id: number;
  entity_property: EntityRow;
}
export interface SaveEntityPropertyRes extends ApiResult {}
export interface GetEntityAuthListReq {
  entity_id: number;
  column_list?: string;
}
export interface GetEntityAuthListRes extends ApiResult {
  row_list?: EntityAuthRow[];
}
export interface SaveEntityAuthListReq {
  entity_id: number;
  delete_row?: number;
  row_list?: EntityAuthRow[];
}
export interface SaveEntityAuthListRes extends ApiResult {}
export interface GetEntityUnitListReq {
  entity_id: number;
  column_list?: string;
}
export interface GetEntityUnitListRes extends ApiResult {
  row_list?: UnitEntityRow[];
}
export interface SaveEntityUnitListReq {
  entity_id: number;
  row_list: UnitEntityRow[];
}
export interface SaveEntityUnitListRes extends ApiResult {}

export interface UnitEntityRow extends ProtoRow {
  unit_id?: number;
  unit_name?: string;
  entity_id?: number;
  entity_name?: string;
  entity_ratio?: string;
  entity_tag?: string;
  entity_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface UnitAuthRow extends ProtoRow {
  row_id?: number;
  unit_id?: number;
  auth_type?: string;
  auth_id?: number;
  auth_name?: string;
  auth_tag?: string;
  auth_note?: string;
  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface UnitUserRow extends ProtoRow {
  unit_id?: number;
  entity_id?: number;
  entity_name?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetUnitListReq {
  unit_system?: string;
  unit_type?: string;
  unit_level?: number;
  column_list?: string;
}
export interface GetUnitListRes extends ApiResult {
  row_list?: UnitRow[];
}
export interface GetUnitList2Req {
  parent_id: number;
  unit_type?: string;
  include_self?: boolean;
  include_descendant?: boolean;
  only_leaf?: boolean;
  column_list?: string;
}
export interface GetUnitList2Res extends ApiResult {
  row_list?: UnitRow[];
}
export interface InitUnitReq {
  unit_system: string;
}
export interface InitUnitRes extends ApiResult {}
export interface NewUnitReq {
  org_id?: number;
  parent_id?: number;
  unit_system: string;
  unit_name: string;
  unit_type?: string;
  unit_no?: string;
  unit_code?: string;
  unit_level?: number;
  unit_tag?: string;
  unit_note?: string;
  child_count?: number;
  entity_count?: number;
  admin_id?: number;
  admin_name?: string;
  admin_telno?: string;
  admin_note?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
export interface NewUnitRes extends ApiResult {
  unit_id?: number;
}
export interface DeleteUnitReq {
  unit_id: number;
  delete_note?: string;
}
export interface DeleteUnitRes extends ApiResult {}
export interface GetUnitPropertyReq {
  unit_id?: number;
  org_id?: number;
  unit_name?: string;
  match_alias?: boolean;
  match_fuzzy?: boolean;
  column_list?: string;
}
export interface GetUnitPropertyRes extends ApiResult {
  unit_property?: UnitRow;
}
export interface SaveUnitPropertyReq {
  unit_id: number;
  unit_property: UnitRow;
}
export interface SaveUnitPropertyRes extends ApiResult {}
export interface RetrieveEntityListReq {
  entity_type?: string;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}
export interface RetrieveEntityListRes extends ApiResult {
  row_list?: EntityRow[];
}
export interface GetUnitEntityListReq {
  unit_id: number;
  include_descendant?: boolean;
  column_list?: string;
}
export interface GetUnitEntityListRes extends ApiResult {
  row_list?: UnitEntityRow[];
}
export interface SaveUnitEntityListReq {
  unit_id: number;
  row_list: UnitEntityRow[];
}
export interface SaveUnitEntityListRes extends ApiResult {}
export interface SyncUnitEntityListReq {
  unit_id: number;
}
export interface SyncUnitEntityListRes extends ApiResult {}
export interface GetUnitAuthListReq {
  unit_id: number;
  column_list?: string;
}
export interface GetUnitAuthListRes extends ApiResult {
  row_list?: UnitAuthRow[];
}
export interface SaveUnitAuthListReq {
  unit_id: number;
  delete_row?: number;
  include_descendant?: boolean;
  row_list: UnitAuthRow[];
}
export interface SaveUnitAuthListRes extends ApiResult {}
export interface GetUnitUserListReq {
  unit_id: number;
  date_name?: string;
  include_descendant?: boolean;
  include_invalid?: boolean;
  column_list?: string;
}
export interface GetUnitUserListRes extends ApiResult {
  row_list?: UnitUserRow[];
}
export interface SaveUnitUserListReq {
  unit_id: number;
  row_list: UnitUserRow[];
}
export interface SaveUnitUserListRes extends ApiResult {}
export interface GetUnitBackgroundReq {
  unit_id: number;
  work_type?: string;
  theme_name?: string;
  inherit_parent?: boolean;
}
/** bytes 使用 protobuf JSON 的 base64 字符串。 */
export interface GetUnitBackgroundRes extends ApiResult {
  file_format?: string;
  file_content?: string;
}
export interface SaveUnitBackgroundReq extends Omit<
  GetUnitBackgroundReq,
  "inherit_parent"
> {
  file_format: string;
  file_content: string;
}
export interface SaveUnitBackgroundRes extends ApiResult {}

/** factor/factor.proto · FactorSourceRow */
export interface FactorSourceRow extends ProtoRow {
  row_id?: number;
  factor_id?: number;
  source_id?: number;
  source_name?: string;
  table_name?: string;
  table_name_cn?: string;
  source_tag?: string;
  source_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** factor/factor.proto · PumpRow */
export interface PumpRow extends ProtoRow {
  pump_id?: number;
  factor_id?: number;
  org_id?: number;
  dataset_id?: number;
  dataset_name?: string;
  dataset_tag?: string;
  pump_date?: string;
  pump_unit?: string;
  pump_quantity?: number;
  pump_offset?: number;
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
  create_time?: string;
  create_session?: string;
  create_note?: string;
  commit_time?: string;
  commit_session?: string;
  commit_note?: string;
  approve_time?: string;
  approve_session?: string;
  approve_note?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** factor/factor.proto · PumpAdminRow */
export interface PumpAdminRow extends ProtoRow {
  pump_id?: number;
  user_id?: number;
  user_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** factor/factor.proto · PumpLogRow */
export interface PumpLogRow extends ProtoRow {
  log_id?: number;
  org_id?: number;
  factor_id?: number;
  factor_name?: string;
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

/** factor/factor.proto · PumpTaskRow */
export interface PumpTaskRow extends ProtoRow {
  org_id?: number;
  pump_mq?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** factor/factor.proto · GetFactorListReq */
export interface GetFactorListReq {
  catalog_id: number;
  include_descendant?: boolean;
  only_pump?: boolean;
  column_list?: string;
}

/** factor/factor.proto · GetFactorListRes */
export interface GetFactorListRes extends ApiResult {
  row_list?: FactorRow[];
}

/** factor/factor.proto · NewFactorReq */
export interface NewFactorReq {
  org_id?: number;
  catalog_id: number;
  factor_no?: string;
  factor_code?: string;
  factor_name: string;
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

/** factor/factor.proto · NewFactorRes */
export interface NewFactorRes extends ApiResult {
  factor_id?: number;
}

/** factor/factor.proto · DeleteFactorReq */
export interface DeleteFactorReq {
  factor_id: number;
  delete_note?: string;
}

/** factor/factor.proto · DeleteFactorRes */
export interface DeleteFactorRes extends ApiResult {}

/** factor/factor.proto · GetFactorPropertyReq */
export interface GetFactorPropertyReq {
  factor_id: number;
  column_list?: string;
}

/** factor/factor.proto · GetFactorPropertyRes */
export interface GetFactorPropertyRes extends ApiResult {
  factor_property?: FactorRow;
}

/** factor/factor.proto · SaveFactorPropertyReq */
export interface SaveFactorPropertyReq {
  factor_id: number;
  factor_property: FactorRow;
}

/** factor/factor.proto · SaveFactorPropertyRes */
export interface SaveFactorPropertyRes extends ApiResult {}

/** factor/factor.proto · GetFactorSourceListReq */
export interface GetFactorSourceListReq {
  factor_id: number;
  column_list?: string;
}

/** factor/factor.proto · GetFactorSourceListRes */
export interface GetFactorSourceListRes extends ApiResult {
  row_list?: FactorSourceRow[];
}

/** factor/factor.proto · SaveFactorSourceListReq */
export interface SaveFactorSourceListReq {
  factor_id: number;
  row_list: FactorSourceRow[];
}

/** factor/factor.proto · SaveFactorSourceListRes */
export interface SaveFactorSourceListRes extends ApiResult {}

/** factor/factor.proto · GetPumpPropertyReq */
export interface GetPumpPropertyReq {
  factor_id: number;
  org_id?: number;
  column_list?: string;
}

/** factor/factor.proto · GetPumpPropertyRes */
export interface GetPumpPropertyRes extends ApiResult {
  row_list?: PumpRow[];
}

/** factor/factor.proto · SavePumpPropertyReq */
export interface SavePumpPropertyReq {
  factor_id: number;
  org_id?: number;
  row_list: PumpRow[];
}

/** factor/factor.proto · SavePumpPropertyRes */
export interface SavePumpPropertyRes extends ApiResult {}

/** factor/factor.proto · GetPumpAdminListReq */
export interface GetPumpAdminListReq {
  pump_id: number;
  column_list?: string;
}

/** factor/factor.proto · GetPumpAdminListRes */
export interface GetPumpAdminListRes extends ApiResult {
  row_list?: PumpAdminRow[];
}

/** factor/factor.proto · SavePumpAdminListReq */
export interface SavePumpAdminListReq {
  pump_id: number;
  row_list: PumpAdminRow[];
}

/** factor/factor.proto · SavePumpAdminListRes */
export interface SavePumpAdminListRes extends ApiResult {}

/** factor/factor.proto · PumpFactorReq */
export interface PumpFactorReq {
  factor_id: number;
  org_id?: number;
  build_valid?: boolean;
  pump_start?: string;
  pump_end?: string;
  pump_mq?: string;
  pump_routine?: number;
}

/** factor/factor.proto · PumpFactorRes */
export interface PumpFactorRes extends ApiResult {}

/** factor/factor.proto · GetPumpLogListReq */
export interface GetPumpLogListReq {
  factor_id?: number;
  pump_start?: string;
  pump_end?: string;
  fire_start?: string;
  fire_end?: string;
  only_error?: boolean;
  miss_date?: boolean;
  row_limit?: number;
  column_list?: string;
}

/** factor/factor.proto · GetPumpLogListRes */
export interface GetPumpLogListRes extends ApiResult {
  row_list?: PumpLogRow[];
}

/** factor/factor.proto · GetPumpTaskListReq */
export interface GetPumpTaskListReq {
  org_id?: number;
  only_active?: boolean;
}

/** factor/factor.proto · GetPumpTaskListRes */
export interface GetPumpTaskListRes extends ApiResult {
  row_list?: PumpTaskRow[];
}

/** factor/factor.proto · GetUnitTypeListReq (talk f20b6de5) */
export interface GetUnitTypeListReq {
  parent_id?: number;
  include_self?: boolean;
  include_descendant?: boolean;
  only_leaf?: boolean;
}

/** factor/factor.proto · GetUnitTypeListRes (talk f20b6de5) */
export interface GetUnitTypeListRes extends ApiResult {
  type_list?: string[];
}

/** factor/factor.proto · GetFactorProperty2Req (talk f20b6de5) */
export interface GetFactorProperty2Req {
  factor_id_list?: number[];
  column_list?: string;
}

/** factor/factor.proto · GetFactorProperty2Res (talk f20b6de5) */
export interface GetFactorProperty2Res extends ApiResult {
  factor_list?: FactorRow[];
}

/** factor/factor.proto · FactorValueRow (talk f20b6de5) */
export interface FactorValueRow extends ProtoRow {
  value_id?: number;
  factor_id?: number;
  org_id?: number;
  entity_type?: string;
  entity_id?: number;
  entity_no?: number;
  entity_code?: string;
  entity_name?: string;
  entity_note?: string;
  date_name?: string;
  date_year?: number;
  date_half?: number;
  date_quarter?: number;
  date_month?: number;
  date_day?: number;
  date_time?: string;
  date_start?: string;
  date_end?: string;
  item_type?: string;
  item_id?: number;
  item_code?: string;
  item_name?: string;
  item_note?: string;
  value_s?: string;
  value_n?: string;
  value_d?: string;
  value_revise?: string;
  value_result?: string;
  value_tag?: string;
  value_note?: string;
  build_id?: number;
  build_time?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** factor/factor.proto · GetFactorValueListReq (talk f20b6de5) */
export interface GetFactorValueListReq {
  factor_id?: number;
  entity_id_list?: number[];
  date_name_list?: string[];
  column_list?: string;
}

/** factor/factor.proto · GetFactorValueListRes (talk f20b6de5) */
export interface GetFactorValueListRes extends ApiResult {
  row_list?: FactorValueRow[];
}

/** factor/factor.proto · GroupRow (talk f20b6de5) */
export interface GroupRow extends ProtoRow {
  org_id?: number;
  dept_no?: number;
  dept_code?: string;
  dept_name?: string;
  group_no?: number;
  group_code?: string;
  group_name?: string;
  group_tag?: string;
  group_note?: string;
  leader_no?: number;
  leader_code?: string;
  leader_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** factor/factor.proto · GroupUserRow (talk f20b6de5) */
export interface GroupUserRow extends ProtoRow {
  org_id?: number;
  group_no?: number;
  group_code?: string;
  group_name?: string;
  user_no?: number;
  user_code?: string;
  user_name?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** factor/factor.proto · GetGroupListReq (talk f20b6de5) */
export interface GetGroupListReq {
  unit_id?: number;
  org_id?: number;
  dept_no?: number;
  dept_code?: string;
  column_list?: string;
  column_entity?: string;
}

/** factor/factor.proto · GetGroupListRes (talk f20b6de5) */
export interface GetGroupListRes extends ApiResult {
  row_list?: GroupRow[];
  entity_list?: EntityRow[];
}

/** factor/factor.proto · GetGroupUserListReq (talk f20b6de5) */
export interface GetGroupUserListReq {
  entity_id?: number;
  org_id?: number;
  group_no?: number;
  group_code?: string;
  column_list?: string;
  column_entity?: string;
}

/** factor/factor.proto · GetGroupUserListRes (talk f20b6de5) */
export interface GetGroupUserListRes extends ApiResult {
  row_list?: GroupUserRow[];
  entity_list?: EntityRow[];
}
