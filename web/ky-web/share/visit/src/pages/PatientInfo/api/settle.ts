import { request } from "comm/request";
import type {
  GetDealerListReq,
  GetDealerListRes,
  GetSettleHandleInfoReq,
  GetSettleHandleInfoRes,
  GetSettleServiceInfoReq,
  GetSettleServiceInfoRes,
} from "../types/settle";

/** 结算系统列表 */
export const getDealerListAPI = (params: GetDealerListReq = {}) =>
  request.post<GetDealerListRes>("settle/GetDealerList", params);

/** 获取结算服务 / 保险信息（医保状态） */
export const getSettleServiceInfoAPI = (params: GetSettleServiceInfoReq) =>
  request.post<GetSettleServiceInfoRes>("settle/GetSettleServiceInfo", params);

/** 获取结算登记信息（登记号） */
export const getSettleHandleInfoAPI = (params: GetSettleHandleInfoReq) =>
  request.post<GetSettleHandleInfoRes>("settle/GetSettleHandleInfo", params);
