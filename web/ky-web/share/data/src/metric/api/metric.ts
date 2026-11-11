import type {
  CopyUserFavoriteListReq,
  CopyUserFavoriteListRes,
  DeleteLibReq,
  DeleteLibRes,
  DeleteMetricReq,
  DeleteMetricRes,
  GetLibListReq,
  GetLibListRes,
  GetLibPropertyReq,
  GetLibPropertyRes,
  GetMetricAdminListReq,
  GetMetricAdminListRes,
  GetMetricAliasListReq,
  GetMetricAliasListRes,
  GetMetricAuthListReq,
  GetMetricAuthListRes,
  GetMetricCalcListReq,
  GetMetricCalcListRes,
  GetMetricChildListReq,
  GetMetricChildListRes,
  GetMetricFavoriteList2Req,
  GetMetricFavoriteList2Res,
  GetMetricFavoriteListReq,
  GetMetricFavoriteListRes,
  GetMetricGoalListReq,
  GetMetricGoalListRes,
  GetMetricLinkListReq,
  GetMetricLinkListRes,
  GetMetricListReq,
  GetMetricListRes,
  GetMetricOrgListReq,
  GetMetricOrgListRes,
  GetMetricPropertyReq,
  GetMetricPropertyRes,
  GetMetricShortcutListReq,
  GetMetricShortcutListRes,
  GetMetricVarListReq,
  GetMetricVarListRes,
  IsMetricSupportTodayReq,
  IsMetricSupportTodayRes,
  NewLibReq,
  NewLibRes,
  NewMetricReq,
  NewMetricRes,
  RetrieveMetricListReq,
  RetrieveMetricListRes,
  SaveLibPropertyReq,
  SaveLibPropertyRes,
  SaveMetricAdminListReq,
  SaveMetricAdminListRes,
  SaveMetricAliasListReq,
  SaveMetricAliasListRes,
  SaveMetricAuthListReq,
  SaveMetricAuthListRes,
  SaveMetricCalcListReq,
  SaveMetricCalcListRes,
  SaveMetricChildListReq,
  SaveMetricChildListRes,
  SaveMetricFavoriteListReq,
  SaveMetricFavoriteListRes,
  SaveMetricGoalListReq,
  SaveMetricGoalListRes,
  SaveMetricLinkListReq,
  SaveMetricLinkListRes,
  SaveMetricOrgListReq,
  SaveMetricOrgListRes,
  SaveMetricPropertyReq,
  SaveMetricPropertyRes,
  SaveMetricShortcutListReq,
  SaveMetricShortcutListRes,
  SaveMetricVarListReq,
  SaveMetricVarListRes,
} from "../types/metric.d.ts";
import { request } from "comm/request";

export const getLibList = (params: GetLibListReq, signal?: AbortSignal) => {
  return request.post<GetLibListRes>("metric/GetLibList", params, { signal });
};

export const newLib = (params: NewLibReq) => {
  return request.post<NewLibRes>("metric/NewLib", params);
};

export const deleteLib = (params: DeleteLibReq) => {
  return request.post<DeleteLibRes>("metric/DeleteLib", params);
};

export const getLibProperty = (
  params: GetLibPropertyReq,
  signal?: AbortSignal,
) => {
  return request.post<GetLibPropertyRes>("metric/GetLibProperty", params, {
    signal,
  });
};

export const saveLibProperty = (params: SaveLibPropertyReq) => {
  return request.post<SaveLibPropertyRes>("metric/SaveLibProperty", params);
};

export const getMetricList = (
  params: GetMetricListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricListRes>("metric/GetMetricList", params, {
    signal,
  });
};

export const retrieveMetricList = (
  params: RetrieveMetricListReq,
  signal?: AbortSignal,
) => {
  return request.post<RetrieveMetricListRes>(
    "metric/RetrieveMetricList",
    params,
    { signal },
  );
};

export const newMetric = (params: NewMetricReq) => {
  return request.post<NewMetricRes>("metric/NewMetric", params);
};

