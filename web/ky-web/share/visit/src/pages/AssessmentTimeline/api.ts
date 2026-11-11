import { request } from "comm/request";

/** 获取评估单/病历列表（评估趋势时间线） */
export const getAssessmentListAPI = (query: {
  visit_id: number;
  doc_type?: string;
  // work_type?: string;
  doc_name?: string;
  doc_tag?: string;
}) => request.post<any>("emr/GetEmrList", query);
