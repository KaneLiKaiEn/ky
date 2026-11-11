import { request } from "comm/request";
import { assertOrganizationResult } from "./organizationResult";
import type {
  DeleteBranchReq,
  DeleteBranchRes,
  DeleteOrgReq,
  DeleteOrgRes,
  DeleteRoleReq,
  DeleteRoleRes,
  GetBranchListReq,
  GetBranchListRes,
  GetBranchPropertyReq,
  GetBranchPropertyRes,
  GetDeptListReq,
  GetDeptListRes,
  GetDeptPropertyReq,
  GetDeptPropertyRes,
  GetOrgListReq,
  GetOrgListRes,
  GetOrgPropertyReq,
  GetOrgPropertyRes,
  GetRoleListReq,
  GetRoleListRes,
  GetRolePropertyReq,
  GetRolePropertyRes,
  RetrieveRoleListReq,
  RetrieveRoleListRes,
  NewBranchReq,
  NewBranchRes,
  NewOrgReq,
  NewOrgRes,
  NewRoleReq,
  NewRoleRes,
  RolePropertyData,
  SaveBranchPropertyReq,
  SaveBranchPropertyRes,
  SaveOrgPropertyReq,
  SaveOrgPropertyRes,
  SaveRolePropertyReq,
  SaveRolePropertyRes,
  NewDeptReq,
  NewDeptRes,
  SaveDeptPropertyReq,
  DeleteDeptReq,
  GetDeptLinkListReq,
  GetDeptLinkListRes,
  SaveDeptLinkListReq,
} from "@/types/org";
import type { ApiResult } from "@/types/comm";

// 检索角色列表
export const retrieveRoleList = (params: RetrieveRoleListReq) => {
  return request.post<RetrieveRoleListRes>("org/RetrieveRoleList", params);
};

export const getOrgList = (params: GetOrgListReq = {}) => {
  return request.post<GetOrgListRes>("org/GetOrgList", params);
};

export const getOrgProperty = (params: GetOrgPropertyReq) =>
  request.post<GetOrgPropertyRes>("org/GetOrgProperty", {
    column_list: "*",
    ...params,
  });

export const newOrg = (params: NewOrgReq) =>
  request.post<NewOrgRes>("org/NewOrg", params).then(assertOrganizationResult);

export const saveOrgProperty = (params: SaveOrgPropertyReq) =>
  request.post<SaveOrgPropertyRes>("org/SaveOrgProperty", params).then(assertOrganizationResult);

export const deleteOrg = (params: DeleteOrgReq) =>
  request.post<DeleteOrgRes>("org/DeleteOrg", params).then(assertOrganizationResult);

export const getBranchList = (params: GetBranchListReq) =>
  request.post<GetBranchListRes>("org/GetBranchList", {
    column_list: "*",
    ...params,
  });

export const getBranchProperty = (params: GetBranchPropertyReq) =>
  request.post<GetBranchPropertyRes>("org/GetBranchProperty", {
    column_list: "*",
    ...params,
  });

export const newBranch = (params: NewBranchReq) =>
  request.post<NewBranchRes>("org/NewBranch", params).then(assertOrganizationResult);

export const saveBranchProperty = (params: SaveBranchPropertyReq) =>
  request.post<SaveBranchPropertyRes>("org/SaveBranchProperty", params).then(assertOrganizationResult);

export const deleteBranch = (params: DeleteBranchReq) =>
  request.post<DeleteBranchRes>("org/DeleteBranch", params).then(assertOrganizationResult);

export const getDeptList = (params: GetDeptListReq) => {
  return request.post<GetDeptListRes>("org/GetDeptList", {
    column_list: "*",
    ...params,
  });
};

export const getDeptProperty = (params: GetDeptPropertyReq) => {
  return request.post<GetDeptPropertyRes>("org/GetDeptProperty", {
    column_list: "*",
    ...params,
  });
};

export const newDept = (params: NewDeptReq) =>
  request.post<NewDeptRes>("org/NewDept", params).then(assertOrganizationResult);

export const saveDeptProperty = (params: SaveDeptPropertyReq) =>
  request.post<ApiResult>("org/SaveDeptProperty", params).then(assertOrganizationResult);

export const deleteDept = (params: DeleteDeptReq) =>
  request.post<ApiResult>("org/DeleteDept", params).then(assertOrganizationResult);

export const getDeptLinkList = (params: GetDeptLinkListReq) =>
  request.post<GetDeptLinkListRes>("org/GetDeptLinkList", {
    link_type: "*",
    column_list: "*",
    ...params,
  });

export const saveDeptLinkList = (params: SaveDeptLinkListReq) =>
  request.post<ApiResult>("org/SaveDeptLinkList", params).then(assertOrganizationResult);

export const getRoleList = (params: GetRoleListReq) => {
  return request.post<GetRoleListRes>("org/GetRoleList", params);
};

export const getRoleProperty = (params: GetRolePropertyReq) =>
  request.post<GetRolePropertyRes>("org/GetRoleProperty", {
    column_list: "*",
    ...params,
  });

const rolePropertyData = (property: RolePropertyData): RolePropertyData => ({
  org_id: property.org_id,
  role_name: property.role_name,
  role_note: property.role_note,
  role_tag: property.role_tag,
  sort_no: property.sort_no,
});

export const newRole = (params: NewRoleReq) =>
  request.post<NewRoleRes>("org/NewRole", rolePropertyData(params));

export const saveRoleProperty = (params: SaveRolePropertyReq) =>
  request.post<SaveRolePropertyRes>("org/SaveRoleProperty", {
    role_id: params.role_id,
    role_property: rolePropertyData(params.role_property),
  });

export const deleteRole = (params: DeleteRoleReq) =>
  request.post<DeleteRoleRes>("org/DeleteRole", {
    role_id: params.role_id,
    delete_note: params.delete_note,
  });
