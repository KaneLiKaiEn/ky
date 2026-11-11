import { request } from "comm/request";
import type {
  RetrieveItemListReq,
  RetrieveItemListRes,
} from "@/types/drug";

export const retrieveItemList = (params: RetrieveItemListReq) => {
  return request.post<RetrieveItemListRes>("drug/item/RetrieveItemList", {
    retrieve_input: "*",
    column_list: "*",
    ...params,
  });
};
