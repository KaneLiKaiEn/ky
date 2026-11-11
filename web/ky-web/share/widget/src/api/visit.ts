import { request } from "comm/request";
import type {
  GetAllergyInfo2Req,
  GetAllergyInfo2Res,
  GetClinicProperty2Req,
  GetClinicProperty2Res,
  GetClinicPropertyReq,
  GetClinicPropertyRes,
  GetIpListReq,
  GetIpListRes,
  GetPredischargeListReq,
  GetPredischargeListRes,
  GetVisitProperty2Req,
  GetVisitProperty2Res,
  GetVisitPropertyReq,
  GetVisitPropertyRes,
} from "@/types/visit";

/** 在院患者列表 */
export const getIpListAPI = (params: GetIpListReq) =>
  request.post<GetIpListRes>("visit/GetIpList", params);

/** 预出院列表（按病区） */
export const getPredischargeListAPI = (params: GetPredischargeListReq) =>
  request.post<GetPredischargeListRes>("visit/GetPredischargeList", params);

/** 就诊详细属性（就诊/住院/患者/状态/预出院） */
export const getVisitPropertyAPI = (params: GetVisitPropertyReq) =>
  request.post<GetVisitPropertyRes>("visit/GetVisitProperty", params);

/** 批量就诊详细属性（就诊/住院/患者/状态/预出院） */
export const getVisitProperty2API = (params: GetVisitProperty2Req) =>
  request.post<GetVisitProperty2Res>("visit/GetVisitProperty2", params);

/** 患者过敏信息 */
export const getAllergyInfo2API = (params: GetAllergyInfo2Req) =>
  request.post<GetAllergyInfo2Res>("allergy/GetAllergyInfo2", params);

/** 就诊临床属性（主诊断、全部诊断等） */
export const getClinicPropertyAPI = (params: GetClinicPropertyReq) =>
  request.post<GetClinicPropertyRes>("clinic/GetClinicProperty", params);

/** 批量就诊临床属性（主诊断、全部诊断等） */
export const getClinicProperty2API = (params: GetClinicProperty2Req) =>
  request.post<GetClinicProperty2Res>("clinic/GetClinicProperty2", params);
