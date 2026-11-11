import { request } from "comm/request";
import type {
  GetAllergyInfo2Req,
  GetAllergyInfo2Res,
  GetDiagListReq,
  GetDiagListRes,
  GetVisitPropertyReq,
  GetVisitPropertyRes,
  GetCaseList3Req,
  GetCaseList3Res,
  GetQcList3Req,
  GetQcList3Res,
  GetTimeTaskCount2Req,
  GetTimeTaskCount2Res,
  GetAreaPropertyReq,
  GetAreaPropertyRes,
} from "./types";

export const getVisitPropertyAPI = (params: GetVisitPropertyReq) =>
  request.post<GetVisitPropertyRes>("visit/GetVisitProperty", params);

export const getDiagListAPI = (params: GetDiagListReq) =>
  request.post<GetDiagListRes>("diag/GetDiagList", params);

export const getAllergyInfo2API = (params: GetAllergyInfo2Req) =>
  request.post<GetAllergyInfo2Res>("allergy/GetAllergyInfo2", params);

export const getQcList3API = (params: GetQcList3Req) =>
  request.post<GetQcList3Res>("emr/qc/GetQcList3", params);

export const getCaseList3API = (params: GetCaseList3Req) =>
  request.post<GetCaseList3Res>("emr/case/GetCaseList3", params);

export const getTimeTaskCount2API = (params: GetTimeTaskCount2Req) =>
  request.post<GetTimeTaskCount2Res>("emr/time/GetTimeTaskCount2", params);

export const getAreaPropertyAPI = (params: GetAreaPropertyReq) =>
  request.post<GetAreaPropertyRes>("sys/GetAreaProperty", params);
