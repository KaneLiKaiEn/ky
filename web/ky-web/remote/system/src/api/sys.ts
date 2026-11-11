import { request } from "comm/request";
import type {
  GetAreaListReq,
  GetAreaListRes,
  RetrieveAreaListReq,
  RetrieveAreaListRes,
  AddAuthAppReq,
  AddAuthAppRes,
  DeleteAuthAppReq,
  DeleteAuthAppRes,
  DeleteDict2ItemReq,
  DeleteDict2ItemRes,
  DeleteDict2Req,
  DeleteDict2Res,
  GetAuthAppListReq,
  GetAuthAppListRes,
  GetAuthModuleListReq,
  GetAuthModuleListRes,
  GetParamValueReq,
  GetParamValueRes,
  GetSysAppListReq,
  GetSysAppListRes,
  GetSysModuleListReq,
  GetSysModuleListRes,
  NewDict2ItemReq,
  NewDict2ItemRes,
  NewDict2Req,
  NewDict2Res,
  RetrieveDict2ItemListReq,
  RetrieveDict2ItemListRes,
  RetrieveDict2ListReq,
  RetrieveDict2ListRes,
  SaveAuthModuleListReq,
  SaveAuthModuleListRes,
  SaveDict2ItemPropertyReq,
  SaveDict2ItemPropertyRes,
  SaveDict2PropertyReq,
  SaveDict2PropertyRes,
} from "@/types/sys";

export const retrieveDict2List = (params: RetrieveDict2ListReq) => {
  return request.post<RetrieveDict2ListRes>("sys/RetrieveDict2List", {
    retrieve_input: "*",
    column_list: "*",
    ...params,
  });
};

export const newDict2 = (params: NewDict2Req) => {
  return request.post<NewDict2Res>("sys/NewDict2", params);
};

export const saveDict2Property = (params: SaveDict2PropertyReq) => {
  return request.post<SaveDict2PropertyRes>("sys/SaveDict2Property", params);
};

export const deleteDict2 = (params: DeleteDict2Req) => {
  return request.post<DeleteDict2Res>("sys/DeleteDict2", params);
};

export const retrieveDict2ItemList = (params: RetrieveDict2ItemListReq) => {
  return request.post<RetrieveDict2ItemListRes>("sys/RetrieveDict2ItemList", {
    retrieve_input: "*",
    column_list: "*",
    ...params,
  });
};

export const newDict2Item = (params: NewDict2ItemReq) => {
  return request.post<NewDict2ItemRes>("sys/NewDict2Item", params);
};

export const saveDict2ItemProperty = (params: SaveDict2ItemPropertyReq) => {
  return request.post<SaveDict2ItemPropertyRes>(
    "sys/SaveDict2ItemProperty",
    params,
  );
};

export const deleteDict2Item = (params: DeleteDict2ItemReq) => {
  return request.post<DeleteDict2ItemRes>("sys/DeleteDict2Item", params);
};

export const getParamValue = (params: GetParamValueReq) => {
  return request.post<GetParamValueRes>("sys/GetParamValue", params);
};

export const getSysAppList = (params: GetSysAppListReq = {}) => {
  return request.post<GetSysAppListRes>("sys/GetAppList", params);
};

export const getAuthAppList = (params: GetAuthAppListReq) => {
  return request.post<GetAuthAppListRes>("sys/GetAuthAppList", params);
};

export const addAuthApp = (params: AddAuthAppReq) => {
  return request.post<AddAuthAppRes>("sys/AddAuthApp", params);
};

export const deleteAuthApp = (params: DeleteAuthAppReq) => {
  return request.post<DeleteAuthAppRes>("sys/DeleteAuthApp", params);
};

export const getSysModuleList = (params: GetSysModuleListReq = {}) => {
  return request.post<GetSysModuleListRes>("sys/GetModuleList", params);
};

export const getAuthModuleList = (params: GetAuthModuleListReq) => {
  return request.post<GetAuthModuleListRes>("sys/GetAuthModuleList", params);
};

export const saveAuthModuleList = (params: SaveAuthModuleListReq) => {
  return request.post<SaveAuthModuleListRes>("sys/SaveAuthModuleList", params);
};

export const getAreaList = (params: GetAreaListReq) =>
  request.post<GetAreaListRes>("sys/GetAreaList", {
    column_list: "*",
    ...params,
  });

export const retrieveAreaList = (params: RetrieveAreaListReq) =>
  request.post<RetrieveAreaListRes>("sys/RetrieveAreaList", {
    retrieve_input: "*",
    retrieve_limit: 0,
    column_list: "*",
    ...params,
  });
