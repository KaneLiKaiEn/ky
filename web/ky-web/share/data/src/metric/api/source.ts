import type { GetSourceListReq, GetSourceListRes } from "../types/source.d.ts";
import { request } from "comm/request";

export const getSourceList = (params: GetSourceListReq) => {
  return request.post<GetSourceListRes>("source/GetSourceList", params);
};

import type * as ManagementProtocol from "../types/source.d.ts";

export const newSource = (params: ManagementProtocol.NewSourceReq) => {
  return request.post<ManagementProtocol.NewSourceRes>(
    "source/NewSource",
    params,
  );
};

export const deleteSource = (params: ManagementProtocol.DeleteSourceReq) => {
  return request.post<ManagementProtocol.DeleteSourceRes>(
    "source/DeleteSource",
    params,
  );
};

export const getSourceProperty = (
  params: ManagementProtocol.GetSourcePropertyReq,
) => {
  return request.post<ManagementProtocol.GetSourcePropertyRes>(
    "source/GetSourceProperty",
    params,
  );
};

export const saveSourceProperty = (
  params: ManagementProtocol.SaveSourcePropertyReq,
) => {
  return request.post<ManagementProtocol.SaveSourcePropertyRes>(
    "source/SaveSourceProperty",
    params,
  );
};

export const getDriverList = (params: ManagementProtocol.GetDriverListReq) => {
  return request.post<ManagementProtocol.GetDriverListRes>(
    "source/GetDriverList",
    params,
  );
};

export const testSource = (params: ManagementProtocol.TestReq) => {
  return request.post<ManagementProtocol.TestRes>("source/Test", params);
};
