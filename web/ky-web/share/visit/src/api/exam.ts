import { request } from "comm/request";
import type {
  GetExamReportListReq,
  GetExamReportListRes,
  GetExamReportContentReq,
  GetExamReportContentRes,
} from "@/types/exam";

// 获取检查报告列表
export const getExamReportList = (params: GetExamReportListReq) => {
  return request.post<GetExamReportListRes>("exam/report/GetReportList", params);
};

// 获取检查报告内容
export const getExamReportContent = (params: GetExamReportContentReq) => {
  return request.post<GetExamReportContentRes>("exam/report/GetReportContent", params);
};

// 获取检查报告文档（PDF）
export const getExamReportDoc = (params: {
  session_id: string;
  report_no: string;
}) => {
  const { session_id, report_no } = params;
  return request.get<Blob>(
    `exam/report/doc/${encodeURIComponent(session_id)}/${encodeURIComponent(report_no)}`,
    { responseType: "blob" },
  );
};
