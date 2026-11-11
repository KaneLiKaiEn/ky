import { request } from "comm/request";
import type {
  GetApplyDetailByVisitReq,
  GetApplyDetailByVisitRes,
  GetApplyPropertyReq,
  GetApplyPropertyRes,
} from "@/types/pharmacyApply";

/** 按就诊获取摆药明细（row_list 含 order_id、apply_id） */
export const getApplyDetailByVisitAPI = (params: GetApplyDetailByVisitReq) =>
  request.post<GetApplyDetailByVisitRes>(
    "pharmacy/apply/GetApplyDetail",
    params,
  );

/** 获取摆药单属性（apply_property.apply_status） */
export const getApplyPropertyAPI = (params: GetApplyPropertyReq) =>
  request.post<GetApplyPropertyRes>("pharmacy/apply/GetApplyProperty", params);
