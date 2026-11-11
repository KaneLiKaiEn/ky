import { request } from "comm/request";
import type {
  RetrieveItemListReq,
  RetrieveItemListRes,
} from "@/types/material";

/** 检索材料项目列表 */
export const retrieveMaterialItemListAPI = (params: RetrieveItemListReq) =>
  request.post<RetrieveItemListRes>("material/item/RetrieveItemList", {
    column_list: "*",
    ...params,
  });
