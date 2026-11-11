import { request } from "comm/request";
import type {
  GetActiveDealerListReq,
  GetActiveDealerListRes,
  GetPayDealListReq,
  GetPayDealListRes,
  GetPayListReq,
  GetPayListRes,
} from "@/types/pay";

/** 可用支付渠道列表 */
export const getActiveDealerListAPI = (
  params: GetActiveDealerListReq = {},
) =>
  request.post<GetActiveDealerListRes>("pay/GetActiveDealerList", params);

/** 按业务关联查询支付单 */
export const getPayListAPI = (params: GetPayListReq) =>
  request.post<GetPayListRes>("pay/GetPayList", params);

/** 按 pay_id 查询交易明细 */
export const getPayDealListAPI = (params: GetPayDealListReq) =>
  request.post<GetPayDealListRes>("pay/GetPayDealList", params);
