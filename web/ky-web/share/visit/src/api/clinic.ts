import { request } from "comm/request";
import type {
  GetClinicPropertyReq,
  GetClinicPropertyRes,
  GetProblemListReq,
  GetProblemListRes,
  NewProblemAssessReq,
  NewProblemAssessRes,
  NewProblemReq,
  NewProblemRes,
} from "@/types/clinic";

/** 获取就诊临床属性（含门诊主诊断等） */
export const getClinicPropertyAPI = (params: GetClinicPropertyReq) =>
  request.post<GetClinicPropertyRes>("clinic/GetClinicProperty", params);

/** 新建患者问题 */
export const newProblem = (params: NewProblemReq) =>
  request.post<NewProblemRes>("clinic/NewProblem", params);

/** 获取患者问题列表 */
export const getProblemList = (params: GetProblemListReq) =>
  request.post<GetProblemListRes>("clinic/GetProblemList", params);

/** 新建患者问题评估 */
export const newProblemAssess = (params: NewProblemAssessReq) =>
  request.post<NewProblemAssessRes>("clinic/NewProblemAssess", params);