export const deleteMetric = (params: DeleteMetricReq) => {
  return request.post<DeleteMetricRes>("metric/DeleteMetric", params);
};

export const getMetricProperty = (
  params: GetMetricPropertyReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricPropertyRes>(
    "metric/GetMetricProperty",
    params,
    { signal },
  );
};

export const saveMetricProperty = (params: SaveMetricPropertyReq) => {
  return request.post<SaveMetricPropertyRes>(
    "metric/SaveMetricProperty",
    params,
  );
};

export const isMetricSupportToday = (
  params: IsMetricSupportTodayReq,
  signal?: AbortSignal,
) => {
  return request.post<IsMetricSupportTodayRes>(
    "metric/IsMetricSupportToday",
    params,
    { signal },
  );
};

export const getMetricFavoriteList2 = (
  params: GetMetricFavoriteList2Req,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricFavoriteList2Res>(
    "metric/GetMetricFavoriteList2",
    params,
    { signal },
  );
};

export const copyUserFavoriteList = (params: CopyUserFavoriteListReq) => {
  return request.post<CopyUserFavoriteListRes>(
    "metric/CopyUserFavoriteList",
    params,
  );
};

export const getMetricVarList = (
  params: GetMetricVarListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricVarListRes>("metric/GetMetricVarList", params, {
    signal,
  });
};

export const saveMetricVarList = (params: SaveMetricVarListReq) => {
  return request.post<SaveMetricVarListRes>("metric/SaveMetricVarList", params);
};

export const getMetricCalcList = (
  params: GetMetricCalcListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricCalcListRes>(
    "metric/GetMetricCalcList",
    params,
    { signal },
  );
};

export const saveMetricCalcList = (params: SaveMetricCalcListReq) => {
  return request.post<SaveMetricCalcListRes>(
    "metric/SaveMetricCalcList",
    params,
  );
};

export const getMetricGoalList = (
  params: GetMetricGoalListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricGoalListRes>(
    "metric/GetMetricGoalList",
    params,
    { signal },
  );
};

export const saveMetricGoalList = (params: SaveMetricGoalListReq) => {
  return request.post<SaveMetricGoalListRes>(
    "metric/SaveMetricGoalList",
    params,
  );
};

export const getMetricChildList = (
  params: GetMetricChildListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricChildListRes>(
    "metric/GetMetricChildList",
    params,
    { signal },
  );
};

export const saveMetricChildList = (params: SaveMetricChildListReq) => {
  return request.post<SaveMetricChildListRes>(
    "metric/SaveMetricChildList",
    params,
  );
};

export const getMetricLinkList = (
  params: GetMetricLinkListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricLinkListRes>(
    "metric/GetMetricLinkList",
    params,
    { signal },
  );
};

export const saveMetricLinkList = (params: SaveMetricLinkListReq) => {
  return request.post<SaveMetricLinkListRes>(
    "metric/SaveMetricLinkList",
    params,
  );
};

export const getMetricOrgList = (
  params: GetMetricOrgListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricOrgListRes>("metric/GetMetricOrgList", params, {
    signal,
  });
};

export const saveMetricOrgList = (params: SaveMetricOrgListReq) => {
  return request.post<SaveMetricOrgListRes>("metric/SaveMetricOrgList", params);
};

export const getMetricAuthList = (
  params: GetMetricAuthListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricAuthListRes>(
    "metric/GetMetricAuthList",
    params,
    { signal },
  );
};

export const saveMetricAuthList = (params: SaveMetricAuthListReq) => {
  return request.post<SaveMetricAuthListRes>(
    "metric/SaveMetricAuthList",
    params,
  );
};

export const getMetricAdminList = (
  params: GetMetricAdminListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricAdminListRes>(
    "metric/GetMetricAdminList",
    params,
    { signal },
  );
};

export const saveMetricAdminList = (params: SaveMetricAdminListReq) => {
  return request.post<SaveMetricAdminListRes>(
    "metric/SaveMetricAdminList",
    params,
  );
};

export const getMetricAliasList = (
  params: GetMetricAliasListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricAliasListRes>(
    "metric/GetMetricAliasList",
    params,
    { signal },
  );
};

