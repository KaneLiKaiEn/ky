import { request } from "comm/request";
import type {
  ApproveUserDeviceReq,
  ApproveUserDeviceRes,
  DeleteUserReq,
  DeleteUserRes,
  GetRoleUserListReq,
  GetRoleUserListRes,
  GetUserAppReq,
  GetUserAppRes,
  GetUserDeptListReq,
  GetUserDeptListRes,
  GetUserDeviceListReq,
  GetUserDeviceListRes,
  GetUserListReq,
  GetUserListRes,
  GetUserLoginReq,
  GetUserLoginRes,
  GetUserPhotoReq,
  GetUserPhotoRes,
  GetUserPropertyReq,
  GetUserPropertyRes,
  GetUserRoleListReq,
  GetUserRoleListRes,
  GetUserWriteImageReq,
  GetUserWriteImageRes,
  NewUserReq,
  NewUserRes,
  RetrieveUserListReq,
  RetrieveUserListRes,
  RevokeUserDeviceReq,
  RevokeUserDeviceRes,
  SaveUserAppReq,
  SaveUserAppRes,
  SaveUserDeptListReq,
  SaveUserDeptListRes,
  SaveUserLoginReq,
  SaveUserLoginRes,
  SaveUserPhotoReq,
  SaveUserPhotoRes,
  SaveUserPropertyReq,
  SaveUserPropertyRes,
  SaveUserRoleListReq,
  SaveUserRoleListRes,
  SaveRoleUserListReq,
  SaveRoleUserListRes,
  SaveUserWriteImageReq,
  SaveUserWriteImageRes,
} from "@/types/user";

export const retrieveUserList = (params: RetrieveUserListReq) => {
  return request.post<RetrieveUserListRes>("user/RetrieveUserList", params);
};

export const getUserList = (params: GetUserListReq) => {
  return request.post<GetUserListRes>("user/GetUserList", params);
};

export const getUserProperty = (params: GetUserPropertyReq) => {
  return request.post<GetUserPropertyRes>("user/GetUserProperty", params);
};

export const newUser = (params: NewUserReq) => {
  return request.post<NewUserRes>("user/NewUser", params);
};

export const saveUserProperty = (params: SaveUserPropertyReq) => {
  return request.post<SaveUserPropertyRes>("user/SaveUserProperty", params);
};

export const deleteUser = (params: DeleteUserReq) => {
  return request.post<DeleteUserRes>("user/DeleteUser", params);
};

export const getUserRoleList = (params: GetUserRoleListReq) => {
  return request.post<GetUserRoleListRes>("user/GetUserRoleList", params);
};

export const saveUserRoleList = (params: SaveUserRoleListReq) => {
  return request.post<SaveUserRoleListRes>("user/SaveUserRoleList", params);
};

export const getRoleUserList = (params: GetRoleUserListReq) =>
  request.post<GetRoleUserListRes>("user/GetRoleUserList", {
    column_list: "*",
    ...params,
  });

export const saveRoleUserList = (params: SaveRoleUserListReq) =>
  request.post<SaveRoleUserListRes>("user/SaveRoleUserList", {
    role_id: params.role_id,
    delete_row: params.delete_row,
    user_list: params.user_list,
  });

export const getUserDeptList = (params: GetUserDeptListReq) => {
  return request.post<GetUserDeptListRes>("user/GetUserDeptList", params);
};

export const saveUserDeptList = (params: SaveUserDeptListReq) => {
  return request.post<SaveUserDeptListRes>("user/SaveUserDeptList", params);
};

export const getUserApp = (params: GetUserAppReq) => {
  return request.post<GetUserAppRes>("user/GetUserApp", params);
};

export const saveUserApp = (params: SaveUserAppReq) => {
  return request.post<SaveUserAppRes>("user/SaveUserApp", params);
};

export const getUserLogin = (params: GetUserLoginReq) => {
  return request.post<GetUserLoginRes>("user/GetUserLogin", params);
};

export const saveUserLogin = (params: SaveUserLoginReq) => {
  return request.post<SaveUserLoginRes>("user/SaveUserLogin", params);
};

export const getUserWriteImage = (params: GetUserWriteImageReq) => {
  return request.post<GetUserWriteImageRes>("user/GetUserWriteImage", params);
};

export const saveUserWriteImage = (params: SaveUserWriteImageReq) => {
  return request.post<SaveUserWriteImageRes>("user/SaveUserWriteImage", params);
};

export const getUserPhoto = (params: GetUserPhotoReq) => {
  return request.post<GetUserPhotoRes>("user/GetUserPhoto", params);
};

export const saveUserPhoto = (params: SaveUserPhotoReq) => {
  return request.post<SaveUserPhotoRes>("user/SaveUserPhoto", params);
};

export const getUserDeviceList = (params: GetUserDeviceListReq) => {
  return request.post<GetUserDeviceListRes>("user/GetUserDeviceList", params);
};

export const approveUserDevice = (params: ApproveUserDeviceReq) => {
  return request.post<ApproveUserDeviceRes>("user/ApproveUserDevice", params);
};

export const revokeUserDevice = (params: RevokeUserDeviceReq) => {
  return request.post<RevokeUserDeviceRes>("user/RevokeUserDevice", params);
};
