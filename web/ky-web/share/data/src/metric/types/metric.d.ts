/**
 * 协议来源：https://github.com/xmhis/talk/tree/098c3a7f828324989f14a194b538b0d159134eeb
 * 核对版本：098c3a7f828324989f14a194b538b0d159134eeb。保持 proto 原字段名；行扩展值使用 unknown。
 */

import type { ApiResult, ProtoRow } from "./comm.d.ts";

/** metric/metric.proto · object-scoped metric authorizations */
export interface GetAuthMetricListReq {
  entity_type: string;
  entity_id: number;
  column_list?: string;
}
export interface GetAuthMetricListRes extends ApiResult {
  row_list?: MetricAuthRow[];
}
export interface SaveAuthMetricListReq {
  entity_type: string;
  entity_id: number;
  entity_name: string;
  row_list: MetricAuthRow[];
}
export interface SaveAuthMetricListRes extends ApiResult {}
export interface UserDefaultRow extends ProtoRow {
  user_id?: number;
  unit_id?: number;
  unit_name?: string;
  date_type?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
export interface RoleDefaultRow extends ProtoRow {
  role_id?: number;
  unit_id?: number;
  unit_name?: string;
  date_type?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
export interface GetUserDefaultReq {
  user_id: number;
  column_list?: string;
}
export interface GetUserDefaultRes extends ApiResult {
  default_property?: UserDefaultRow;
}
export interface SaveUserDefaultReq {
  user_id: number;
  default_property: UserDefaultRow;
}
export interface SaveUserDefaultRes extends ApiResult {}
export interface GetRoleDefaultReq {
  role_id: number;
  column_list?: string;
}
export interface GetRoleDefaultRes extends ApiResult {
  default_property?: RoleDefaultRow;
}
export interface SaveRoleDefaultReq {
  role_id: number;
  default_property: RoleDefaultRow;
}
export interface SaveRoleDefaultRes extends ApiResult {}

/** metric/comm.proto · LibRow */
export interface LibRow extends ProtoRow {
  lib_id?: number;
  org_id?: number;
  lib_no?: string;
  lib_code?: string;
  lib_name?: string;
  lib_date?: string;
  lib_tag?: string;
  lib_note?: string;
  metric_count?: number;
  icon_system?: string;
  icon_name?: string;
  board_id?: number;
  board_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/metric.proto · MetricAdminRow */
export interface MetricAdminRow extends ProtoRow {
  row_id?: number;
  metric_id?: number;
  admin_type?: string;
  admin_id?: number;
  admin_name?: string;
  admin_tag?: string;
  admin_note?: string;
  sort_no?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/comm.proto · MetricAliasRow */
export interface MetricAliasRow extends ProtoRow {
  alias_id?: number;
  org_id?: number;
  metric_id?: number;
  alias_name?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/metric.proto · MetricAuthRow */
export interface MetricAuthRow extends ProtoRow {
  row_id?: number;
  metric_id?: number;
  metric_name?: string;
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

/** metric/metric.proto · MetricCalcRow */
export interface MetricCalcRow extends ProtoRow {
  calc_id?: number;
  metric_id?: number;
  calc_formula?: string;
  calc_desc?: string;
  calc_tag?: string;
  calc_note?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/comm.proto · MetricChildRow */
export interface MetricChildRow extends ProtoRow {
  metric_id?: number;
  child_id?: number;
  child_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
  child_count?: number;
  child_title?: string;
}

/** metric/metric.proto · MetricFavoriteRow */
export interface MetricFavoriteRow extends ProtoRow {
  favorite_id?: number;
  user_id?: number;
  user_name?: string;
  lib_id?: number;
  metric_id?: number;
  metric_name?: string;
  favorite_color?: string;
  favorite_tag?: string;
  favorite_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
  child_count?: number;
  metric_title?: string;
}

/** metric/metric.proto · MetricGoalRow */
export interface MetricGoalRow extends ProtoRow {
  goal_id?: number;
  org_id?: number;
  metric_id?: number;
  unit_id?: number;
  unit_name?: string;
  work_type?: string;
  goal_period?: string;
  goal_type?: string;
  goal_min?: string;
  goal_max?: string;
  goal_unit?: string;
  goal_desc?: string;
  goal_tag?: string;
  goal_note?: string;
  check_score?: string;
  check_tag?: string;
  check_note?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/comm.proto · MetricLinkRow */
export interface MetricLinkRow extends ProtoRow {
  metric_id?: number;
  link_id?: number;
  link_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/metric.proto · MetricOrgRow */
export interface MetricOrgRow extends ProtoRow {
  row_id?: number;
  metric_id?: number;
  org_id?: number;
  org_name?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/comm.proto · MetricRow */
export interface MetricRow extends ProtoRow {
  detail_type?: string;
  detail_id?: number;
  detail_name?: string;
  cause_type?: string;
  metric_id?: number;
  org_id?: number;
  lib_id?: number;
  catalog_id?: number;
  metric_type?: string;
  metric_no?: string;
  metric_code?: string;
  metric_name?: string;
  metric_title?: string;
  metric_desc?: string;
  metric_orientation?: string;
  metric_tag?: string;
  metric_note?: string;
  child_count?: number;
  value_digit?: number;
  value_ratio?: string;
  value_unit?: string;
  value_tag?: string;
  admin_type?: string;
  admin_id?: number;
  admin_name?: string;
  admin_user?: string;
  admin_freq?: string;
  icon_system?: string;
  icon_name?: string;
  component_id?: number;
  component_name?: string;
  component_color?: string;
  board_id?: number;
  board_name?: string;
  cause_id?: number;
  cause_name?: string;
  unit_id?: number;
  unit_name?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  commit_time?: string;
  commit_session?: string;
  commit_note?: string;
  source_time?: string;
  source_session?: string;
  source_note?: string;
  approve_time?: string;
  approve_session?: string;
  approve_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/comm.proto · MetricRowExt */
export interface MetricRowExt extends ProtoRow {
  detail_type?: string;
  detail_id?: number;
  detail_name?: string;
  cause_type?: string;
  metric_id?: number;
  org_id?: number;
  lib_id?: number;
  catalog_id?: number;
  metric_type?: string;
  metric_no?: string;
  metric_code?: string;
  metric_name?: string;
  metric_title?: string;
  metric_desc?: string;
  metric_orientation?: string;
  metric_tag?: string;
  metric_note?: string;
  child_count?: number;
  value_digit?: number;
  value_ratio?: string;
  value_unit?: string;
  value_tag?: string;
  admin_type?: string;
  admin_id?: number;
  admin_name?: string;
  admin_user?: string;
  admin_freq?: string;
  icon_system?: string;
  icon_name?: string;
  component_id?: number;
  component_name?: string;
  component_color?: string;
  board_id?: number;
  board_name?: string;
  cause_id?: number;
  cause_name?: string;
  unit_id?: number;
  unit_name?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  commit_time?: string;
  commit_session?: string;
  commit_note?: string;
  source_time?: string;
  source_session?: string;
  source_note?: string;
  approve_time?: string;
  approve_session?: string;
  approve_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
  alias_list?: MetricAliasRow[];
}

/** metric/metric.proto · MetricShortcutRow */
export interface MetricShortcutRow extends ProtoRow {
  metric_id?: number;
  catalog_id?: number;
  catalog_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/metric.proto · MetricVarRow */
export interface MetricVarRow extends ProtoRow {
  var_id?: number;
  /** 所属指标 ID。引用指标通过 data_id 指定，不覆盖此字段。 */
  metric_id?: number;
  var_code?: string;
  var_name?: string;
  var_value?: string;
  var_desc?: string;
  var_tag?: string;
  var_note?: string;
  data_type?: string;
  data_id?: number;
  data_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/metric.proto · CopyUserFavoriteListReq */
export interface CopyUserFavoriteListReq {
  user_id: number;
  clear_exist: boolean;
  from_id: number;
}

/** metric/metric.proto · CopyUserFavoriteListRes */
export interface CopyUserFavoriteListRes extends ApiResult {}

/** metric/metric.proto · DeleteLibReq */
export interface DeleteLibReq {
  lib_id: number;
  delete_note?: string;
}

/** metric/metric.proto · DeleteLibRes */
export interface DeleteLibRes extends ApiResult {}

/** metric/metric.proto · DeleteMetricReq */
export interface DeleteMetricReq {
  metric_id: number;
  delete_note?: string;
}

/** metric/metric.proto · DeleteMetricRes */
export interface DeleteMetricRes extends ApiResult {}

/** metric/metric.proto · GetLibListReq */
export interface GetLibListReq {
  org_id: number;
  column_list?: string;
}

/** metric/metric.proto · GetLibListRes */
export interface GetLibListRes extends ApiResult {
  row_list?: LibRow[];
}

/** metric/metric.proto · GetLibPropertyReq */
export interface GetLibPropertyReq {
  lib_id: number;
  column_list?: string;
}

/** metric/metric.proto · GetLibPropertyRes */
export interface GetLibPropertyRes extends ApiResult {
  lib_property?: LibRow;
}

/** metric/metric.proto · GetMetricAdminListReq */
export interface GetMetricAdminListReq {
  metric_id: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricAdminListRes */
export interface GetMetricAdminListRes extends ApiResult {
  row_list?: MetricAdminRow[];
}

/** metric/metric.proto · GetMetricAliasListReq */
export interface GetMetricAliasListReq {
  metric_id: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricAliasListRes */
export interface GetMetricAliasListRes extends ApiResult {
  row_list?: MetricAliasRow[];
}

/** metric/metric.proto · GetMetricAuthListReq */
export interface GetMetricAuthListReq {
  metric_id: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricAuthListRes */
export interface GetMetricAuthListRes extends ApiResult {
  row_list?: MetricAuthRow[];
}

/** metric/metric.proto · GetMetricCalcListReq */
export interface GetMetricCalcListReq {
  metric_id: number;
  metric_version?: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricCalcListRes */
export interface GetMetricCalcListRes extends ApiResult {
  row_list?: MetricCalcRow[];
}

/** metric/metric.proto · GetMetricChildListReq */
export interface GetMetricChildListReq {
  metric_id: number;
  include_child?: boolean;
  column_list?: string;
}

/** metric/metric.proto · GetMetricChildListRes */
export interface GetMetricChildListRes extends ApiResult {
  row_list?: MetricChildRow[];
}

/** metric/metric.proto · GetMetricFavoriteList2Req */
export interface GetMetricFavoriteList2Req {
  metric_id: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricFavoriteList2Res */
export interface GetMetricFavoriteList2Res extends ApiResult {
  row_list?: MetricFavoriteRow[];
}

/** metric/metric.proto · GetMetricFavoriteListReq */
export interface GetMetricFavoriteListReq {
  user_id?: number;
  lib_id?: number;
  include_child?: boolean;
  column_list?: string;
  column_lib?: string;
}

/** metric/metric.proto · GetMetricFavoriteListRes */
export interface GetMetricFavoriteListRes extends ApiResult {
  row_list?: MetricFavoriteRow[];
  lib_list?: LibRow[];
}

/** metric/metric.proto · GetMetricGoalListReq */
export interface GetMetricGoalListReq {
  metric_id: number;
  goal_period: string;
  unit_id?: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricGoalListRes */
export interface GetMetricGoalListRes extends ApiResult {
  row_list?: MetricGoalRow[];
}

/** metric/metric.proto · GetMetricLinkListReq */
export interface GetMetricLinkListReq {
  metric_id: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricLinkListRes */
export interface GetMetricLinkListRes extends ApiResult {
  row_list?: MetricLinkRow[];
}

/** metric/metric.proto · GetMetricListReq */
export interface GetMetricListReq {
  lib_id: number;
  catalog_id: number;
  /** 是否包含快捷目录中的指标，浏览器工作台需显式开启。 */
  include_shortcut?: boolean;
  include_descendant?: boolean;
  only_admin?: boolean;
  only_commit?: boolean;
  only_source?: boolean;
  only_approve?: boolean;
  column_list?: string;
  column_alias?: string;
}

/** metric/metric.proto · GetMetricListRes */
export interface GetMetricListRes extends ApiResult {
  row_list?: MetricRowExt[];
}

/** metric/metric.proto · GetMetricOrgListReq */
export interface GetMetricOrgListReq {
  metric_id: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricOrgListRes */
export interface GetMetricOrgListRes extends ApiResult {
  row_list?: MetricOrgRow[];
}

/** metric/metric.proto · GetMetricPropertyReq */
export interface GetMetricPropertyReq {
  metric_id: number;
  metric_version?: number;
  lib_id?: number;
  metric_name?: string;
  match_alias?: boolean;
  column_list?: string;
}

/** metric/metric.proto · GetMetricPropertyRes */
export interface GetMetricPropertyRes extends ApiResult {
  metric_property?: MetricRow;
}

/** metric/metric.proto · GetMetricShortcutListReq */
export interface GetMetricShortcutListReq {
  metric_id: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricShortcutListRes */
export interface GetMetricShortcutListRes extends ApiResult {
  row_list?: MetricShortcutRow[];
}

/** metric/metric.proto · GetMetricVarListReq */
export interface GetMetricVarListReq {
  metric_id: number;
  metric_version?: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricVarListRes */
export interface GetMetricVarListRes extends ApiResult {
  row_list?: MetricVarRow[];
}

/** metric/metric.proto · IsMetricSupportTodayReq */
export interface IsMetricSupportTodayReq {
  metric_id: number;
}

/** metric/metric.proto · IsMetricSupportTodayRes */
export interface IsMetricSupportTodayRes extends ApiResult {
  support_today?: boolean;
  only_today?: boolean;
}

/** metric/metric.proto · NewLibReq */
export interface NewLibReq {
  org_id: number;
  lib_no?: string;
  lib_code?: string;
  lib_name: string;
  lib_date?: string;
  lib_tag?: string;
  lib_note?: string;
  metric_count?: number;
  icon_system?: string;
  icon_name?: string;
  board_id?: number;
  board_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/metric.proto · NewLibRes */
export interface NewLibRes extends ApiResult {
  lib_id?: number;
}

/** metric/metric.proto · NewMetricReq */
export interface NewMetricReq {
  org_id: number;
  lib_id: number;
  catalog_id: number;
  metric_type?: string;
  metric_no?: string;
  metric_code?: string;
  metric_name: string;
  metric_title?: string;
  metric_desc?: string;
  metric_orientation?: string;
  metric_tag?: string;
  metric_note?: string;
  child_count?: number;
  value_digit?: number;
  value_ratio?: string;
  value_unit?: string;
  value_tag?: string;
  admin_type?: string;
  admin_id?: number;
  admin_name?: string;
  admin_user?: string;
  admin_freq?: string;
  icon_system?: string;
  icon_name?: string;
  component_id?: number;
  component_name?: string;
  board_id?: number;
  board_name?: string;
  cause_id?: number;
  cause_name?: string;
  unit_id?: number;
  unit_name?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/metric.proto · NewMetricRes */
export interface NewMetricRes extends ApiResult {
  metric_id?: number;
}

/** metric/metric.proto · RetrieveMetricListReq */
export interface RetrieveMetricListReq {
  lib_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  include_alias?: boolean;
  column_list?: string;
  column_lib?: string;
}

/** metric/metric.proto · RetrieveMetricListRes */
export interface RetrieveMetricListRes extends ApiResult {
  row_list?: MetricRow[];
  lib_list?: LibRow[];
}

/** metric/metric.proto · SaveLibPropertyReq */
export interface SaveLibPropertyReq {
  lib_id: number;
  lib_property: LibRow;
}

/** metric/metric.proto · SaveLibPropertyRes */
export interface SaveLibPropertyRes extends ApiResult {}

/** metric/metric.proto · SaveMetricAdminListReq */
export interface SaveMetricAdminListReq {
  metric_id: number;
  row_list: MetricAdminRow[];
}

/** metric/metric.proto · SaveMetricAdminListRes */
export interface SaveMetricAdminListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricAliasListReq */
export interface SaveMetricAliasListReq {
  metric_id: number;
  row_list: MetricAliasRow[];
}

/** metric/metric.proto · SaveMetricAliasListRes */
export interface SaveMetricAliasListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricAuthListReq */
export interface SaveMetricAuthListReq {
  metric_id: number;
  delete_row?: number;
  row_list: MetricAuthRow[];
}

/** metric/metric.proto · SaveMetricAuthListRes */
export interface SaveMetricAuthListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricCalcListReq */
export interface SaveMetricCalcListReq {
  metric_id: number;
  row_list: MetricCalcRow[];
}

/** metric/metric.proto · SaveMetricCalcListRes */
export interface SaveMetricCalcListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricChildListReq */
export interface SaveMetricChildListReq {
  metric_id: number;
  row_list: MetricChildRow[];
}

/** metric/metric.proto · SaveMetricChildListRes */
export interface SaveMetricChildListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricFavoriteListReq */
export interface SaveMetricFavoriteListReq {
  metric_id: number;
  row_list: MetricFavoriteRow[];
}

/** metric/metric.proto · SaveMetricFavoriteListRes */
export interface SaveMetricFavoriteListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricGoalListReq */
export interface SaveMetricGoalListReq {
  metric_id: number;
  goal_period: string;
  unit_id?: number;
  row_list: MetricGoalRow[];
}

/** metric/metric.proto · SaveMetricGoalListRes */
export interface SaveMetricGoalListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricLinkListReq */
export interface SaveMetricLinkListReq {
  metric_id: number;
  row_list: MetricLinkRow[];
}

/** metric/metric.proto · SaveMetricLinkListRes */
export interface SaveMetricLinkListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricOrgListReq */
export interface SaveMetricOrgListReq {
  metric_id: number;
  row_list: MetricOrgRow[];
}

/** metric/metric.proto · SaveMetricOrgListRes */
export interface SaveMetricOrgListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricPropertyReq */
export interface SaveMetricPropertyReq {
  metric_id: number;
  metric_property: MetricRow;
}

/** metric/metric.proto · SaveMetricPropertyRes */
export interface SaveMetricPropertyRes extends ApiResult {}

/** metric/metric.proto · SaveMetricShortcutListReq */
export interface SaveMetricShortcutListReq {
  metric_id: number;
  row_list: MetricShortcutRow[];
}

/** metric/metric.proto · SaveMetricShortcutListRes */
export interface SaveMetricShortcutListRes extends ApiResult {}

/** metric/metric.proto · SaveMetricVarListReq */
export interface SaveMetricVarListReq {
  metric_id: number;
  row_list: MetricVarRow[];
}

/** metric/metric.proto · SaveMetricVarListRes */
export interface SaveMetricVarListRes extends ApiResult {}

// talk 098c3a7f: management and preview protocols.
export interface MetricsetRow extends ProtoRow {
  metricset_id?: number;
  org_id?: number;
  catalog_id?: number;
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;
  unit_id?: number;
  unit_name?: string;
  metricset_no?: string;
  metricset_code?: string;
  metricset_name?: string;
  metricset_title?: string;
  metricset_tag?: string;
  metricset_note?: string;
  admin_id?: number;
  admin_name?: string;
  post_script?: string;
  post_tag?: string;
  post_note?: string;
  undo_script?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface MetricsetItemRow extends ProtoRow {
  row_id?: number;
  metricset_id?: number;
  item_id?: number;
  item_name?: string;
  item_title?: string;
  item_tag?: string;
  item_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface MetricsetShareRow extends ProtoRow {
  row_id?: number;
  metricset_id?: number;
  share_type?: string;
  share_id?: number;
  share_name?: string;
  share_tag?: string;
  share_note?: string;
  sort_no?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface EntityItem {
  entity_type?: string;
  entity_no?: number;
  entity_code?: string;
}

export interface GetMetricsetListReq {
  user_id?: number;
  catalog_id?: number;
  column_list?: string;
}

export interface GetMetricsetListRes extends ApiResult {
  row_list?: MetricsetRow[];
}

export interface NewMetricsetReq {
  org_id: number;
  catalog_id: number;
  dept_id?: number;
  dept_name?: string;
  user_id: number;
  user_name?: string;
  unit_id?: number;
  unit_name?: string;
  metricset_no?: string;
  metricset_code?: string;
  metricset_name: string;
  metricset_title?: string;
  metricset_tag?: string;
  metricset_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewMetricsetRes extends ApiResult {
  metricset_id?: number;
}

export interface DeleteMetricsetReq {
  metricset_id: number;
  delete_note?: string;
}

export interface DeleteMetricsetRes extends ApiResult {}

export interface GetMetricsetPropertyReq {
  metricset_id: number;
  column_list?: string;
}

export interface GetMetricsetPropertyRes extends ApiResult {
  metricset_property?: MetricsetRow;
}

export interface SaveMetricsetPropertyReq {
  metricset_id: number;
  metricset_property: MetricsetRow;
}

export interface SaveMetricsetPropertyRes extends ApiResult {}

export interface GetMetricsetItemListReq {
  metricset_id: number;
  column_list?: string;
}

export interface GetMetricsetItemListRes extends ApiResult {
  row_list?: MetricsetItemRow[];
}

export interface SaveMetricsetItemListReq {
  metricset_id: number;
  row_list: MetricsetItemRow[];
}

export interface SaveMetricsetItemListRes extends ApiResult {}

export interface GetMetricsetShareListReq {
  metricset_id: number;
  column_list?: string;
}

export interface GetMetricsetShareListRes extends ApiResult {
  row_list?: MetricsetShareRow[];
}

export interface SaveMetricsetShareListReq {
  metricset_id: number;
  row_list: MetricsetShareRow[];
}

export interface SaveMetricsetShareListRes extends ApiResult {}

export interface GetShareMetricsetListReq {
  user_id?: number;
  column_list?: string;
}

export interface GetShareMetricsetListRes extends ApiResult {
  row_list?: MetricsetRow[];
}

export interface GetMetricValueListReq {
  metric_id: number;
  object_type?: boolean;
  object_no?: boolean;
  object_code?: boolean;
  object_name?: boolean;
  pop_value?: boolean;
  yoy_value?: boolean;
  goal_value?: boolean;
  unit_id_list?: number[];
  entity_id_list?: number[];
  entity_list?: EntityItem[];
  filter_null?: boolean;
  filter_finish?: string;
  filter_pop?: string;
  filter_yoy?: string;
  sort_mode?: string;
  filter_top?: number;
  date_list: string[];
  column_list?: string;
}

export interface GetMetricValueListRes extends ApiResult {
  pop_value?: boolean;
  goal_value?: boolean;
  value_list?: MetricValue[];
  metric_property?: MetricRow;
}

export interface MetricValue {
  object_id?: number;
  object_type?: string;
  object_no?: number;
  object_code?: string;
  object_name?: string;
  date_name?: string;
  metric_id?: number;
  metric_name?: string;
  metric_value?: string;
  metric_value_fmt?: string;
  metric_value_abbr?: string;
  metric_value_unit?: string;
  metric_value_formula?: string;
  metric_value_express?: string;
  pop_value?: string;
  pop_value_fmt?: string;
  pop_rate?: string;
  pop_rate_fmt?: string;
  yoy_value?: string;
  yoy_value_fmt?: string;
  yoy_rate?: string;
  yoy_rate_fmt?: string;
  goal_type?: string;
  goal_value?: string;
  goal_value_min?: string;
  goal_value_max?: string;
  goal_unit?: string;
  goal_desc?: string;
  goal_finish?: string;
  goal_finish_fmt?: string;
}

/** metric/metric.proto · GetArgDefaultReq (talk f20b6de5) */
export interface GetArgDefaultReq {
  user_id?: number;
  lib_id?: number;
}

/** metric/metric.proto · GetArgDefaultRes (talk f20b6de5) */
export interface GetArgDefaultRes extends ApiResult {
  unit_id?: number;
  unit_name?: string;
  date_type?: string;
  date_name?: string;
  date_start?: string;
  date_end?: string;
}

/** metric/metric.proto · GetMetricValueList2Req (talk f20b6de5) */
export interface GetMetricValueList2Req {
  metric_id_list?: number[];
  object_type?: boolean;
  object_no?: boolean;
  object_code?: boolean;
  object_name?: boolean;
  pop_value?: boolean;
  yoy_value?: boolean;
  goal_value?: boolean;
  unit_id_list?: number[];
  entity_id_list?: number[];
  entity_list?: EntityItem[];
  date_name?: string;
  column_list?: string;
}

/** metric/metric.proto · GetMetricValueList2Res (talk f20b6de5) */
export interface GetMetricValueList2Res extends ApiResult {
  pop_value?: boolean;
  goal_value?: boolean;
  value_list?: MetricValue[];
  metric_list?: MetricRow[];
}

/** metric/metric.proto · GetMetricTrendListReq (talk f20b6de5) */
export interface GetMetricTrendListReq {
  metric_id?: number;
  unit_id?: number;
  entity_id?: number;
  date_name?: string;
  freq_name?: string;
  freq_count?: number;
}

/** metric/metric.proto · GetMetricTrendListRes (talk f20b6de5) */
export interface GetMetricTrendListRes extends ApiResult {
  date_start?: string;
  date_end?: string;
  date_list?: string[];
  value_list?: string[];
  chart_type?: string;
  chart_color?: string;
}

/** metric/metric.proto · GetMetricChildList2Req (talk f20b6de5) */
export interface GetMetricChildList2Req {
  metric_id_list?: number[];
  include_child?: boolean;
  column_list?: string;
}

/** metric/metric.proto · GetMetricChildList2Res (talk f20b6de5) */
export interface GetMetricChildList2Res extends ApiResult {
  row_list?: MetricChildRow[];
}

/** metric/metric.proto · AddMetricFavoriteReq (talk f20b6de5) */
export interface AddMetricFavoriteReq {
  user_id?: number;
  user_name?: string;
  metric_id?: number;
  metric_name?: string;
  favorite_color?: string;
  favorite_tag?: string;
  favorite_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/metric.proto · AddMetricFavoriteRes (talk f20b6de5) */
export interface AddMetricFavoriteRes extends ApiResult {
  favorite_id?: number;
}

/** metric/metric.proto · RemoveMetricFavoriteReq (talk f20b6de5) */
export interface RemoveMetricFavoriteReq {
  favorite_id?: number;
  user_id?: number;
  metric_id?: number;
}

/** metric/metric.proto · RemoveMetricFavoriteRes (talk f20b6de5) */
export interface RemoveMetricFavoriteRes extends ApiResult {}

/** metric/metric.proto · MetricSearchRow (talk f20b6de5) */
export interface MetricSearchRow extends ProtoRow {
  user_id?: number;
  lib_id?: number;
  metric_id?: number;
  metric_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** metric/metric.proto · GetMetricSearchListReq (talk f20b6de5) */
export interface GetMetricSearchListReq {
  user_id?: number;
  lib_id?: number;
  column_list?: string;
}

/** metric/metric.proto · GetMetricSearchListRes (talk f20b6de5) */
export interface GetMetricSearchListRes extends ApiResult {
  row_list?: MetricSearchRow[];
}

/** metric/metric.proto · MoveMetricFavoriteReq (talk f20b6de5) */
export type MoveMetricFavoriteReq = { favorite_id: number } & (
  | { before_id: number; after_id?: never }
  | { after_id: number; before_id?: never }
);
export interface MoveMetricFavoriteRes extends ApiResult {}
