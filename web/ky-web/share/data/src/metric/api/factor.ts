import type * as Unit from "../types/factor.d.ts";

export const getUserOwnerList = (
  params: Unit.GetUserOwnerListReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetUserOwnerListRes>(
    "factor/GetUserOwnerList",
    params,
    { signal },
  );
};
export const newUserOwner = (params: Unit.NewUserOwnerReq) => {
  return request.post<Unit.NewUserOwnerRes>("factor/NewUserOwner", params);
};
export const deleteUserOwner = (params: Unit.DeleteUserOwnerReq) => {
  return request.post<Unit.DeleteUserOwnerRes>(
    "factor/DeleteUserOwner",
    params,
  );
};
export const getUserOwnerProperty = (
  params: Unit.GetUserOwnerPropertyReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetUserOwnerPropertyRes>(
    "factor/GetUserOwnerProperty",
    params,
    { signal },
  );
};
export const saveUserOwnerProperty = (
  params: Unit.SaveUserOwnerPropertyReq,
) => {
  return request.post<Unit.SaveUserOwnerPropertyRes>(
    "factor/SaveUserOwnerProperty",
    params,
  );
};
import type {
  RetrieveFactorListReq,
  RetrieveFactorListRes,
  RetrieveUnitListReq,
  RetrieveUnitListRes,
} from "../types/factor.d.ts";
import { request } from "comm/request";

export const getEntityList = (
  params: Unit.GetEntityListReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetEntityListRes>("factor/GetEntityList", params, {
    signal,
  });
};
export const getEntityList2 = (
  params: Unit.GetEntityList2Req,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetEntityList2Res>("factor/GetEntityList2", params, {
    signal,
  });
};
export const getEntityProperty = (
  params: Unit.GetEntityPropertyReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetEntityPropertyRes>(
    "factor/GetEntityProperty",
    params,
    { signal },
  );
};
export const saveEntityProperty = (params: Unit.SaveEntityPropertyReq) => {
  return request.post<Unit.SaveEntityPropertyRes>(
    "factor/SaveEntityProperty",
    params,
  );
};
export const getEntityAuthList = (
  params: Unit.GetEntityAuthListReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetEntityAuthListRes>(
    "factor/GetEntityAuthList",
    params,
    { signal },
  );
};
export const saveEntityAuthList = (params: Unit.SaveEntityAuthListReq) => {
  return request.post<Unit.SaveEntityAuthListRes>(
    "factor/SaveEntityAuthList",
    params,
  );
};
export const getEntityUnitList = (
  params: Unit.GetEntityUnitListReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetEntityUnitListRes>(
    "factor/GetEntityUnitList",
    params,
    { signal },
  );
};
export const saveEntityUnitList = (params: Unit.SaveEntityUnitListReq) => {
  return request.post<Unit.SaveEntityUnitListRes>(
    "factor/SaveEntityUnitList",
    params,
  );
};

export const retrieveFactorList = (
  params: RetrieveFactorListReq,
  signal?: AbortSignal,
) => {
  return request.post<RetrieveFactorListRes>(
    "factor/RetrieveFactorList",
    params,
    { signal },
  );
};

export const retrieveUnitList = (
  params: RetrieveUnitListReq,
  signal?: AbortSignal,
) => {
  return request.post<RetrieveUnitListRes>("factor/RetrieveUnitList", params, {
    signal,
  });
};

export const getUnitList = (
  params: Unit.GetUnitListReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetUnitListRes>("factor/GetUnitList", params, {
    signal,
  });
};
export const getUnitList2 = (
  params: Unit.GetUnitList2Req,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetUnitList2Res>("factor/GetUnitList2", params, {
    signal,
  });
};
export const initUnit = (params: Unit.InitUnitReq) => {
  return request.post<Unit.InitUnitRes>("factor/InitUnit", params);
};
export const newUnit = (params: Unit.NewUnitReq) => {
  return request.post<Unit.NewUnitRes>("factor/NewUnit", params);
};
export const deleteUnit = (params: Unit.DeleteUnitReq) => {
  return request.post<Unit.DeleteUnitRes>("factor/DeleteUnit", params);
};
export const getUnitProperty = (
  params: Unit.GetUnitPropertyReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetUnitPropertyRes>(
    "factor/GetUnitProperty",
    params,
    { signal },
  );
};
export const saveUnitProperty = (params: Unit.SaveUnitPropertyReq) => {
  return request.post<Unit.SaveUnitPropertyRes>(
    "factor/SaveUnitProperty",
    params,
  );
};
export const retrieveEntityList = (
  params: Unit.RetrieveEntityListReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.RetrieveEntityListRes>(
    "factor/RetrieveEntityList",
    params,
    { signal },
  );
};
export const getUnitEntityList = (
  params: Unit.GetUnitEntityListReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetUnitEntityListRes>(
    "factor/GetUnitEntityList",
    params,
    { signal },
  );
};
export const saveUnitEntityList = (params: Unit.SaveUnitEntityListReq) => {
  return request.post<Unit.SaveUnitEntityListRes>(
    "factor/SaveUnitEntityList",
    params,
  );
};
export const syncUnitEntityList = (params: Unit.SyncUnitEntityListReq) => {
  return request.post<Unit.SyncUnitEntityListRes>(
    "factor/SyncUnitEntityList",
    params,
  );
};
export const getUnitAuthList = (
  params: Unit.GetUnitAuthListReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetUnitAuthListRes>(
    "factor/GetUnitAuthList",
    params,
    { signal },
  );
};
export const saveUnitAuthList = (params: Unit.SaveUnitAuthListReq) => {
  return request.post<Unit.SaveUnitAuthListRes>(
    "factor/SaveUnitAuthList",
    params,
  );
};
export const getUnitUserList = (
  params: Unit.GetUnitUserListReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetUnitUserListRes>(
    "factor/GetUnitUserList",
    params,
    { signal },
  );
};
export const saveUnitUserList = (params: Unit.SaveUnitUserListReq) => {
  return request.post<Unit.SaveUnitUserListRes>(
    "factor/SaveUnitUserList",
    params,
  );
};
export const getUnitBackground = (
  params: Unit.GetUnitBackgroundReq,
  signal?: AbortSignal,
) => {
  return request.post<Unit.GetUnitBackgroundRes>(
    "factor/GetUnitBackground",
    params,
    { signal },
  );
};
export const saveUnitBackground = (params: Unit.SaveUnitBackgroundReq) => {
  return request.post<Unit.SaveUnitBackgroundRes>(
    "factor/SaveUnitBackground",
    params,
  );
};

