import { request } from "comm/request";
import type {
  GetDiagListReq,
  GetDiagListRes,
  GetVisitPropertyReq,
  GetVisitPropertyRes,
} from "./types";

export const getVisitPropertyAPI = (params: GetVisitPropertyReq) =>
  request.post<GetVisitPropertyRes>("visit/GetVisitProperty", params);

export const getDiagListAPI = (params: GetDiagListReq) =>
  request.post<GetDiagListRes>("diag/GetDiagList", params);
