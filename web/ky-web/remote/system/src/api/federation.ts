import { request } from "comm/request";
import type {
  DeleteModuleReq,
  DeleteModuleRes,
  GetAppEntryListReq,
  GetAppEntryListRes,
  GetAppListReq,
  GetAppListRes,
  GetAuthModuleListReq,
  GetAuthModuleListRes,
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
  SaveAuthModuleListReq,
  SaveAuthModuleListRes,
  SaveModuleAuthListReq,
  SaveModuleAuthListRes,
  SaveModulePropertyReq,
  SaveModulePropertyRes,
} from "@/types/federation";

// 获取系统列表
export const getAppList = (params: GetAppListReq) => {
  return request.post<GetAppListRes>("federation/GetAppList", params);
};

// 获取系统入口列表
export const getAppEntryList = (params: GetAppEntryListReq) => {
  return request.post<GetAppEntryListRes>(
    "federation/GetAppEntryList",
    params,
  );
};

// 新增模块
export const newModule = (params: NewModuleReq) => {
  return request.post<NewModuleRes>("federation/NewModule", params);
};

// 删除模块
export const deleteModule = (params: DeleteModuleReq) => {
  return request.post<DeleteModuleRes>("federation/DeleteModule", params);
};

// 获取模块列表
export const getModuleList = (params: GetModuleListReq) => {
  return request.post<GetModuleListRes>("federation/GetModuleList", params);
};

// 获取我的模块列表
export const getMyModuleList = (params: GetMyModuleListReq) => {
  return request.post<GetMyModuleListRes>("federation/GetMyModuleList", params);
};

// 获取模块属性
export const getModuleProperty = (params: GetModulePropertyReq) => {
  return request.post<GetModulePropertyRes>(
    "federation/GetModuleProperty",
    params,
  );
};

// 保存模块属性
export const saveModuleProperty = (params: SaveModulePropertyReq) => {
  return request.post<SaveModulePropertyRes>(
    "federation/SaveModuleProperty",
    params,
  );
};

// 获取模块授权列表
export const getModuleAuthList = (params: GetModuleAuthListReq) => {
  return request.post<GetModuleAuthListRes>(
    "federation/GetModuleAuthList",
    params,
  );
};

// 保存模块授权列表
export const saveModuleAuthList = (params: SaveModuleAuthListReq) => {
  return request.post<SaveModuleAuthListRes>(
    "federation/SaveModuleAuthList",
    params,
  );
};

// 按授权对象获取模块列表
export const getAuthModuleList = (params: GetAuthModuleListReq) => {
  return request.post<GetAuthModuleListRes>(
    "federation/GetAuthModuleList",
    params,
  );
};

// 按授权对象保存模块列表
export const saveAuthModuleList = (params: SaveAuthModuleListReq) => {
  return request.post<SaveAuthModuleListRes>(
    "federation/SaveAuthModuleList",
    params,
  );
};
