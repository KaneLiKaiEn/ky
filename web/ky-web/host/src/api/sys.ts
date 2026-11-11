import { request } from "comm/request";
import type {
  GetParamValueReq,
  GetParamValueRes,
  RetrieveDict2ItemListReq,
  RetrieveDict2ItemListRes,
} from "@/types/sys";

// 获取参数值
export const getParamValue = (params: GetParamValueReq) => {
  return request.post<GetParamValueRes>("/sys/GetParamValue", params);
};

/** 检索字典项。retrieve_input 默认 *；dict_code 如 ai.model / ai.agent */
export const retrieveDict2ItemList = (params: RetrieveDict2ItemListReq) => {
  return request.post<RetrieveDict2ItemListRes>("/sys/RetrieveDict2ItemList", {
    retrieve_input: "*",
    column_list: "*",
    ...params,
  });
};