export const saveMetricAliasList = (params: SaveMetricAliasListReq) => {
  return request.post<SaveMetricAliasListRes>(
    "metric/SaveMetricAliasList",
    params,
  );
};

export const getMetricShortcutList = (
  params: GetMetricShortcutListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricShortcutListRes>(
    "metric/GetMetricShortcutList",
    params,
    { signal },
  );
};

export const saveMetricShortcutList = (params: SaveMetricShortcutListReq) => {
  return request.post<SaveMetricShortcutListRes>(
    "metric/SaveMetricShortcutList",
    params,
  );
};

export const getMetricFavoriteList = (
  params: GetMetricFavoriteListReq,
  signal?: AbortSignal,
) => {
  return request.post<GetMetricFavoriteListRes>(
    "metric/GetMetricFavoriteList",
    params,
    { signal },
  );
};

export const saveMetricFavoriteList = (params: SaveMetricFavoriteListReq) => {
  return request.post<SaveMetricFavoriteListRes>(
    "metric/SaveMetricFavoriteList",
    params,
  );
};

import type * as ManagementProtocol from "../types/metric.d.ts";

export const getAuthMetricList = (
  params: ManagementProtocol.GetAuthMetricListReq,
  signal?: AbortSignal,
) => {
  return request.post<ManagementProtocol.GetAuthMetricListRes>(
    "metric/GetAuthMetricList",
    params,
    { signal },
  );
};
export const saveAuthMetricList = (
  params: ManagementProtocol.SaveAuthMetricListReq,
) => {
  return request.post<ManagementProtocol.SaveAuthMetricListRes>(
    "metric/SaveAuthMetricList",
    params,
  );
};
export const getUserDefault = (
  params: ManagementProtocol.GetUserDefaultReq,
  signal?: AbortSignal,
) => {
  return request.post<ManagementProtocol.GetUserDefaultRes>(
    "metric/GetUserDefault",
    params,
    { signal },
  );
};
export const saveUserDefault = (
  params: ManagementProtocol.SaveUserDefaultReq,
) => {
  return request.post<ManagementProtocol.SaveUserDefaultRes>(
    "metric/SaveUserDefault",
    params,
  );
};
export const getRoleDefault = (
  params: ManagementProtocol.GetRoleDefaultReq,
  signal?: AbortSignal,
) => {
  return request.post<ManagementProtocol.GetRoleDefaultRes>(
    "metric/GetRoleDefault",
    params,
    { signal },
  );
};
export const saveRoleDefault = (
  params: ManagementProtocol.SaveRoleDefaultReq,
) => {
  return request.post<ManagementProtocol.SaveRoleDefaultRes>(
    "metric/SaveRoleDefault",
    params,
  );
};

export const getMetricsetList = (
  params: ManagementProtocol.GetMetricsetListReq,
  signal?: AbortSignal,
) => {
  return request.post<ManagementProtocol.GetMetricsetListRes>(
    "metric/GetMetricsetList",
    params,
    { signal },
  );
};

export const newMetricset = (params: ManagementProtocol.NewMetricsetReq) => {
  return request.post<ManagementProtocol.NewMetricsetRes>(
    "metric/NewMetricset",
    params,
  );
};

export const deleteMetricset = (
  params: ManagementProtocol.DeleteMetricsetReq,
) => {
  return request.post<ManagementProtocol.DeleteMetricsetRes>(
    "metric/DeleteMetricset",
    params,
  );
};

export const getMetricsetProperty = (
  params: ManagementProtocol.GetMetricsetPropertyReq,
  signal?: AbortSignal,
) => {
  return request.post<ManagementProtocol.GetMetricsetPropertyRes>(
    "metric/GetMetricsetProperty",
    params,
    { signal },
  );
};

export const saveMetricsetProperty = (
  params: ManagementProtocol.SaveMetricsetPropertyReq,
) => {
  return request.post<ManagementProtocol.SaveMetricsetPropertyRes>(
    "metric/SaveMetricsetProperty",
    params,
  );
};

