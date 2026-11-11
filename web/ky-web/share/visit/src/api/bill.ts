import { request } from "comm/request";
import type {
  GetBillAccountReq,
  GetBillAccountRes,
  RetrieveItemListReq,
  RetrieveItemListRes,
} from "@/types/bill";

/** 按就诊取记费 / 扣费金额 */
export const getBillAccountAPI = (params: GetBillAccountReq) =>
  request.post<GetBillAccountRes>("bill/GetBillAccount", params);

/** 检索计费项目列表 */
export const retrieveBillItemListAPI = (params: RetrieveItemListReq) =>
  request.post<RetrieveItemListRes>("bill/item/RetrieveItemList", {
    column_list: "*",
    ...params,
  });
