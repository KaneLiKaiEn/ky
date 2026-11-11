import { request } from "comm/request";
import type {
  GetLabReportListReq,
  GetLabReportListRes,
  GetLabReportDetailReq,
  GetLabReportDetailRes,
  GetLabReportBactReq,
  GetLabReportBactRes,
  GetLabReportAstReq,
  GetLabReportAstRes,
  GetLabReportContentReq,
  GetLabReportContentRes,
  GetLabItemHistoryReq,
  GetLabItemHistoryRes,
  GetFavoriteReportItemListReq,
  GetFavoriteReportItemListRes,
  FavoriteReportItemReq,
  FavoriteReportItemRes,
  UndoFavoriteReportItemReq,
  UndoFavoriteReportItemRes,
} from "@/types/lab";

// 获取检验报告列表
export const getLabReportList = (params: GetLabReportListReq) => {
  return request.post<GetLabReportListRes>("lab/report/GetReportList", params);
};

// 获取检验报告明细
export const getLabReportDetail = (params: GetLabReportDetailReq) => {
  return request.post<GetLabReportDetailRes>("lab/report/GetReportDetail", params);
};

// 获取细菌培养结果
export const getLabReportBact = (params: GetLabReportBactReq) => {
  return request.post<GetLabReportBactRes>("lab/report/GetReportBact", params);
};

// 获取药敏试验结果
export const getLabReportAst = (params: GetLabReportAstReq) => {
  return request.post<GetLabReportAstRes>("lab/report/GetReportAst", params);
};

// 获取检验报告内容
export const getLabReportContent = (params: GetLabReportContentReq) => {
  return request.post<GetLabReportContentRes>("lab/report/GetReportContent", params);
};

// 获取检验项目历史
export const getLabItemHistory = (params: GetLabItemHistoryReq) => {
  return request.post<GetLabItemHistoryRes>("lab/report/GetItemHistory", params);
};

// 获取已关注检验项目
export const getFavoriteReportItemList = (params: GetFavoriteReportItemListReq) => {
  return request.post<GetFavoriteReportItemListRes>(
    "lab/report/GetFavoriteReportItemList",
    params,
  );
};

// 关注检验项目
export const favoriteReportItem = (params: FavoriteReportItemReq) => {
  return request.post<FavoriteReportItemRes>("lab/report/FavoriteReportItem", params);
};

// 取消关注检验项目
export const undoFavoriteReportItem = (params: UndoFavoriteReportItemReq) => {
  return request.post<UndoFavoriteReportItemRes>(
    "lab/report/UndoFavoriteReportItem",
    params,
  );
};

// 获取检验报告文档（PDF）
export const getLabReportDoc = (params: { session_id: string,report_no: string }) => {
  const { session_id, report_no } = params;
  return request.get<Blob>(`lab/report/doc/${encodeURIComponent(session_id)}/${encodeURIComponent(report_no)}`, {
    responseType: "blob",
  });
};

