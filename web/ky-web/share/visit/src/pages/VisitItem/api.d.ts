import type { GetAllergyInfo2Req, GetAllergyInfo2Res, GetAreaPropertyReq, GetAreaPropertyRes, GetCaseList3Req, GetCaseList3Res, GetDiagListReq, GetDiagListRes, GetQcList3Req, GetQcList3Res, GetTimeTaskCount2Req, GetTimeTaskCount2Res, GetVisitPropertyReq, GetVisitPropertyRes } from "./types";
export declare const getVisitPropertyAPI: (params: GetVisitPropertyReq) => Promise<GetVisitPropertyRes>;
export declare const getDiagListAPI: (params: GetDiagListReq) => Promise<GetDiagListRes>;
export declare const getAllergyInfo2API: (params: GetAllergyInfo2Req) => Promise<GetAllergyInfo2Res>;
export declare const getQcList3API: (params: GetQcList3Req) => Promise<GetQcList3Res>;
export declare const getCaseList3API: (params: GetCaseList3Req) => Promise<GetCaseList3Res>;
export declare const getTimeTaskCount2API: (params: GetTimeTaskCount2Req) => Promise<GetTimeTaskCount2Res>;
export declare const getAreaPropertyAPI: (params: GetAreaPropertyReq) => Promise<GetAreaPropertyRes>;
