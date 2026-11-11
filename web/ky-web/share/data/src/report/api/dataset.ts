import { request } from "comm/request";
import type * as Protocol from "../types/dataset.d.ts";

export const getDatasetArgOption = (
  params: Protocol.GetDatasetArgOptionReq,
  signal?: AbortSignal,
) =>
  request.post<Protocol.GetDatasetArgOptionRes>(
    "dataset/GetDatasetArgOption",
    params,
    { signal },
  );

export const getDatasetList = (params: Protocol.GetDatasetListReq) =>
  request.post<Protocol.GetDatasetListRes>("dataset/GetDatasetList", params);
export const newDataset = (params: Protocol.NewDatasetReq) =>
  request.post<Protocol.NewDatasetRes>("dataset/NewDataset", params);
export const getDatasetProperty = (params: Protocol.GetDatasetPropertyReq) =>
  request.post<Protocol.GetDatasetPropertyRes>(
    "dataset/GetDatasetProperty",
    params,
  );
