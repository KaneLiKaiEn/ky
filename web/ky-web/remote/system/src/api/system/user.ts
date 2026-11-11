import { request } from "comm/request";
import type { PageDTO, PageQuery } from "./common";
import type { RoleDTO } from "./role";
import type { PostDTO } from "./post";

export interface UserQuery extends PageQuery {
  userId?: number;
  username?: string;
  phoneNumber?: string;
  status?: number;
  deptId?: number;
}

export interface UserDTO {
  userId: number;
  postId?: number;
  postName?: string;
  roleId?: number;
  roleName?: string;
  deptId?: number;
  deptName?: string;
  username: string;
  nickname?: string;
  userType?: number;
  email?: string;
  phoneNumber?: string;
  sex?: number;
  avatar?: string;
  status: number;
  loginIp?: string;
  loginDate?: string;
  creatorName?: string;
  createTime?: string;
  remark?: string;
}

export interface UserDetailDTO {
  user?: UserDTO;
  roleOptions?: RoleDTO[];
  postOptions?: PostDTO[];
  roleId?: number;
  postId?: number;
}

/** AddUserCommand / UpdateUserCommand */
export interface UserCommand {
  userId?: number;
  deptId?: number;
  username: string;
  nickname?: string;
  email?: string;
  phoneNumber?: string;
  sex?: number;
  password?: string;
  status?: number;
  roleId?: number;
  postId?: number;
  remark?: string;
}

export const getUserList = (params: UserQuery) =>
  request.get<PageDTO<UserDTO>>("/system/users", { params });

export const getUserDetail = (userId: number) =>
  request.get<UserDetailDTO>(`/system/users/${userId}`);

export const addUser = (data: UserCommand) =>
  request.post<void>("/system/users", data);

export const updateUser = (userId: number, data: UserCommand) =>
  request.put<void>(`/system/users/${userId}`, { ...data, userId });

export const deleteUsers = (userIds: number[]) =>
  request.delete<void>(`/system/users/${userIds.join(",")}`);

export const resetUserPassword = (userId: number, password: string) =>
  request.put<void>(`/system/users/${userId}/password`, { userId, password });

export const changeUserStatus = (userId: number, status: number) =>
  request.put<void>(`/system/users/${userId}/status`, {
    userId,
    status: String(status),
  });

export const exportUserExcel = (params: UserQuery) =>
  request.download("/system/users/excel", "用户列表.xlsx", { params });
