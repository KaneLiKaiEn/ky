import { request } from "comm/request";
import type {
  RetrieveItemListReq,
  RetrieveItemListRes,
} from "@/types/exam";

export const retrieveItemList = (params: RetrieveItemListReq) => {
  return request.post<RetrieveItemListRes>("exam/item/RetrieveItemList", {
    retrieve_input: "*",
    column_list: "*",
    ...params,
  });
};
