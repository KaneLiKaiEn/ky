import { GetParamValueReq, GetParamValueRes } from "@/types/sys";
import { request } from "comm/request";

// 获取参数值
export const getParamValue = (params: GetParamValueReq) => {
    return request.post<GetParamValueRes>("/sys/GetParamValue", params);
  };