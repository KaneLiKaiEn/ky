import { request } from "comm/request";
import type { GetSessionInfoReq, GetSessionInfoRes } from "@/types/auth";

export const getSessionInfo = (params: GetSessionInfoReq = {}) => {
  return request.post<GetSessionInfoRes>("auth/GetSessionInfo", params);
};
