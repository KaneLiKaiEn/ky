import { request } from "comm/request";
import type {
  GetRegListReq,
  GetRegListRes,
  GetUserRegListReq,
  GetUserRegListRes,
  SaveUserRegListReq,
  SaveUserRegListRes,
  GetScheduledDeptPropertyReq,
  GetScheduledDeptPropertyRes,
  SaveScheduledDeptPropertyReq,
  DeleteScheduledDeptReq,
  ScheduledDeptMutationRes,
} from "@/types/schedule";

export const getRegList = (params: GetRegListReq = {}) => {
  return request.post<GetRegListRes>("schedule/clinic/GetRegList", params);
};

export const getUserRegList = (params: GetUserRegListReq) => {
  return request.post<GetUserRegListRes>(
    "schedule/clinic/GetUserRegList",
    params,
  );
};

export const saveUserRegList = (params: SaveUserRegListReq) => {
  return request.post<SaveUserRegListRes>(
    "schedule/clinic/SaveUserRegList",
    params,
  );
};

export const getClinicDeptProperty = (params: GetScheduledDeptPropertyReq) =>
  request.post<GetScheduledDeptPropertyRes>(
    "schedule/clinic/GetClinicDeptProperty",
    { column_list: "*", ...params },
  );

export const getEmergencyDeptProperty = (params: GetScheduledDeptPropertyReq) =>
  request.post<GetScheduledDeptPropertyRes>(
    "schedule/emergency/GetEmergencyDeptProperty",
    { column_list: "*", ...params },
  );

export const saveClinicDeptProperty = (params: SaveScheduledDeptPropertyReq) =>
  request.post<ScheduledDeptMutationRes>(
    "schedule/clinic/SaveClinicDeptProperty",
    params,
  );

export const saveEmergencyDeptProperty = (params: SaveScheduledDeptPropertyReq) =>
  request.post<ScheduledDeptMutationRes>(
    "schedule/emergency/SaveEmergencyDeptProperty",
    params,
  );

export const deleteClinicDept = (params: DeleteScheduledDeptReq) =>
  request.post<ScheduledDeptMutationRes>(
    "schedule/clinic/DeleteClinicDept",
    params,
  );

export const deleteEmergencyDept = (params: DeleteScheduledDeptReq) =>
  request.post<ScheduledDeptMutationRes>(
    "schedule/emergency/DeleteEmergencyDept",
    params,
  );
