import { request } from "comm/request";
import type { GetWidgetListReq, GetWidgetListRes } from "@/types/federation";

export const getWidgetList = (params: GetWidgetListReq) => {
  return request.post<GetWidgetListRes>("federation/GetWidgetList", {
    column_list: "*",
    ...params,
  });
};
