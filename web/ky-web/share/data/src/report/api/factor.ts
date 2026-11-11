import { request } from "comm/request";
import type * as Protocol from "../types/factor.d.ts";

export const getUnitList = (
  params: Protocol.GetUnitListReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetUnitListRes>("factor/GetUnitList", params, {
    signal,
  });
export const getUnitList2 = (
  params: Protocol.GetUnitList2Req,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetUnitList2Res>("factor/GetUnitList2", params, {
    signal,
  });

export const retrieveFactorList = (params: Protocol.RetrieveFactorListReq) =>
  request.post<Protocol.RetrieveFactorListRes>(
    "factor/RetrieveFactorList",
    params,
  );

export const retrieveUnitList = (
  params: Protocol.RetrieveUnitListReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.RetrieveUnitListRes>(
    "factor/RetrieveUnitList",
    params,
    { signal },
  );
export const getUnitProperty = (
  params: Protocol.GetUnitPropertyReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetUnitPropertyRes>("factor/GetUnitProperty", params, {
    signal,
  });
