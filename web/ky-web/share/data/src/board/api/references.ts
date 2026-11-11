import { request } from "comm/request";
import type * as Protocol from "../types/references.d.ts";

export const getDatasetList = (params: Protocol.GetDatasetListReq) =>
  request.post<Protocol.GetDatasetListRes>("dataset/GetDatasetList", params);

export const getDatasetProperty = (params: Protocol.GetDatasetPropertyReq) =>
  request.post<Protocol.GetDatasetPropertyRes>(
    "dataset/GetDatasetProperty",
    params,
  );

export const retrieveRoleList = (params: Protocol.RetrieveRoleListReq) =>
  request.post<Protocol.RetrieveRoleListRes>("org/RetrieveRoleList", params);

export const retrieveUserList = (params: Protocol.RetrieveUserListReq) =>
  request.post<Protocol.RetrieveUserListRes>("user/RetrieveUserList", params);

export const retrieveMetricList = (params: Protocol.RetrieveMetricListReq) =>
  request.post<Protocol.RetrieveMetricListRes>(
    "metric/RetrieveMetricList",
    params,
  );

export const retrieveReportList = (params: Protocol.RetrieveReportListReq) =>
  request.post<Protocol.RetrieveReportListRes>(
    "report/RetrieveReportList",
    params,
  );

export const readFile = (params: Protocol.ReadReq) =>
  request.post<Protocol.ReadRes>("file/Read", params);

export const writeFile = (params: Protocol.WriteReq) =>
  request.post<Protocol.WriteRes>("file/Write", params);

export const getDatasetArgOption = (params: Protocol.GetDatasetArgOptionReq) =>
  request.post<Protocol.GetDatasetArgOptionRes>(
    "dataset/GetDatasetArgOption",
    params,
  );
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
