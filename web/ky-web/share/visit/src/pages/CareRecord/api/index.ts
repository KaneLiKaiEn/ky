import type {
  RetrieveDict2ItemListReq,
  RetrieveDict2ItemListRes,
} from "@/types/sys";
import { request } from "comm/request";

/** 拼接接口/文档 URL */
export function getApiUrl(path: string) {
  const base =
    typeof window !== "undefined" && (window as any).TEST_API
      ? (window as any).TEST_API
      : window.location.hostname === "localhost"
        ? "https://xmhis.top:30101"
        : `${window.location.protocol}//${window.location.hostname}:${window.location.port || "30101"}`;
  return `${base}/api/${path}`;
}

export const getSessionInfoAPI = (params: any) =>
  request.post<any>("auth/GetSessionInfo", params);

export const getVisitPropertyAPI = (params: any) =>
  request.post<any>("visit/GetVisitProperty", params);

export const getElemPropertyAPI = (params: any) =>
  request.post<any>("elem/GetElemProperty", params);

export const getCareListAPI = (params: any) =>
  request.post<any>("care/GetCareList", params);

export const getObserveListAPI = (params: any) =>
  request.post<any>("care/observe/GetObserveList", params);

export const saveObserveListAPI = (params: any) =>
  request.post<any>("care/observe/SaveObserveList", params);

export const newCareAPI = (params: any) =>
  request.post<any>("care/NewCare", params);

export const saveCarePropertyAPI = (params: any) =>
  request.post<any>("care/SaveCareProperty", params);

export const getCarePropertyAPI = (params: any) =>
  request.post<any>("care/GetCareProperty", params);

export const deleteCareAPI = (params: any) =>
  request.post<any>("care/DeleteCare", params);

export const deleteObserve2API = (params: any) =>
  request.post<any>("care/observe/DeleteObserve2", params);

export const retrieveDict2ItemList = (params: RetrieveDict2ItemListReq) =>
  request.post<RetrieveDict2ItemListRes>("sys/RetrieveDict2ItemList", params);

export const getCatalogListAPI = (params: any) =>
  request.post<any>("sys/GetCatalogList", params);

export const getCatalogPropertyAPI = (params: any) =>
  request.post<any>("sys/GetCatalogProperty", params);

export const saveCatalogPropertyAPI = (params: any) =>
  request.post<any>("sys/SaveCatalogProperty", params);

export const newCatalogAPI = (params: any) =>
  request.post<any>("sys/NewCatalog", params);

export const deleteCatalogAPI = (params: any) =>
  request.post<any>("sys/DeleteCatalog", params);

export const getCarePrefabListAPI = (params: any) =>
  request.post<any>("care/GetCarePrefabList", params);

export const getCarePrefabPropertyAPI = (params: any) =>
  request.post<any>("care/GetCarePrefabProperty", params);

export const getCarePrefabContentAPI = (params: any) =>
  request.post<any>("care/GetCarePrefabContent", params);

export const getCarePrefabContent2API = (params: any) =>
  request.post<any>("care/GetCarePrefabContent2", params);

export const saveCarePrefabContentAPI = (params: any) =>
  request.post<any>("care/SaveCarePrefabContent", params);

export const saveCarePrefabPropertyAPI = (params: any) =>
  request.post<any>("care/SaveCarePrefabProperty", params);

export const newCarePrefabAPI = (params: any) =>
  request.post<any>("care/NewCarePrefab", params);

export const deleteCarePrefabAPI = (params: any) =>
  request.post<any>("care/DeleteCarePrefab", params);

export const getIoListAPI = (params: any) =>
  request.post<any>("care/io/GetIoList", params);

export const newIoAPI = (params: any) =>
  request.post<any>("care/io/NewIo", params);

export const saveIoPropertyAPI = (params: any) =>
  request.post<any>("care/io/SaveIoProperty", params);

export const deleteIoAPI = (params: any) =>
  request.post<any>("care/io/DeleteIo", params);

export const deleteIo2API = (params: any) =>
  request.post<any>("care/io/DeleteIo2", params);

export const commitIoAPI = (params: { io_id: number }) =>
  request.post<any>("care/io/CommitIo", params);

export const undoCommitIoAPI = (params: { io_id: number }) =>
  request.post<any>("care/io/UndoCommitIo", params);

export const newIoSumAPI = (params: any) =>
  request.post<any>("care/io/NewIoSum", params);

export const getIoSumPropertyAPI = (params: any) =>
  request.post<any>("care/io/GetIoSumProperty", params);

export const getIoSumListAPI = (params: any) =>
  request.post<any>("care/io/GetIoSumList", params);

export const getIoSumItemListAPI = (params: { sum_id: number }) =>
  request.post<any>("care/io/GetIoSumItemList", params);

export const deleteIoSumAPI = (params: { sum_id: number }) =>
  request.post<any>("care/io/DeleteIoSum", params);

export const getOxygenListAPI = (params: any) =>
  request.post<any>("care/oxygen/GetOxygenList", params);

export const getOxygenPropertyAPI = (params: any) =>
  request.post<any>("care/oxygen/GetOxygenProperty", params);

export const newOxygenAPI = (params: any) =>
  request.post<any>("care/oxygen/NewOxygen", params);

export const saveOxygenPropertyAPI = (params: any) =>
  request.post<any>("care/oxygen/SaveOxygenProperty", params);

export const deleteOxygenAPI = (params: any) =>
  request.post<any>("care/oxygen/DeleteOxygen", params);

// 获取手术列表
export const getSurgeryListAPI = (query: {
  visit_id: number;
  ops_status: string;
}) => request.post<any>("ops/GetVisitOpsList", query);

// 查找医嘱的护理等级
export const getCareLevelAPI = (params: any) =>
  request.post<any>("ordent/GetOrderBaseLatest", params);