import type * as FactorProtocol from "../types/factor.d.ts";

export const getFactorList = (
  params: FactorProtocol.GetFactorListReq,
  signal?: AbortSignal,
) => {
  return request.post<FactorProtocol.GetFactorListRes>(
    "factor/GetFactorList",
    params,
    { signal },
  );
};

export const newFactor = (params: FactorProtocol.NewFactorReq) => {
  return request.post<FactorProtocol.NewFactorRes>("factor/NewFactor", params);
};

export const deleteFactor = (params: FactorProtocol.DeleteFactorReq) => {
  return request.post<FactorProtocol.DeleteFactorRes>(
    "factor/DeleteFactor",
    params,
  );
};

export const getFactorProperty = (
  params: FactorProtocol.GetFactorPropertyReq,
  signal?: AbortSignal,
) => {
  return request.post<FactorProtocol.GetFactorPropertyRes>(
    "factor/GetFactorProperty",
    params,
    { signal },
  );
};

export const saveFactorProperty = (
  params: FactorProtocol.SaveFactorPropertyReq,
) => {
  return request.post<FactorProtocol.SaveFactorPropertyRes>(
    "factor/SaveFactorProperty",
    params,
  );
};

export const getFactorSourceList = (
  params: FactorProtocol.GetFactorSourceListReq,
  signal?: AbortSignal,
) => {
  return request.post<FactorProtocol.GetFactorSourceListRes>(
    "factor/GetFactorSourceList",
    params,
    { signal },
  );
};

export const saveFactorSourceList = (
  params: FactorProtocol.SaveFactorSourceListReq,
) => {
  return request.post<FactorProtocol.SaveFactorSourceListRes>(
    "factor/SaveFactorSourceList",
    params,
  );
};

export const getPumpProperty = (
  params: FactorProtocol.GetPumpPropertyReq,
  signal?: AbortSignal,
) => {
  return request.post<FactorProtocol.GetPumpPropertyRes>(
    "factor/GetPumpProperty",
    params,
    { signal },
  );
};

export const savePumpProperty = (
  params: FactorProtocol.SavePumpPropertyReq,
) => {
  return request.post<FactorProtocol.SavePumpPropertyRes>(
    "factor/SavePumpProperty",
    params,
  );
};

export const getPumpAdminList = (
  params: FactorProtocol.GetPumpAdminListReq,
  signal?: AbortSignal,
) => {
  return request.post<FactorProtocol.GetPumpAdminListRes>(
    "factor/GetPumpAdminList",
    params,
    { signal },
  );
};

export const savePumpAdminList = (
  params: FactorProtocol.SavePumpAdminListReq,
) => {
  return request.post<FactorProtocol.SavePumpAdminListRes>(
    "factor/SavePumpAdminList",
    params,
  );
};

export const pumpFactor = (params: FactorProtocol.PumpFactorReq) => {
  return request.post<FactorProtocol.PumpFactorRes>(
    "factor/PumpFactor",
    params,
  );
};

export const getPumpLogList = (
  params: FactorProtocol.GetPumpLogListReq,
  signal?: AbortSignal,
) => {
  return request.post<FactorProtocol.GetPumpLogListRes>(
    "factor/GetPumpLogList",
    params,
    { signal },
  );
};

export const getPumpTaskList = (
  params: FactorProtocol.GetPumpTaskListReq,
  signal?: AbortSignal,
) => {
  return request.post<FactorProtocol.GetPumpTaskListRes>(
    "factor/GetPumpTaskList",
    params,
    { signal },
  );
};

// Read/write protocols used by MetricPreview; requests preserve talk field names.

export const getUnitTypeList = (
  params: FactorProtocol.GetUnitTypeListReq,
  signal?: AbortSignal,
) =>
  request.post<FactorProtocol.GetUnitTypeListRes>(
    "factor/GetUnitTypeList",
    params,
    { signal },
  );

export const getFactorProperty2 = (
  params: FactorProtocol.GetFactorProperty2Req,
  signal?: AbortSignal,
) =>
  request.post<FactorProtocol.GetFactorProperty2Res>(
    "factor/GetFactorProperty2",
    params,
    { signal },
  );

export const getFactorValueList = (
  params: FactorProtocol.GetFactorValueListReq,
  signal?: AbortSignal,
) =>
  request.post<FactorProtocol.GetFactorValueListRes>(
    "factor/GetFactorValueList",
    params,
    { signal },
  );

export const getGroupList = (
  params: FactorProtocol.GetGroupListReq,
  signal?: AbortSignal,
) =>
  request.post<FactorProtocol.GetGroupListRes>("factor/GetGroupList", params, {
    signal,
  });

export const getGroupUserList = (
  params: FactorProtocol.GetGroupUserListReq,
  signal?: AbortSignal,
) =>
  request.post<FactorProtocol.GetGroupUserListRes>(
    "factor/GetGroupUserList",
    params,
    { signal },
  );
