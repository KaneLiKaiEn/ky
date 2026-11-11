import { request } from "comm/request";
import type { GetLibListReq, GetLibListRes } from "@/types/metric";

/** 获取指标库列表 */
export const getLibList = (params: GetLibListReq) => {
  return request.post<GetLibListRes>("/metric/GetLibList", {
    column_list: "*",
    ...params,
  });
};
