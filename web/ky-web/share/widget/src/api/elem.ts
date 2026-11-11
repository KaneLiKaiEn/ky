import { request } from "comm/request";
import type {
  GetElemProperty2Req,
  GetElemProperty2Res,
} from "@/types/elem";

// 获取元素属性
export const getElemProperty2 = (params: GetElemProperty2Req) => {
  return request.post<GetElemProperty2Res>("elem/GetElemProperty2", params);
};