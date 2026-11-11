import { request } from "comm/request";
import type {
  RetrieveItemListReq,
  RetrieveItemListRes,
} from "@/types/bill";

export const retrieveItemList = (params: RetrieveItemListReq) => {
  return request.post<RetrieveItemListRes>("bill/item/RetrieveItemList", {
    retrieve_input: "*",
    column_list: "*",
    ...params,
  });
};
