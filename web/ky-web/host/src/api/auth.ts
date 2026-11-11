import { request } from "comm/request";
import type {
  GetSessionInfoReq,
  GetSessionInfoRes,
  LoginReq,
  LoginRes,
  LogoutReq,
  LogoutRes,
  SwitchDeptReq,
  SwitchDeptRes,
} from "@/types/auth";

// 登录
export const login = (params: LoginReq) => {
  return request.post<LoginRes>("/auth/Login", params, {
    headers: {
      "xmhis-session-id": "xmhis.session.default",
    },
  });
};

// 退出登录
export const logout = (params: LogoutReq) => {
  return request.post<LogoutRes>("/auth/Logout", params);
};

// 获取会话信息
export const getSessionInfo = (params: GetSessionInfoReq) => {
  return request.post<GetSessionInfoRes>("/auth/GetSessionInfo", params);
};

// 切换部门
export const switchDept = (params: SwitchDeptReq) => {
  return request.post<SwitchDeptRes>("/auth/SwitchDept", params);
};
