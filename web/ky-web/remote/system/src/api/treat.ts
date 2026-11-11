import { request } from "comm/request";
import type {
  RetrieveItemListReq,
  RetrieveItemListRes,
} from "@/types/treat";

export const retrieveItemList = (params: RetrieveItemListReq) => {
  return request.post<RetrieveItemListRes>("treat/item/RetrieveItemList", {
    retrieve_input: "*",
    column_list: "*",
    ...params,
  });
};
