import { request } from "comm/request";
import { assertOrganizationResult } from "./organizationResult";
import type {
  GetDealerListReq,
  GetDealerListRes,
  GetOrgDealerListReq,
  GetOrgDealerListRes,
  SaveOrgDealerListReq,
  SaveOrgDealerListRes,
} from "@/types/pay";

export const getDealerList = (params: GetDealerListReq = {}) =>
  request.post<GetDealerListRes>("pay/GetDealerList", params);

export const getOrgDealerList = (params: GetOrgDealerListReq) =>
  request.post<GetOrgDealerListRes>("pay/GetOrgDealerList", {
    column_list: "*",
    ...params,
  });

export const saveOrgDealerList = (params: SaveOrgDealerListReq) =>
  request.post<SaveOrgDealerListRes>("pay/SaveOrgDealerList", params).then(assertOrganizationResult);
