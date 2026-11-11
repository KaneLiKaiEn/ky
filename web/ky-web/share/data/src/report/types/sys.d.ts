/** Generated from local talk 098c3a7f; protobuf JSON uses snake_case, number IDs and base64 bytes. */

export interface CatalogRow {
  catalog_id?: number;
  org_id?: number;
  dept_id?: number;
  group_id?: number;
  unit_id?: number;
  user_id?: number;
  parent_id?: number;
  tree_code?: string;
  catalog_type?: string;
  catalog_no?: string;
  catalog_code?: string;
  catalog_level?: number;
  catalog_name?: string;
  catalog_tag?: string;
  catalog_note?: string;
  child_count?: number;
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

export interface DeleteCatalogReq {
  catalog_id?: number;
  delete_note?: string;
}

export interface DeleteCatalogRes {
  code?: number;
  message?: string;
  hint?: string;
}

export interface GetCatalogListReq {
  parent_id?: number;
  catalog_type?: string;
  org_id?: number;
  dept_id?: number;
  group_id?: number;
  unit_id?: number;
  user_id?: number;
  include_invalid?: boolean;
  include_descendant?: boolean;
  include_self?: boolean;
  column_list?: string;
}

export interface GetCatalogListRes {
  code?: number;
  message?: string;
  hint?: string;
  catalog_list?: CatalogRow[];
}

export interface NewCatalogReq {
  parent_id?: number;
  org_id?: number;
  dept_id?: number;
  group_id?: number;
  unit_id?: number;
  user_id?: number;
  tree_code?: string;
  catalog_type?: string;
  catalog_no?: string;
  catalog_code?: string;
  catalog_level?: number;
  catalog_name?: string;
  catalog_tag?: string;
  catalog_note?: string;
  child_count?: number;
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

export interface NewCatalogRes {
  code?: number;
  message?: string;
  hint?: string;
  catalog_id?: number;
}

export interface SaveCatalogPropertyReq {
  catalog_id?: number;
  catalog_property?: CatalogRow;
}

export interface SaveCatalogPropertyRes {
  code?: number;
  message?: string;
  hint?: string;
}
