import { request } from "comm/request";
import type { GetEmrListReq, GetEmrListRes } from "@/types/emr";
import type { GetQcList3Req, GetQcList3Res } from "@/pages/VisitItem/types";
import type {
  CommitQcReq,
  CommitQcRes,
  RollbackQcReq,
  RollbackQcRes,
} from "./types";

type ApiConfig = { rawResponse?: boolean };

/** 拿到 code>0 / code<0 的原始结果，由页面按质控规则提示 */
export const rawResponseConfig = { rawResponse: true as const };

/** 获取病历列表 */
export const getEmrListAPI = (req: GetEmrListReq, config?: ApiConfig) =>
  request.post<GetEmrListRes>("emr/GetEmrList", req, config);

/** 查询就诊质控提交状态 */
export const getQcList3API = (req: GetQcList3Req, config?: ApiConfig) =>
  request.post<GetQcList3Res>("emr/qc/GetQcList3", req, config);

/** 提交质控 */
export const commitQcAPI = (req: CommitQcReq, config?: ApiConfig) =>
  request.post<CommitQcRes>("emr/qc/CommitQc", req, config);

/** 申请退回质控 */
export const rollbackQcAPI = (req: RollbackQcReq, config?: ApiConfig) =>
  request.post<RollbackQcRes>("emr/qc/RollbackQc", req, config);
