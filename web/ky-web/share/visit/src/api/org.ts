import { request } from "comm/request";
import type { RetrieveDeptListReq, RetrieveDeptListRes } from "@/types/org";

// 检索科室列表
export const retrieveDeptList = (params: RetrieveDeptListReq) => {
  return request.post<RetrieveDeptListRes>("org/RetrieveDeptList", params);
};
