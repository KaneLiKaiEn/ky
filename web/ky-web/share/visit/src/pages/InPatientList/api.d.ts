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

export declare const getIpListAPI: (
  params: GetIpListReq,
) => Promise<GetIpListRes>;
export declare const getDischargeListAPI: (
  params: GetDischargeListReq,
) => Promise<GetDischargeListRes>;
export declare const getTransferDeptList2API: (
  params: GetTransferDeptList2Req,
) => Promise<GetTransferDeptList2Res>;
export declare const retrieveVisitListAPI: (
  params: RetrieveVisitListReq,
) => Promise<RetrieveVisitListRes>;
