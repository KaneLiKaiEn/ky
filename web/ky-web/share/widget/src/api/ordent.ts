import { request } from "comm/request";
import type { ApiResult } from "@/types/comm";

export interface GetOrderListByWardReq {
  ward_id: number;
}

export interface GetOrderListByWardRes extends ApiResult {
  row_list?: any[];
}

export interface VerifyOrderReq {
  order_id: number;
  return_note?: string;
  return_order?: boolean;
}

export interface OrderIdListReq {
  order_id_list: number[];
}

export interface OrderIdReq {
  order_id: number;
}

/** 待校对医嘱列表 */
export const getToVerifyOrderListAPI = (params: GetOrderListByWardReq) =>
  request.post<GetOrderListByWardRes>("ordent/GetToVerifyOrderList", params);

/** 执行前校对 / 退回 */
export const verifyOrderAPI = (params: VerifyOrderReq) =>
  request.post<ApiResult>("ordent/VerifyOrder", params);

/** 批量执行前校对 */
export const verifyOrder2API = (params: OrderIdListReq) =>
  request.post<ApiResult>("ordent/VerifyOrder2", params);

/** 待停止医嘱列表 */
export const getToEndOrderListAPI = (params: GetOrderListByWardReq) =>
  request.post<GetOrderListByWardRes>("ordent/GetToEndOrderList", params);

/** 停嘱校对 */
export const endOrderAPI = (params: OrderIdReq) =>
  request.post<ApiResult>("ordent/EndOrder", params);

/** 批量停嘱校对 */
export const endOrder2API = (params: OrderIdListReq) =>
  request.post<ApiResult>("ordent/EndOrder2", params);

/** 待执行临时医嘱列表 */
export const getToExecOrderListAPI = (params: GetOrderListByWardReq) =>
  request.post<GetOrderListByWardRes>("ordent/GetToExecOrderList", params);

/** 执行医嘱 */
export const execOrderAPI = (params: OrderIdReq) =>
  request.post<ApiResult>("ordent/ExecOrder", params);

/** 批量执行医嘱 */
export const execOrder2API = (params: OrderIdListReq) =>
  request.post<ApiResult>("ordent/ExecOrder2", params);

/** 待作废医嘱列表 */
export const getToTerminateOrderListAPI = (params: GetOrderListByWardReq) =>
  request.post<GetOrderListByWardRes>("ordent/GetToTerminateOrderList", params);

/** 作废医嘱 */
export const terminateOrderAPI = (params: OrderIdReq) =>
  request.post<ApiResult>("ordent/TerminateOrder", params);
