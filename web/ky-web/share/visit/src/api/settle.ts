import { request } from "comm/request";
import type { GetSettleList3Req, GetSettleList3Res } from "@/types/settle";

// 获取结算列表
export const getSettleList3 = (params: GetSettleList3Req) => {
  return request.post<GetSettleList3Res>("settle/GetSettleList3", params);
};