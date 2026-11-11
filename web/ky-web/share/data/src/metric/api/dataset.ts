import type * as Protocol from "../types/dataset.d.ts";
import { request } from "comm/request";

export const getDatasetList = (params: Protocol.GetDatasetListReq) => {
  return request.post<Protocol.GetDatasetListRes>(
    "dataset/GetDatasetList",
    params,
  );
};

export const newDataset = (params: Protocol.NewDatasetReq) => {
  return request.post<Protocol.NewDatasetRes>("dataset/NewDataset", params);
};

export const deleteDataset = (params: Protocol.DeleteDatasetReq) => {
  return request.post<Protocol.DeleteDatasetRes>(
    "dataset/DeleteDataset",
    params,
  );
};

export const getDatasetProperty = (params: Protocol.GetDatasetPropertyReq) => {
  return request.post<Protocol.GetDatasetPropertyRes>(
    "dataset/GetDatasetProperty",
    params,
  );
};

export const saveDatasetProperty = (
  params: Protocol.SaveDatasetPropertyReq,
) => {
  return request.post<Protocol.SaveDatasetPropertyRes>(
    "dataset/SaveDatasetProperty",
    params,
  );
};

export const getDatasetArgList = (params: Protocol.GetDatasetArgListReq) => {
  return request.post<Protocol.GetDatasetArgListRes>(
    "dataset/GetDatasetArgList",
    params,
  );
};

export const saveDatasetArgList = (params: Protocol.SaveDatasetArgListReq) => {
  return request.post<Protocol.SaveDatasetArgListRes>(
    "dataset/SaveDatasetArgList",
    params,
  );
};

export const getDatasetColList = (params: Protocol.GetDatasetColListReq) => {
  return request.post<Protocol.GetDatasetColListRes>(
    "dataset/GetDatasetColList",
    params,
  );
};

export const saveDatasetColList = (params: Protocol.SaveDatasetColListReq) => {
  return request.post<Protocol.SaveDatasetColListRes>(
    "dataset/SaveDatasetColList",
    params,
  );
};

export const getDatasetTrans = (params: Protocol.GetDatasetTransReq) => {
  return request.post<Protocol.GetDatasetTransRes>(
    "dataset/GetDatasetTrans",
    params,
  );
};

export const saveDatasetTrans = (params: Protocol.SaveDatasetTransReq) => {
  return request.post<Protocol.SaveDatasetTransRes>(
    "dataset/SaveDatasetTrans",
    params,
  );
};

export const getDatasetLocate = (params: Protocol.GetDatasetLocateReq) => {
  return request.post<Protocol.GetDatasetLocateRes>(
    "dataset/GetDatasetLocate",
    params,
  );
};

export const saveDatasetLocate = (params: Protocol.SaveDatasetLocateReq) => {
  return request.post<Protocol.SaveDatasetLocateRes>(
    "dataset/SaveDatasetLocate",
    params,
  );
};

export const testDataset = (params: Protocol.TestDatasetReq) => {
  return request.post<Protocol.TestDatasetRes>("dataset/TestDataset", params);
};

export const expDataset = (params: Protocol.ExpDatasetReq) => {
  return request.post<Protocol.ExpDatasetRes>("dataset/ExpDataset", params);
};

export const impDataset = (params: Protocol.ImpDatasetReq) => {
  return request.post<Protocol.ImpDatasetRes>("dataset/ImpDataset", params);
};

export const getSubsetList = (params: Protocol.GetSubsetListReq) => {
  return request.post<Protocol.GetSubsetListRes>(
    "dataset/GetSubsetList",
    params,
  );
};

export const newSubset = (params: Protocol.NewSubsetReq) => {
  return request.post<Protocol.NewSubsetRes>("dataset/NewSubset", params);
};

export const deleteSubset = (params: Protocol.DeleteSubsetReq) => {
  return request.post<Protocol.DeleteSubsetRes>("dataset/DeleteSubset", params);
};

export const getSubsetProperty = (params: Protocol.GetSubsetPropertyReq) => {
  return request.post<Protocol.GetSubsetPropertyRes>(
    "dataset/GetSubsetProperty",
    params,
  );
};

export const saveSubsetProperty = (params: Protocol.SaveSubsetPropertyReq) => {
  return request.post<Protocol.SaveSubsetPropertyRes>(
    "dataset/SaveSubsetProperty",
    params,
  );
};

export const getSubsetTrans = (params: Protocol.GetSubsetTransReq) => {
  return request.post<Protocol.GetSubsetTransRes>(
    "dataset/GetSubsetTrans",
    params,
  );
};

export const saveSubsetTrans = (params: Protocol.SaveSubsetTransReq) => {
  return request.post<Protocol.SaveSubsetTransRes>(
    "dataset/SaveSubsetTrans",
    params,
  );
};

export const testSubset = (params: Protocol.TestSubsetReq) => {
  return request.post<Protocol.TestSubsetRes>("dataset/TestSubset", params);
};

export const getPumpProperty = (params: Protocol.GetPumpPropertyReq) => {
  return request.post<Protocol.GetPumpPropertyRes>(
    "dataset/GetPumpProperty",
    params,
  );
};

export const savePumpProperty = (params: Protocol.SavePumpPropertyReq) => {
  return request.post<Protocol.SavePumpPropertyRes>(
    "dataset/SavePumpProperty",
    params,
  );
};

export const getPumpAdminList = (params: Protocol.GetPumpAdminListReq) => {
  return request.post<Protocol.GetPumpAdminListRes>(
    "dataset/GetPumpAdminList",
    params,
  );
};

export const savePumpAdminList = (params: Protocol.SavePumpAdminListReq) => {
  return request.post<Protocol.SavePumpAdminListRes>(
    "dataset/SavePumpAdminList",
    params,
  );
};

export const pumpDataset = (params: Protocol.PumpDatasetReq) => {
  return request.post<Protocol.PumpDatasetRes>("dataset/PumpDataset", params);
};

export const getPumpLogList = (params: Protocol.GetPumpLogListReq) => {
  return request.post<Protocol.GetPumpLogListRes>(
    "dataset/GetPumpLogList",
    params,
  );
};

export const getPumpTaskList = (params: Protocol.GetPumpTaskListReq) => {
  return request.post<Protocol.GetPumpTaskListRes>(
    "dataset/GetPumpTaskList",
    params,
  );
};

export const getPostProperty = (params: Protocol.GetPostPropertyReq) => {
  return request.post<Protocol.GetPostPropertyRes>(
    "dataset/GetPostProperty",
    params,
  );
};

export const savePostProperty = (params: Protocol.SavePostPropertyReq) => {
  return request.post<Protocol.SavePostPropertyRes>(
    "dataset/SavePostProperty",
    params,
  );
};

export const postDataset = (params: Protocol.PostDatasetReq) => {
  return request.post<Protocol.PostDatasetRes>("dataset/PostDataset", params);
};

export const getPostLogList = (params: Protocol.GetPostLogListReq) => {
  return request.post<Protocol.GetPostLogListRes>(
    "dataset/GetPostLogList",
    params,
  );
};
