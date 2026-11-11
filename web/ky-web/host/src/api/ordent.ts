import { request } from "comm/request";
import type { OrderListReq, OrderListRes } from "@/types/ordent";

/** 待校对医嘱列表 */
export const getToVerifyOrderList = (params: OrderListReq) =>
  request.post<OrderListRes>("/ordent/GetToVerifyOrderList", params);

/** 待停止医嘱列表 */
export const getToEndOrderList = (params: OrderListReq) =>
  request.post<OrderListRes>("/ordent/GetToEndOrderList", params);

/** 待终止医嘱列表 */
export const getToTerminateOrderList = (params: OrderListReq) =>
  request.post<OrderListRes>("/ordent/GetToTerminateOrderList", params);
