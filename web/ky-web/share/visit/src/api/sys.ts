import { request } from "comm/request";
import type {
  GetParamValueReq,
  GetParamValueRes,
  RetrieveDict2ItemListReq,
  RetrieveDict2ItemListRes,
  RetrieveDict2ListReq,
  RetrieveDict2ListRes,
} from "@/types/sys";

export const getParamValue = (params: GetParamValueReq) => {
  return request.post<GetParamValueRes>("sys/GetParamValue", params);
};

export const retrieveDict2List = (params: RetrieveDict2ListReq) => {
  return request.post<RetrieveDict2ListRes>("sys/RetrieveDict2List", params);
};

export const retrieveDict2ItemList = (params: RetrieveDict2ItemListReq) => {
  return request.post<RetrieveDict2ItemListRes>("sys/RetrieveDict2ItemList", {
    retrieve_input: "*",
    ...params,
  });
};
// 获取字典列表
export const retrieveDict2Data = (params: any) => {
  return request.post<any>("sys/GetDict2ItemList", params);
};
