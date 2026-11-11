import { request } from "comm/request";
import type { ObserveRow, VisitValueRow } from "./types";

export interface BptChartListResult {
  chart_format?: string;
  /** protobuf bytes，JSON 下多为 base64 字符串 */
  chart_list?: (string | number[])[];
}

/** 获取体温单绘图表（SVG） */
export const getBptChartListAPI = (params: {
  visit_id: number;
  chart_format: "SVG" | string;
  /** 周次页码，0 = 入院第一周 */
  page_list?: number[];
}) =>
  request.post<any & BptChartListResult>("care/draw/GetBptChartList", params);

export const getObserveListAPI = (params: {
  visit_id: number;
  observe_start: string;
  observe_end: string;
}) =>
  request.post<any>("care/observe/GetObserveList", {
    ...params,
    include_except: false,
    include_cancel: false,
    observe_tag: "[体温单]",
  });

export const newObserveAPI = (data: ObserveRow) =>
  request.post<any>("care/observe/NewObserve", data);

export const deleteObserveAPI = (params: { observe_id: number }) =>
  request.post<any>("care/observe/DeleteObserve", params);

export const getVisitPropertyAPI = (params: { visit_id: number }) =>
  request.post<any>("visit/GetVisitProperty", {
    ...params,
    column_ip: "*",
  });

export const retrieveDict2ListAPI = (params: { org_id: number }) =>
  request.post<any>("sys/RetrieveDict2List", params);

export const retrieveDict2ItemListAPI = (params: {
  dict_id: number;
  retrieve_input?: string;
}) =>
  request.post<any>("sys/RetrieveDict2ItemList", {
    retrieve_input: "*",
    ...params,
  });

export const retrieveCatalogListAPI = (params: {
  catalog_type: string;
  retrieve_input: string;
}) => request.post<any>("sys/RetrieveCatalogList", params);

export const getElemListAPI = (params: { catalog_id: number }) =>
  request.post<any>("elem/GetElemList", params);

export const getElemPropertyAPI = (params: any) =>
  request.post<any>("elem/GetElemProperty", params);

export const getVisitValueListAPI = (params: {
  visit_id: number;
  link_value: number;
  link_name: "bpt";
}) => request.post<any>("elem/GetVisitValueList", params);

export const saveVisitValueListAPI = (params: {
  visit_id: number;
  link_value: number;
  link_name: "bpt";
  value_list: VisitValueRow[];
}) => request.post<any>("elem/SaveVisitValueList", params);

export const getSessionInfoAPI = (params: { session_id: string }) =>
  request.post<any>("auth/GetSessionInfo", params);