export const getMetricsetItemList = (
  params: ManagementProtocol.GetMetricsetItemListReq,
  signal?: AbortSignal,
) => {
  return request.post<ManagementProtocol.GetMetricsetItemListRes>(
    "metric/GetMetricsetItemList",
    params,
    { signal },
  );
};

export const saveMetricsetItemList = (
  params: ManagementProtocol.SaveMetricsetItemListReq,
) => {
  return request.post<ManagementProtocol.SaveMetricsetItemListRes>(
    "metric/SaveMetricsetItemList",
    params,
  );
};

export const getMetricsetShareList = (
  params: ManagementProtocol.GetMetricsetShareListReq,
  signal?: AbortSignal,
) => {
  return request.post<ManagementProtocol.GetMetricsetShareListRes>(
    "metric/GetMetricsetShareList",
    params,
    { signal },
  );
};

export const saveMetricsetShareList = (
  params: ManagementProtocol.SaveMetricsetShareListReq,
) => {
  return request.post<ManagementProtocol.SaveMetricsetShareListRes>(
    "metric/SaveMetricsetShareList",
    params,
  );
};

export const getShareMetricsetList = (
  params: ManagementProtocol.GetShareMetricsetListReq,
  signal?: AbortSignal,
) => {
  return request.post<ManagementProtocol.GetShareMetricsetListRes>(
    "metric/GetShareMetricsetList",
    params,
    { signal },
  );
};

export const getMetricValueList = (
  params: ManagementProtocol.GetMetricValueListReq,
  signal?: AbortSignal,
) => {
  return request.post<ManagementProtocol.GetMetricValueListRes>(
    "metric/GetMetricValueList",
    params,
    { signal },
  );
};

// Read/write protocols used by MetricPreview; requests preserve talk field names.

export const getArgDefault = (
  params: ManagementProtocol.GetArgDefaultReq,
  signal?: AbortSignal,
) =>
  request.post<ManagementProtocol.GetArgDefaultRes>(
    "metric/GetArgDefault",
    params,
    { signal },
  );

export const getMetricValueList2 = (
  params: ManagementProtocol.GetMetricValueList2Req,
  signal?: AbortSignal,
) =>
  request.post<ManagementProtocol.GetMetricValueList2Res>(
    "metric/GetMetricValueList2",
    params,
    { signal },
  );

export const getMetricTrendList = (
  params: ManagementProtocol.GetMetricTrendListReq,
  signal?: AbortSignal,
) =>
  request.post<ManagementProtocol.GetMetricTrendListRes>(
    "metric/GetMetricTrendList",
    params,
    { signal },
  );

export const getMetricChildList2 = (
  params: ManagementProtocol.GetMetricChildList2Req,
  signal?: AbortSignal,
) =>
  request.post<ManagementProtocol.GetMetricChildList2Res>(
    "metric/GetMetricChildList2",
    params,
    { signal },
  );

export const addMetricFavorite = (
  params: ManagementProtocol.AddMetricFavoriteReq,
  signal?: AbortSignal,
) =>
  request.post<ManagementProtocol.AddMetricFavoriteRes>(
    "metric/AddMetricFavorite",
    params,
    { signal },
  );

export const removeMetricFavorite = (
  params: ManagementProtocol.RemoveMetricFavoriteReq,
  signal?: AbortSignal,
) =>
  request.post<ManagementProtocol.RemoveMetricFavoriteRes>(
    "metric/RemoveMetricFavorite",
    params,
    { signal },
  );

export const getMetricSearchList = (
  params: ManagementProtocol.GetMetricSearchListReq,
  signal?: AbortSignal,
) =>
  request.post<ManagementProtocol.GetMetricSearchListRes>(
    "metric/GetMetricSearchList",
    params,
    { signal },
  );

export const moveMetricFavorite = (
  params: ManagementProtocol.MoveMetricFavoriteReq,
) =>
  request.post<ManagementProtocol.MoveMetricFavoriteRes>(
    "metric/MoveMetricFavorite",
    params,
  );
