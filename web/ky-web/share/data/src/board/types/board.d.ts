/** 来源：本地 talk 的 board 协议；保留原字段名。bytes 为 protobuf JSON base64。 */
import type { ApiResult, ProtoRow } from "./comm.d.ts";

export interface BackgroundRow extends ProtoRow {
  background_id?: number;
  org_id?: number;
  catalog_id?: number;
  background_code?: string;
  background_name?: string;
  background_tag?: string;
  background_note?: string;
  theme_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BorderRow extends ProtoRow {
  border_id?: number;
  org_id?: number;
  catalog_id?: number;
  border_code?: string;
  border_name?: string;
  border_tag?: string;
  border_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BannerRow extends ProtoRow {
  banner_id?: number;
  org_id?: number;
  catalog_id?: number;
  banner_code?: string;
  banner_name?: string;
  banner_tag?: string;
  banner_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BannerDefRow extends ProtoRow {
  row_id?: number;
  banner_id?: number;
  item_code?: string;
  item_name?: string;
  item_value?: string;
  item_tag?: string;
  item_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BorderDefRow extends ProtoRow {
  row_id?: number;
  border_id?: number;
  item_code?: string;
  item_name?: string;
  item_value?: string;
  item_tag?: string;
  item_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ComponentRow extends ProtoRow {
  component_id?: number;
  org_id?: number;
  catalog_id?: number;
  component_version?: number;
  component_type?: string;
  component_no?: string;
  component_code?: string;
  component_name?: string;
  component_title?: string;
  component_tag?: string;
  component_note?: string;
  icon_system?: string;
  icon_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ComponentDefRow extends ProtoRow {
  row_id?: number;
  component_id?: number;
  component_version?: number;
  item_code?: string;
  item_name?: string;
  item_value?: string;
  item_tag?: string;
  item_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ComponentVarRow extends ProtoRow {
  row_id?: number;
  component_id?: number;
  component_version?: number;
  var_code?: string;
  var_name?: string;
  var_type?: string;
  var_value?: string;
  var_tag?: string;
  var_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface ComponentExtRow extends ProtoRow {
  row_id?: number;
  component_id?: number;
  component_version?: number;
  item_code?: string;
  item_name?: string;
  item_value?: string;
  item_tag?: string;
  item_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetBackgroundListReq {
  org_id?: number;
  catalog_id?: number;
  column_list?: string;
}

export interface GetBackgroundListRes extends ApiResult {
  row_list?: BackgroundRow[];
}

export interface RetrieveBackgroundListReq {
  org_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveBackgroundListRes extends ApiResult {
  row_list?: BackgroundRow[];
}

export interface NewBackgroundReq {
  org_id?: number;
  catalog_id?: number;
  background_code?: string;
  background_name?: string;
  background_tag?: string;
  background_note?: string;
  theme_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewBackgroundRes extends ApiResult {
  background_id?: number;
}

export interface DeleteBackgroundReq {
  background_id?: number;
  delete_note?: string;
}

export interface DeleteBackgroundRes extends ApiResult {}

export interface GetBackgroundPropertyReq {
  background_id?: number;
  column_list?: string;
}

export interface GetBackgroundPropertyRes extends ApiResult {
  background_property?: BackgroundRow;
}

export interface SaveBackgroundPropertyReq {
  background_id?: number;
  background_property?: BackgroundRow;
}

export interface SaveBackgroundPropertyRes extends ApiResult {}

export interface GetBackgroundFileReq {
  background_id?: number;
}

export interface GetBackgroundFileRes extends ApiResult {
  file_format?: string;
  file_content?: string;
}

export interface SaveBackgroundFileReq {
  background_id?: number;
  file_format?: string;
  file_content?: string;
}

export interface SaveBackgroundFileRes extends ApiResult {}

export interface GetBorderListReq {
  org_id?: number;
  catalog_id?: number;
  column_list?: string;
}

export interface GetBorderListRes extends ApiResult {
  row_list?: BorderRow[];
}

export interface RetrieveBorderListReq {
  org_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveBorderListRes extends ApiResult {
  row_list?: BorderRow[];
}

export interface NewBorderReq {
  org_id?: number;
  catalog_id?: number;
  border_code?: string;
  border_name?: string;
  border_tag?: string;
  border_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewBorderRes extends ApiResult {
  border_id?: number;
}

export interface DeleteBorderReq {
  border_id?: number;
  delete_note?: string;
}

export interface DeleteBorderRes extends ApiResult {}

export interface GetBorderPropertyReq {
  border_id?: number;
  column_list?: string;
}

export interface GetBorderPropertyRes extends ApiResult {
  border_property?: BorderRow;
}

export interface SaveBorderPropertyReq {
  border_id?: number;
  border_property?: BorderRow;
}

export interface SaveBorderPropertyRes extends ApiResult {}

export interface GetBorderDefListReq {
  border_id?: number;
  item_code?: string;
  column_list?: string;
}

export interface GetBorderDefListRes extends ApiResult {
  row_list?: BorderDefRow[];
}

export interface SaveBorderDefListReq {
  border_id?: number;
  item_code?: string;
  delete_row?: number;
  row_list?: BorderDefRow[];
}

export interface SaveBorderDefListRes extends ApiResult {}

export interface GetBorderFileReq {
  border_id?: number;
  file_name?: string;
}

export interface GetBorderFileRes extends ApiResult {
  file_format?: string;
  file_content?: string;
}

export interface SaveBorderFileReq {
  border_id?: number;
  file_name?: string;
  file_format?: string;
  file_content?: string;
}

export interface SaveBorderFileRes extends ApiResult {}

export interface GetBannerListReq {
  org_id?: number;
  catalog_id?: number;
  column_list?: string;
}

export interface GetBannerListRes extends ApiResult {
  row_list?: BannerRow[];
}

export interface RetrieveBannerListReq {
  org_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveBannerListRes extends ApiResult {
  row_list?: BannerRow[];
}

export interface NewBannerReq {
  org_id?: number;
  catalog_id?: number;
  banner_code?: string;
  banner_name?: string;
  banner_tag?: string;
  banner_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewBannerRes extends ApiResult {
  banner_id?: number;
}

export interface DeleteBannerReq {
  banner_id?: number;
  delete_note?: string;
}

export interface DeleteBannerRes extends ApiResult {}

export interface GetBannerPropertyReq {
  banner_id?: number;
  column_list?: string;
}

export interface GetBannerPropertyRes extends ApiResult {
  banner_property?: BannerRow;
}

export interface SaveBannerPropertyReq {
  banner_id?: number;
  banner_property?: BannerRow;
}

export interface SaveBannerPropertyRes extends ApiResult {}

export interface GetBannerDefListReq {
  banner_id?: number;
  item_code?: string;
  column_list?: string;
}

export interface GetBannerDefListRes extends ApiResult {
  row_list?: BannerDefRow[];
}

export interface SaveBannerDefListReq {
  banner_id?: number;
  item_code?: string;
  delete_row?: number;
  row_list?: BannerDefRow[];
}

export interface SaveBannerDefListRes extends ApiResult {}

export interface GetBannerFileReq {
  banner_id?: number;
  file_name?: string;
}

export interface GetBannerFileRes extends ApiResult {
  file_format?: string;
  file_content?: string;
}

export interface SaveBannerFileReq {
  banner_id?: number;
  file_name?: string;
  file_format?: string;
  file_content?: string;
}

export interface SaveBannerFileRes extends ApiResult {}

export interface GetComponentListReq {
  org_id?: number;
  catalog_id?: number;
  column_list?: string;
}

export interface GetComponentListRes extends ApiResult {
  row_list?: ComponentRow[];
}

export interface RetrieveComponentListReq {
  org_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveComponentListRes extends ApiResult {
  row_list?: ComponentRow[];
}

export interface NewComponentReq {
  org_id?: number;
  catalog_id?: number;
  component_version?: number;
  component_type?: string;
  component_no?: string;
  component_code?: string;
  component_name?: string;
  component_title?: string;
  component_tag?: string;
  component_note?: string;
  icon_system?: string;
  icon_name?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewComponentRes extends ApiResult {
  component_id?: number;
}

export interface DeleteComponentReq {
  component_id?: number;
  delete_note?: string;
}

export interface DeleteComponentRes extends ApiResult {}

export interface GetComponentPropertyReq {
  component_id?: number;
  component_version?: number;
  column_list?: string;
}

export interface GetComponentPropertyRes extends ApiResult {
  component_property?: ComponentRow;
}

export interface SaveComponentPropertyReq {
  component_id?: number;
  component_property?: ComponentRow;
}

export interface SaveComponentPropertyRes extends ApiResult {}

export interface GetComponentDefListReq {
  component_id?: number;
  component_version?: number;
  item_code?: string;
  column_list?: string;
}

export interface GetComponentDefListRes extends ApiResult {
  row_list?: ComponentDefRow[];
}

export interface SaveComponentDefListReq {
  component_id?: number;
  item_code?: string;
  delete_row?: number;
  row_list?: ComponentDefRow[];
}

export interface SaveComponentDefListRes extends ApiResult {}

export interface ReviseComponentReq {
  component_id?: number;
  revise_note?: string;
}

export interface ReviseComponentRes extends ApiResult {
  component_version?: number;
}

export interface GetComponentVarListReq {
  component_id?: number;
  component_version?: number;
  column_list?: string;
}

export interface GetComponentVarListRes extends ApiResult {
  row_list?: ComponentVarRow[];
}

export interface SaveComponentVarListReq {
  component_id?: number;
  delete_row?: number;
  row_list?: ComponentVarRow[];
}

export interface SaveComponentVarListRes extends ApiResult {}

export interface GetComponentExtListReq {
  component_id?: number;
  component_version?: number;
  column_list?: string;
}

export interface GetComponentExtListRes extends ApiResult {
  row_list?: ComponentExtRow[];
}

export interface SaveComponentExtListReq {
  component_id?: number;
  delete_row?: number;
  row_list?: ComponentExtRow[];
}

export interface SaveComponentExtListRes extends ApiResult {}

export interface GetComponentThumbnailReq {
  component_id?: number;
}

export interface GetComponentThumbnailRes extends ApiResult {
  image_format?: string;
  image_content?: string;
}

export interface SaveComponentThumbnailReq {
  component_id?: number;
  image_format?: string;
  image_content?: string;
}

export interface SaveComponentThumbnailRes extends ApiResult {}

export interface TestComponentReq {
  component_id?: number;
  var_list?: ComponentVarRow[];
  theme_name?: string;
  container_width?: string;
  container_height?: string;
  container_unit?: string;
}

export interface TestComponentRes extends ApiResult {
  html_content?: string;
  style_content?: string;
  script_content?: string;
}

import type { DatasetArgRow, ArgValueRow } from "./references.d.ts";

export interface BoardRow extends ProtoRow {
  board_id?: number;
  org_id?: number;
  catalog_id?: number;
  board_no?: string;
  board_code?: string;
  board_name?: string;
  board_title?: string;
  board_desc?: string;
  board_tag?: string;
  board_note?: string;
  icon_system?: string;
  icon_name?: string;
  banner_id?: number;
  banner_name?: string;
  banner_title?: string;
  banner_subtitle?: string;
  background_type?: string;
  background_id?: number;
  background_name?: string;
  refresh_interval?: number;
  show_duration?: number;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BoardAuthRow extends ProtoRow {
  row_id?: number;
  board_id?: number;
  auth_type?: string;
  auth_id?: number;
  auth_name?: string;
  auth_tag?: string;
  auth_note?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BoardComponentRow extends ProtoRow {
  board_component_id?: number;
  board_id?: number;
  component_id?: number;
  component_version?: number;
  component_type?: string;
  component_name?: string;
  component_title?: string;
  component_tag?: string;
  component_note?: string;
  refresh_interval?: number;
  refresh_event?: string;
  border_id?: number;
  border_name?: string;
  title_id?: number;
  title_name?: string;
  detail_type?: string;
  detail_id?: number;
  detail_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BoardComponentDefRow extends ProtoRow {
  row_id?: number;
  board_id?: number;
  board_component_id?: number;
  item_code?: string;
  item_name?: string;
  item_value?: string;
  item_tag?: string;
  item_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BoardComponentExtRow extends ProtoRow {
  row_id?: number;
  board_id?: number;
  board_component_id?: number;
  item_code?: string;
  item_name?: string;
  item_value?: string;
  item_tag?: string;
  item_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BoardComponentVarRow extends ProtoRow {
  row_id?: number;
  board_id?: number;
  board_component_id?: number;
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

export interface BoardComponentColRow extends ProtoRow {
  row_id?: number;
  board_id?: number;
  board_component_id?: number;
  col_code?: string;
  col_name?: string;
  col_width?: string;
  col_align?: string;
  col_auth?: string;
  col_tag?: string;
  col_note?: string;
  threshold_min?: string;
  threshold_max?: string;
  color_min?: string;
  color_mean?: string;
  color_max?: string;
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

export interface BoardComponentColThresholdRow extends ProtoRow {
  row_id?: number;
  board_component_id?: number;
  col_code?: string;
  threshold_min?: string;
  threshold_max?: string;
  threshold_list?: string;
  class_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface BoardLinkRow extends ProtoRow {
  row_id?: number;
  board_id?: number;
  link_name?: string;
  link_value?: string;
  link_arg?: string;
  link_tag?: string;
  link_note?: string;
  show_duration?: number;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface TitleRow extends ProtoRow {
  title_id?: number;
  org_id?: number;
  catalog_id?: number;
  title_code?: string;
  title_name?: string;
  title_tag?: string;
  title_note?: string;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetBoardListReq {
  org_id?: number;
  catalog_id?: number;
  include_descendant?: boolean;
  column_list?: string;
}

export interface GetBoardListRes extends ApiResult {
  row_list?: BoardRow[];
}

export interface RetrieveBoardListReq {
  org_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveBoardListRes extends ApiResult {
  row_list?: BoardRow[];
}

export interface NewBoardReq {
  org_id?: number;
  catalog_id?: number;
  board_no?: string;
  board_code?: string;
  board_name?: string;
  board_title?: string;
  board_desc?: string;
  board_tag?: string;
  board_note?: string;
  icon_system?: string;
  icon_name?: string;
  banner_id?: number;
  banner_name?: string;
  banner_title?: string;
  banner_subtitle?: string;
  background_type?: string;
  background_id?: number;
  background_name?: string;
  refresh_interval?: number;
  show_duration?: number;
  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewBoardRes extends ApiResult {
  board_id?: number;
}

export interface DeleteBoardReq {
  board_id?: number;
  delete_note?: string;
}

export interface DeleteBoardRes extends ApiResult {}

export interface GetBoardPropertyReq {
  board_id?: number;
  board_no?: string;
  board_code?: string;
  column_list?: string;
}

export interface GetBoardPropertyRes extends ApiResult {
  board_property?: BoardRow;
}

export interface SaveBoardPropertyReq {
  board_id?: number;
  board_property?: BoardRow;
}

export interface SaveBoardPropertyRes extends ApiResult {}

export interface GetBoardLayoutReq {
  board_id?: number;
}

export interface GetBoardLayoutRes extends ApiResult {
  layout_content?: string;
}

export interface SaveBoardLayoutReq {
  board_id?: number;
  layout_content?: string;
}

export interface SaveBoardLayoutRes extends ApiResult {}

export interface GetBoardAuthListReq {
  board_id?: number;
  column_list?: string;
}

export interface GetBoardAuthListRes extends ApiResult {
  row_list?: BoardAuthRow[];
}

export interface SaveBoardAuthListReq {
  board_id?: number;
  delete_row?: number;
  row_list?: BoardAuthRow[];
}

export interface SaveBoardAuthListRes extends ApiResult {}

export interface GetBoardComponentListReq {
  board_id?: number;
  column_list?: string;
}

export interface GetBoardComponentListRes extends ApiResult {
  row_list?: BoardComponentRow[];
}

export interface AddBoardComponentReq {
  board_id?: number;
  component_id?: number;
  component_version?: number;
  component_type?: string;
  component_name?: string;
  component_title?: string;
  component_tag?: string;
  component_note?: string;
  refresh_interval?: number;
  refresh_event?: string;
  border_id?: number;
  border_name?: string;
  title_id?: number;
  title_name?: string;
  detail_type?: string;
  detail_id?: number;
  detail_name?: string;
  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface AddBoardComponentRes extends ApiResult {
  board_component_id?: number;
}

export interface RemoveBoardComponentReq {
  board_component_id?: number;
}

export interface RemoveBoardComponentRes extends ApiResult {}

export interface GetBoardComponentPropertyReq {
  board_component_id?: number;
  column_list?: string;
}

export interface GetBoardComponentPropertyRes extends ApiResult {
  component_property?: BoardComponentRow;
}

export interface SaveBoardComponentPropertyReq {
  board_component_id?: number;
  component_property?: BoardComponentRow;
}

export interface SaveBoardComponentPropertyRes extends ApiResult {}

export interface GetBoardComponentDefListReq {
  board_component_id?: number;
  item_code?: string;
  column_list?: string;
}

export interface GetBoardComponentDefListRes extends ApiResult {
  row_list?: BoardComponentDefRow[];
}

export interface SaveBoardComponentDefListReq {
  board_component_id?: number;
  item_code?: string;
  delete_row?: number;
  row_list?: BoardComponentDefRow[];
}

export interface SaveBoardComponentDefListRes extends ApiResult {}

export interface GetBoardComponentExtListReq {
  board_component_id?: number;
  column_list?: string;
}

export interface GetBoardComponentExtListRes extends ApiResult {
  row_list?: BoardComponentExtRow[];
}

export interface SaveBoardComponentExtListReq {
  board_component_id?: number;
  delete_row?: number;
  row_list?: BoardComponentExtRow[];
}

export interface SaveBoardComponentExtListRes extends ApiResult {}

export interface GetBoardComponentVarListReq {
  board_component_id?: number;
  column_list?: string;
}

export interface GetBoardComponentVarListRes extends ApiResult {
  row_list?: BoardComponentVarRow[];
}

export interface SaveBoardComponentVarListReq {
  board_component_id?: number;
  delete_row?: number;
  row_list?: BoardComponentVarRow[];
}

export interface SaveBoardComponentVarListRes extends ApiResult {}

export interface GetBoardComponentColListReq {
  board_component_id?: number;
  column_list?: string;
}

export interface GetBoardComponentColListRes extends ApiResult {
  row_list?: BoardComponentColRow[];
}

export interface SaveBoardComponentColListReq {
  board_component_id?: number;
  delete_row?: number;
  row_list?: BoardComponentColRow[];
}

export interface SaveBoardComponentColListRes extends ApiResult {}

export interface GetBoardComponentColThresholdListReq {
  board_component_id?: number;
  col_code?: string;
  column_list?: string;
}

export interface GetBoardComponentColThresholdListRes extends ApiResult {
  row_list?: BoardComponentColThresholdRow[];
}

export interface SaveBoardComponentColThresholdListReq {
  board_component_id?: number;
  col_code?: string;
  row_list?: BoardComponentColThresholdRow[];
}

export interface SaveBoardComponentColThresholdListRes extends ApiResult {}

export interface GetBoardArgListReq {
  board_id?: number;
}

export interface GetBoardArgListRes extends ApiResult {
  row_list?: DatasetArgRow[];
}

export interface BuildBoardComponentReq {
  board_component_id?: number;
  arg_list?: ArgValueRow[];
  theme_name?: string;
  container_width?: string;
  container_height?: string;
  container_unit?: string;
  use_decoration?: boolean;
}

export interface BuildBoardComponentRes extends ApiResult {
  html_content?: string;
  style_content?: string;
  script_content?: string;
}

export interface RetrieveTitleListReq {
  org_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveTitleListRes extends ApiResult {
  row_list?: TitleRow[];
}

export interface GetTitlePropertyReq {
  title_id?: number;
  column_list?: string;
}

export interface GetTitlePropertyRes extends ApiResult {
  title_property?: TitleRow;
}

export interface GetBoardLinkListReq {
  board_id?: number;
  column_list?: string;
}

export interface GetBoardLinkListRes extends ApiResult {
  row_list?: BoardLinkRow[];
}

export interface SaveBoardLinkListReq {
  board_id?: number;
  delete_row?: number;
  row_list?: BoardLinkRow[];
}

export interface SaveBoardLinkListRes extends ApiResult {}

export interface GetMyCatalogListReq {
  parent_id?: number;
  column_list?: string;
}
export interface GetMyCatalogListRes extends ApiResult {
  row_list?: import("./sys.d.ts").CatalogRow[];
}
export interface GetMyBoardListReq {
  catalog_id?: number;
  column_list?: string;
}
export interface GetMyBoardListRes extends ApiResult {
  row_list?: BoardRow[];
}
export interface CountBoardComponentVarValueReq {
  board_component_id?: number;
  var_code?: string;
  arg_list?: ArgValueRow[];
}
export interface CountBoardComponentVarValueRes extends ApiResult {
  row_count?: number;
}
export interface GetBoardComponentVarValueReq extends CountBoardComponentVarValueReq {
  page_size?: number;
  page_no?: number;
}
export interface GetBoardComponentVarValueRes extends ApiResult {
  /** The HTTP gateway may expand these protobuf JSON bytes into an object. */
  data?: unknown;
  var_type?: string;
  var_value?: string;
}
