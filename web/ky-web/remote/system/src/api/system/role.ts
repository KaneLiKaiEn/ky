import { request } from "comm/request";
import type { PageDTO, PageQuery } from "./common";

export interface RoleQuery extends PageQuery {
  roleName?: string;
  roleKey?: string;
  status?: number;
}

export interface RoleDTO {
  roleId: number;
  roleName: string;
  roleKey: string;
  roleSort: number;
  status: number;
  remark?: string;
  createTime?: string;
  dataScope?: number;
  selectedMenuList?: number[];
  selectedDeptList?: number[];
}

/** AddRoleCommand / UpdateRoleCommand */
export interface RoleCommand {
  roleId?: number;
  roleName: string;
  roleKey: string;
  roleSort: number;
  remark?: string;
  dataScope?: string;
  status?: string;
  menuIds: number[];
}

export const getRoleList = (params: RoleQuery) =>
  request.get<PageDTO<RoleDTO>>("/system/role/list", { params });

export const getRoleInfo = (roleId: number) =>
  request.get<RoleDTO>(`/system/role/${roleId}`);

export const addRole = (data: RoleCommand) =>
  request.post<void>("/system/role", data);

export const updateRole = (data: RoleCommand) =>
  request.put<void>("/system/role", data);

export const deleteRole = (roleId: number) =>
  request.delete<void>(`/system/role/${roleId}`);

export const changeRoleStatus = (roleId: number, status: number) =>
  request.put<void>(`/system/role/${roleId}/status`, { roleId, status });
