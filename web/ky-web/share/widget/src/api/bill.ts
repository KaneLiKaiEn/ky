import { request } from "comm/request";
import type {
  GetBillAccount2Req,
  GetBillAccount2Res,
  GetBillAccountReq,
  GetBillAccountRes,
} from "@/types/bill";

/** 按就诊取记费 / 扣费金额 */
export const getBillAccountAPI = (params: GetBillAccountReq) =>
  request.post<GetBillAccountRes>("bill/GetBillAccount", params);

/** 批量取记费 / 扣费金额 */
export const getBillAccount2API = (params: GetBillAccount2Req) =>
  request.post<GetBillAccount2Res>("bill/GetBillAccount2", params);
