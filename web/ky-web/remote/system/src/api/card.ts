import { request } from "comm/request";
import { assertOrganizationResult } from "./organizationResult";
import type {
  GetReaderListReq,
  GetReaderListRes,
  GetOrgReaderListReq,
  GetOrgReaderListRes,
  SaveOrgReaderListReq,
  SaveOrgReaderListRes,
} from "@/types/card";

export const getReaderList = (params: GetReaderListReq = {}) =>
  request.post<GetReaderListRes>("card/GetReaderList", params);

export const getOrgReaderList = (params: GetOrgReaderListReq) =>
  request.post<GetOrgReaderListRes>("card/GetOrgReaderList", {
    column_list: "*",
    ...params,
  });

export const saveOrgReaderList = (params: SaveOrgReaderListReq) =>
  request.post<SaveOrgReaderListRes>("card/SaveOrgReaderList", params).then(assertOrganizationResult);
