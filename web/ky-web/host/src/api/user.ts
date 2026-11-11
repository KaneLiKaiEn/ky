import { request } from "comm/request";
import type { GetUserDeptListReq, GetUserDeptListRes } from "@/types/user";

// 获取用户科室列表
export const getUserDeptList = (params: GetUserDeptListReq) => {
  return request.post<GetUserDeptListRes>("/user/GetUserDeptList", params);
};
