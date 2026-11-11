import { request } from "comm/request";
import type {
  GetEmployeePropertyReq,
  GetEmployeePropertyRes,
  RetrieveEmployeeListReq,
  RetrieveEmployeeListRes,
} from "@/types/hr";

export const retrieveEmployeeList = (params: RetrieveEmployeeListReq) => {
  return request.post<RetrieveEmployeeListRes>("hr/RetrieveEmployeeList", params);
};

export const getEmployeeProperty = (params: GetEmployeePropertyReq) => {
  return request.post<GetEmployeePropertyRes>("hr/GetEmployeeProperty", params);
};
