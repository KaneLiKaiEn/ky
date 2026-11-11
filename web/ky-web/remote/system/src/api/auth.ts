import { request } from "comm/request";
import type {
  GetSessionInfoReq,
  GetSessionInfoRes,
  ResetPwdReq,
  ResetPwdRes,
} from "@/types/auth";

export const getSessionInfo = (params: GetSessionInfoReq = {}) => {
  return request.post<GetSessionInfoRes>("auth/GetSessionInfo", params);
};

export const resetPwd = (params: ResetPwdReq) => {
  return request.post<ResetPwdRes>("auth/ResetPwd", params);
};
