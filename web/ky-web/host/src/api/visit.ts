import { request } from "comm/request";
import type {
  GetVisitProperty2Req,
  GetVisitProperty2Res,
} from "@/types/visit";

/** 按就诊批量获取就诊属性 */
export const getVisitProperty2 = (params: GetVisitProperty2Req) =>
  request.post<GetVisitProperty2Res>("/visit/GetVisitProperty2", params);
