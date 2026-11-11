import { request } from "comm/request";
import type {
  GetAccountListReq,
  GetAccountListRes,
  GetAccountReq,
  GetAccountRes,
} from "@/types/account";

/** 按就诊取账户余额（预交金 / 担保等） */
export const getAccountAPI = (params: GetAccountReq) =>
  request.post<GetAccountRes>("account/GetAccount", params);

/** 批量取账户余额（预交金 / 担保等） */
export const getAccountListAPI = (params: GetAccountListReq) =>
  request.post<GetAccountListRes>("account/GetAccountList", params);
