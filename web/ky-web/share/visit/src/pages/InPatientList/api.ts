import { request } from "comm/request";
import type {
  GetDischargeListReq,
  GetDischargeListRes,
  GetIpListReq,
  GetIpListRes,
  GetTransferDeptList2Req,
  GetTransferDeptList2Res,
  RetrieveVisitListReq,
  RetrieveVisitListRes,
} from "./type";

/** 在院患者列表 */
export const getIpListAPI = (params: GetIpListReq) =>
  request.post<GetIpListRes>("visit/GetIpList", params);

/** 出院患者列表 */
export const getDischargeListAPI = (params: GetDischargeListReq) =>
  request.post<GetDischargeListRes>("visit/GetDischargeList", params);

/** 转科患者列表 */
export const getTransferDeptList2API = (params: GetTransferDeptList2Req) =>
  request.post<GetTransferDeptList2Res>("visit/GetTransferDeptList2", params);

/** 检索就诊列表（出院按天检索） */
export const retrieveVisitListAPI = (params: RetrieveVisitListReq) =>
  request.post<RetrieveVisitListRes>("visit/search/RetrieveVisitList", params);
