import { request } from "comm/request";
import type {
  GetPatientPropertyReq,
  GetPatientPropertyRes,
  GetPatientProperty2Req,
  GetPatientProperty2Res,
  GetPatientAgeReq,
  GetPatientAgeRes,
  GetVisitPropertyReq,
  GetVisitPropertyRes,
  GetVisitListReq,
  GetVisitListRes,
} from "@/types/visit";

// 获取患者属性
export const getPatientProperty = (params: GetPatientPropertyReq) => {
  return request.post<GetPatientPropertyRes>(
    "visit/GetPatientProperty",
    params,
  );
};

// 获取患者年龄
export const getPatientAge = (params: GetPatientAgeReq) => {
  return request.post<GetPatientAgeRes>("visit/GetPatientAge", params);
};

export const getVisitPropertyAPI = (params: GetVisitPropertyReq) =>
  request.post<GetVisitPropertyRes>("visit/GetVisitProperty", params);

/** 按 visit_id 批量获取患者属性 */
export const getPatientProperty2 = (params: GetPatientProperty2Req) =>
  request.post<GetPatientProperty2Res>("visit/GetPatientProperty2", params);
