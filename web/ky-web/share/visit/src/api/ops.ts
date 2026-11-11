import { request } from "comm/request";
import type {
  RetrieveOpsItemListReq,
  RetrieveOpsItemListRes,
} from "@/types/ops";

/** 检索手术项目列表 */
export const retrieveOpsItemListAPI = (params: RetrieveOpsItemListReq) =>
  request.post<RetrieveOpsItemListRes>("ops/item/RetrieveItemList", {
    column_list: "*",
    ...params,
  });
