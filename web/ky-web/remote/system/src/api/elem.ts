import { request } from "comm/request";
import type {
  RetrieveElemListReq,
  RetrieveElemListRes,
} from "@/types/elem";

export const retrieveElemList = (params: RetrieveElemListReq) => {
  return request.post<RetrieveElemListRes>("elem/RetrieveElemList", {
    retrieve_input: "*",
    column_list: "*",
    ...params,
  });
};
