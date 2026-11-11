import { request } from "comm/request";
import type {
  GetPathologyReportListReq,
  GetPathologyReportListRes,
  GetPathologyReportContentReq,
  GetPathologyReportContentRes,
} from "@/types/pathology";

// 获取病理报告列表
export const getPathologyReportList = (params: GetPathologyReportListReq) => {
  return request.post<GetPathologyReportListRes>("pathology/report/GetReportList", params);
};

// 获取病理报告内容
export const getPathologyReportContent = (params: GetPathologyReportContentReq) => {
  return request.post<GetPathologyReportContentRes>("pathology/report/GetReportContent", params);
};

// 获取病理报告文档（PDF）
export const getPathologyReportDoc = (params: {
  session_id: string;
  report_no: string;
}) => {
  const { session_id, report_no } = params;
  return request.get<Blob>(
    `pathology/report/doc/${encodeURIComponent(session_id)}/${encodeURIComponent(report_no)}`,
    { responseType: "blob" },
  );
};
