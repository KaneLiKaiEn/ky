import { request } from "comm/request";
import type { CurrentLoginUserDTO, RouterDTO } from "@/types/login";

/** 当前登录用户信息 */
export const getLoginUserInfo = () =>
  request.get<CurrentLoginUserDTO>("/getLoginUserInfo");

/** 当前用户可访问的菜单路由树 */
export const getRouters = () => request.get<RouterDTO[]>("/getRouters");

/** 退出登录（Spring Security logout 端点） */
export const logout = () =>
  request.post<void>("/logout", undefined, { errorMode: "local" });
