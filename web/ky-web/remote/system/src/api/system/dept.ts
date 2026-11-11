import { request } from "comm/request";

export interface DeptDTO {
  id: number;
  parentId: number;
  deptName: string;
  orderNum?: number;
  leaderName?: string;
  phone?: string;
  email?: string;
  status: number;
  statusStr?: string;
  createTime?: string;
}

/** AddDeptCommand / UpdateDeptCommand */
export interface DeptCommand {
  deptId?: number;
  parentId: number;
  deptName: string;
  orderNum: number;
  leaderName?: string;
  phone?: string;
  email?: string;
  status: number;
}

export const getDeptList = () => request.get<DeptDTO[]>("/system/depts");

export const getDeptInfo = (deptId: number) =>
  request.get<DeptDTO>(`/system/dept/${deptId}`);

export const addDept = (data: DeptCommand) =>
  request.post<void>("/system/dept", data);

export const updateDept = (deptId: number, data: DeptCommand) =>
  request.put<void>(`/system/dept/${deptId}`, { ...data, deptId });

export const deleteDept = (deptId: number) =>
  request.delete<void>(`/system/dept/${deptId}`);
