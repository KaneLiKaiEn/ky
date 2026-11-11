import { request } from "comm/request";
import type {
  GetSessionInfoReq,
  GetSessionInfoRes,
  LoginReq,
  LoginRes,
} from "@/types/auth";

/** 登录（不占用当前会话，用于限制级药品授权等二次校验） */
export const login = (params: LoginReq) => {
  return request.post<LoginRes>("auth/Login", params, {
    headers: {
      "xmhis-session-id": "xmhis.session.default",
    },
  });
};

// 获取会话信息
export const getSessionInfo = (params: GetSessionInfoReq) => {
  return request.post<GetSessionInfoRes>("auth/GetSessionInfo", params);
};
