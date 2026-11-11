import { request } from "comm/request";
import type {
  GetStudentPropertyReq,
  GetStudentPropertyRes,
  RetrieveStudentListReq,
  RetrieveStudentListRes,
} from "@/types/teach";

export const retrieveStudentList = (params: RetrieveStudentListReq) => {
  return request.post<RetrieveStudentListRes>(
    "teach/RetrieveStudentList",
    params,
  );
};

export const getStudentProperty = (params: GetStudentPropertyReq) => {
  return request.post<GetStudentPropertyRes>("teach/GetStudentProperty", params);
};
