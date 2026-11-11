import { request } from "comm/request";
import type {
  ActiveModuleReq,
  ActiveModuleRes,
  DeleteModuleReq,
  DeleteModuleRes,
  GetActiveModuleListReq,
  GetActiveModuleListRes,
  GetAppEntryListReq,
  GetAppEntryListRes,
  GetAppEntryPropertyReq,
  GetAppEntryPropertyRes,
  GetAppListReq,
  GetAppListRes,
  GetAppPropertyReq,
  GetAppPropertyRes,
  GetAuthModuleListReq,
  GetAuthModuleListRes,
  GetFavoriteModuleListReq,
  GetFavoriteModuleListRes,
  GetFeatureListReq,
  GetFeatureListRes,
  GetModuleAuthListReq,
  GetModuleAuthListRes,
  GetModuleListReq,
  GetModuleListRes,
  GetModulePropertyReq,
  GetModulePropertyRes,
  GetMyModuleListReq,
  GetMyModuleListRes,
  NewModuleReq,
  NewModuleRes,
  SaveAppEntryPropertyReq,
  SaveAppEntryPropertyRes,
  SaveAppPropertyReq,
  SaveAppPropertyRes,
  SaveAuthModuleListReq,
  SaveAuthModuleListRes,
  SaveFavoriteModuleListReq,
  SaveFavoriteModuleListRes,
  SaveModuleAuthListReq,
  SaveModuleAuthListRes,
  SaveModulePropertyReq,
  SaveModulePropertyRes,
} from "@/types/federation";

const ALL_COLUMNS = "*";

/** 获取特性列表 */
export const getFeatureList = (params: GetFeatureListReq = {}) =>
  request.post<GetFeatureListRes>("federation/GetFeatureList", params);

/** 获取应用列表 */
export const getAppList = (params: GetAppListReq = {}) =>
  request.post<GetAppListRes>("federation/GetAppList", {
    column_list: ALL_COLUMNS,
    ...params,
  });

/** 获取应用属性 */
export const getAppProperty = (params: GetAppPropertyReq) =>
  request.post<GetAppPropertyRes>("federation/GetAppProperty", {
    column_list: ALL_COLUMNS,
    ...params,
  });

/** 保存应用属性 */
export const saveAppProperty = (params: SaveAppPropertyReq) =>
  request.post<SaveAppPropertyRes>("federation/SaveAppProperty", params);

/** 获取应用入口列表 */
export const getAppEntryList = (params: GetAppEntryListReq) =>
  request.post<GetAppEntryListRes>("federation/GetAppEntryList", {
    column_list: ALL_COLUMNS,
    ...params,
  });

/** 获取应用入口属性 */
export const getAppEntryProperty = (params: GetAppEntryPropertyReq) =>
  request.post<GetAppEntryPropertyRes>("federation/GetAppEntryProperty", {
    column_list: ALL_COLUMNS,
    ...params,
  });

/** 保存应用入口属性 */
export const saveAppEntryProperty = (params: SaveAppEntryPropertyReq) =>
  request.post<SaveAppEntryPropertyRes>(
    "federation/SaveAppEntryProperty",
    params,
  );

/** 新建模块 */
export const newModule = (params: NewModuleReq) =>
  request.post<NewModuleRes>("federation/NewModule", params);

/** 删除模块 */
export const deleteModule = (params: DeleteModuleReq) =>
  request.post<DeleteModuleRes>("federation/DeleteModule", params);

/** 获取模块列表 */
export const getModuleList = (params: GetModuleListReq) =>
  request.post<GetModuleListRes>("federation/GetModuleList", {
    column_list: ALL_COLUMNS,
    include_invalid: false,
    include_descendant: true,
    include_self: true,
    parent_id: 0,
    ...params,
  });

/** 获取我的模块列表 */
export const getMyModuleList = (params: GetMyModuleListReq = {}) =>
  request.post<GetMyModuleListRes>("federation/GetMyModuleList", {
    column_list: ALL_COLUMNS,
    column_app: "*",
    ...params,
  });

/** 获取模块属性 */
export const getModuleProperty = (params: GetModulePropertyReq) =>
  request.post<GetModulePropertyRes>("federation/GetModuleProperty", {
    column_list: ALL_COLUMNS,
    ...params,
  });

/** 保存模块属性 */
export const saveModuleProperty = (params: SaveModulePropertyReq) =>
  request.post<SaveModulePropertyRes>(
    "federation/SaveModuleProperty",
    params,
  );

/** 获取模块授权列表 */
export const getModuleAuthList = (params: GetModuleAuthListReq) =>
  request.post<GetModuleAuthListRes>("federation/GetModuleAuthList", {
    column_list: ALL_COLUMNS,
    ...params,
  });

/** 保存模块授权列表 */
export const saveModuleAuthList = (params: SaveModuleAuthListReq) =>
  request.post<SaveModuleAuthListRes>(
    "federation/SaveModuleAuthList",
    {
      delete_row: -1,
      ...params,
    },
  );

/** 按授权对象获取模块列表 */
export const getAuthModuleList = (params: GetAuthModuleListReq) =>
  request.post<GetAuthModuleListRes>("federation/GetAuthModuleList", {
    column_list: ALL_COLUMNS,
    ...params,
  });

/** 按授权对象保存模块列表 */
export const saveAuthModuleList = (params: SaveAuthModuleListReq) =>
  request.post<SaveAuthModuleListRes>(
    "federation/SaveAuthModuleList",
    {
      delete_row: -1,
      ...params,
    },
  );

/** 获取收藏模块列表 */
export const getFavoriteModuleList = (params: GetFavoriteModuleListReq) =>
  request.post<GetFavoriteModuleListRes>("federation/GetFavoriteModuleList", {
    column_list: ALL_COLUMNS,
    ...params,
  });

/** 保存收藏模块列表 */
export const saveFavoriteModuleList = (params: SaveFavoriteModuleListReq) =>
  request.post<SaveFavoriteModuleListRes>(
    "federation/SaveFavoriteModuleList",
    params,
  );

/** 记录模块使用频次 */
export const activeModule = (params: ActiveModuleReq) =>
  request.post<ActiveModuleRes>("federation/ActiveModule", params);

/** 获取高频使用模块列表 */
export const getActiveModuleList = (params: GetActiveModuleListReq) =>
  request.post<GetActiveModuleListRes>("federation/GetActiveModuleList", {
    column_list: ALL_COLUMNS,
    ...params,
  });
