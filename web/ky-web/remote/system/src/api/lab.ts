import { request } from "comm/request";
import type {
  RetrieveItemListReq,
  RetrieveItemListRes,
} from "@/types/lab";

export const retrieveItemList = (params: RetrieveItemListReq) => {
  return request.post<RetrieveItemListRes>("lab/item/RetrieveItemList", {
    retrieve_input: "*",
    column_list: "*",
    ...params,
  });
};
