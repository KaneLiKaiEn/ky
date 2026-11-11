import { request } from "comm/request";
import type {
  GetElemProperty2Req,
  GetElemProperty2Res,
  GetVisitInitValueReq,
  GetVisitInitValueRes,
  GetElemOptionListReq,
  GetElemOptionListRes,
  GetElemOptionList2Req,
  GetElemOptionList2Res,
  GetElemOptionSubListReq,
  GetElemOptionSubListRes,
} from "@/types/elem";

// 获取元素属性
export const getElemProperty2 = (params: GetElemProperty2Req) => {
  return request.post<GetElemProperty2Res>("elem/GetElemProperty2", params);
};

// 获取就诊数据元初始值
export const getVisitInitValue = (params: GetVisitInitValueReq) => {
  return request.post<GetVisitInitValueRes>("elem/GetVisitInitValue", params);
};

// 获取元素选项列表
export const getElemOptionList = (params: GetElemOptionListReq) => {
  return request.post<GetElemOptionListRes>("elem/GetElemOptionList", params);
};

export const getElemOptionList2 = (params: GetElemOptionList2Req) => {
  return request.post<GetElemOptionList2Res>(
    "elem/GetElemOptionList2",
    params,
  );
};

// 获取元素选项子列表
export const getElemOptionSubList = (params: GetElemOptionSubListReq) => {
  return request.post<GetElemOptionSubListRes>("elem/GetElemOptionSubList", params);
};