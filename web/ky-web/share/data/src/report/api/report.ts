import { request } from "comm/request";
import type * as Protocol from "../types/report.d.ts";

export const getHomeReport = (
  params: Protocol.GetHomeReportReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetHomeReportRes>("report/GetHomeReport", params, {
    signal,
  });
export const saveHomeReport = (
  params: Protocol.SaveHomeReportReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.SaveHomeReportRes>("report/SaveHomeReport", params, {
    signal,
  });
export const getMyCatalogList = (
  params: Protocol.GetMyCatalogListReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetMyCatalogListRes>(
    "report/GetMyCatalogList",
    params,
    { signal },
  );
export const getMyReportList = (
  params: Protocol.GetMyReportListReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetMyReportListRes>("report/GetMyReportList", params, {
    signal,
  });
export const retrieveMyReportList = (
  params: Protocol.RetrieveMyReportListReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.RetrieveMyReportListRes>(
    "report/RetrieveMyReportList",
    params,
    { signal },
  );
export const getReportArgList2 = (
  params: Protocol.GetReportArgList2Req,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetReportArgList2Res>(
    "report/GetReportArgList2",
    params,
    { signal },
  );
export const buildReportColumn = (
  params: Protocol.BuildReportColumnReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.BuildReportColumnRes>(
    "report/BuildReportColumn",
    params,
    { signal },
  );
// Unlike ordinary RPCs, a positive code with row_count is the documented configured-count fallback.
export const countReportData = (
  params: Protocol.CountReportDataReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.CountReportDataRes>("report/CountReportData", params, {
    signal,
    rawResponse: true,
  });
export const retrieveReportData = (
  params: Protocol.RetrieveReportDataReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.RetrieveReportDataRes>(
    "report/RetrieveReportData",
    params,
    { signal },
  );
export const retrieveReportCell = (
  params: Protocol.RetrieveReportCellReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.RetrieveReportCellRes>(
    "report/RetrieveReportCell",
    params,
    { signal },
  );
export const editReportCell = (
  params: Protocol.EditReportCellReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.EditReportCellRes>("report/EditReportCell", params, {
    signal,
  });
export const printReport = (
  params: Protocol.PrintReportReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.PrintReportRes>("report/PrintReport", params, {
    signal,
  });

export const getReportList = (params: Protocol.GetReportListReq) =>
  request.post<Protocol.GetReportListRes>("report/GetReportList", params);
export const retrieveReportList = (params: Protocol.RetrieveReportListReq) =>
  request.post<Protocol.RetrieveReportListRes>(
    "report/RetrieveReportList",
    params,
  );
export const newReport = (params: Protocol.NewReportReq) =>
  request.post<Protocol.NewReportRes>("report/NewReport", params);
export const deleteReport = (params: Protocol.DeleteReportReq) =>
  request.post<Protocol.DeleteReportRes>("report/DeleteReport", params);
export const getReportProperty = (
  params: Protocol.GetReportPropertyReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetReportPropertyRes>(
    "report/GetReportProperty",
    params,
    { signal },
  );
export const saveReportProperty = (params: Protocol.SaveReportPropertyReq) =>
  request.post<Protocol.SaveReportPropertyRes>(
    "report/SaveReportProperty",
    params,
  );
export const getReportColList = (params: Protocol.GetReportColListReq) =>
  request.post<Protocol.GetReportColListRes>("report/GetReportColList", params);
export const saveReportColList = (params: Protocol.SaveReportColListReq) =>
  request.post<Protocol.SaveReportColListRes>(
    "report/SaveReportColList",
    params,
  );
export const parseReportColList = (params: Protocol.ParseReportColListReq) =>
  request.post<Protocol.ParseReportColListRes>(
    "report/ParseReportColList",
    params,
  );
export const getReportRowList = (params: Protocol.GetReportRowListReq) =>
  request.post<Protocol.GetReportRowListRes>("report/GetReportRowList", params);
export const saveReportRowList = (params: Protocol.SaveReportRowListReq) =>
  request.post<Protocol.SaveReportRowListRes>(
    "report/SaveReportRowList",
    params,
  );
export const getReportValList = (params: Protocol.GetReportValListReq) =>
  request.post<Protocol.GetReportValListRes>("report/GetReportValList", params);
export const saveReportValList = (params: Protocol.SaveReportValListReq) =>
  request.post<Protocol.SaveReportValListRes>(
    "report/SaveReportValList",
    params,
  );
export const getReportArgList = (params: Protocol.GetReportArgListReq) =>
  request.post<Protocol.GetReportArgListRes>("report/GetReportArgList", params);
export const saveReportArgList = (params: Protocol.SaveReportArgListReq) =>
  request.post<Protocol.SaveReportArgListRes>(
    "report/SaveReportArgList",
    params,
  );
export const getReportVarList = (params: Protocol.GetReportVarListReq) =>
  request.post<Protocol.GetReportVarListRes>("report/GetReportVarList", params);
export const saveReportVarList = (params: Protocol.SaveReportVarListReq) =>
  request.post<Protocol.SaveReportVarListRes>(
    "report/SaveReportVarList",
    params,
  );
export const getReportAuthList = (params: Protocol.GetReportAuthListReq) =>
  request.post<Protocol.GetReportAuthListRes>(
    "report/GetReportAuthList",
    params,
  );
export const saveReportAuthList = (params: Protocol.SaveReportAuthListReq) =>
  request.post<Protocol.SaveReportAuthListRes>(
    "report/SaveReportAuthList",
    params,
  );
export const getReportCmdList = (params: Protocol.GetReportCmdListReq) =>
  request.post<Protocol.GetReportCmdListRes>("report/GetReportCmdList", params);
export const saveReportCmdList = (params: Protocol.SaveReportCmdListReq) =>
  request.post<Protocol.SaveReportCmdListRes>(
    "report/SaveReportCmdList",
    params,
  );
export const newReportStyle = (params: Protocol.NewReportStyleReq) =>
  request.post<Protocol.NewReportStyleRes>("report/NewReportStyle", params);
export const getReportStyle = (
  params: Protocol.GetReportStyleReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetReportStyleRes>("report/GetReportStyle", params, {
    signal,
  });
export const saveReportStyle = (params: Protocol.SaveReportStyleReq) =>
  request.post<Protocol.SaveReportStyleRes>("report/SaveReportStyle", params);
export const removeReportStyle = (params: Protocol.RemoveReportStyleReq) =>
  request.post<Protocol.RemoveReportStyleRes>(
    "report/RemoveReportStyle",
    params,
  );
export const getReportContent = (
  params: Protocol.GetReportContentReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetReportContentRes>(
    "report/GetReportContent",
    params,
    { signal },
  );
export const saveReportContent = (params: Protocol.SaveReportContentReq) =>
  request.post<Protocol.SaveReportContentRes>(
    "report/SaveReportContent",
    params,
  );
