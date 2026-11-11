import { request } from "comm/request";
import type {
  GetDocAssessResultReq,
  GetDocAssessResultRes,
  GetDocNameListReq,
  GetDocNameListRes,
  GetDocNamePropertyReq,
  GetDocNamePropertyRes,
  GetDocTypeListReq,
  GetDocTypeListRes,
  GetPrintDocListReq,
  GetPrintDocListRes,
  RebuildVisitDocReq,
  RebuildVisitDocRes,
  SavePrintDocReq,
  SavePrintDocRes,
} from "@/types/doc";

// 获取文档名称属性
export const getDocNameProperty = (params: GetDocNamePropertyReq) => {
  return request.post<GetDocNamePropertyRes>("doc/GetDocNameProperty", params);
};

// 获取文档评估结果
export const getDocAssessResult = (params: GetDocAssessResultReq) => {
  return request.post<GetDocAssessResultRes>("doc/GetDocAssessResult", params);
};

type GetDocVisit2EmrParams = {
  session_id: string;
  emr_id: number;
  owner_type?: string;
};

export const getDocVisit2EmrPath = (params: GetDocVisit2EmrParams) => {
  const { session_id, emr_id, owner_type = "EMR" } = params;
  return `doc/visit2/${encodeURIComponent(session_id)}/${encodeURIComponent(owner_type)}/${encodeURIComponent(emr_id)}`;
};

export const getDocVisit2EmrUrl = (params: GetDocVisit2EmrParams) => {
  return `${window.location.origin}/api/${getDocVisit2EmrPath(params)}`;
};

export const getDocVisit2Emr = (params: GetDocVisit2EmrParams) => {
  return request.get<Blob>(getDocVisit2EmrPath(params), {
    responseType: "blob",
  });
};

type GetDocVisit2PreviewParams = {
  session_id: string;
  owner_type?: string;
  owner_id: number;
};

export const getDocVisit2PreviewPath = (params: GetDocVisit2PreviewParams) => {
  const { session_id, owner_type = "EMR", owner_id } = params;
  return `doc/visit2/preview/${encodeURIComponent(session_id)}/${encodeURIComponent(owner_type)}/${encodeURIComponent(owner_id)}`;
};

export const getDocVisit2PreviewUrl = (params: GetDocVisit2PreviewParams) => {
  return `${window.location.origin}/api/${getDocVisit2PreviewPath(params)}`;
};

export const getDocVisit2Preview = (params: GetDocVisit2PreviewParams) => {
  return request.get<Blob>(getDocVisit2PreviewPath(params), {
    responseType: "blob",
  });
};

export const rebuildVisitDoc = (params: RebuildVisitDocReq) => {
  return request.post<RebuildVisitDocRes>("doc/visit/RebuildVisitDoc", params);
};

export const savePrintDoc = (params: SavePrintDocReq) => {
  return request.post<SavePrintDocRes>("doc/visit/SavePrintDoc", params);
};

/** 获取文档类型列表 */
export const getDocTypeListAPI = (params: GetDocTypeListReq = {}) =>
  request.post<GetDocTypeListRes>("doc/GetDocTypeList", params);

/** 获取文档名称列表 */
export const getDocNameListAPI = (params: GetDocNameListReq) =>
  request.post<GetDocNameListRes>("doc/GetDocNameList", params);

/** 获取打印文档列表 */
export const getPrintDocList = (params: GetPrintDocListReq) =>
  request.post<GetPrintDocListRes>("doc/visit/GetPrintDocList", params);

/** @deprecated 别名 */
export const getPrintDocListAPI = getPrintDocList;
