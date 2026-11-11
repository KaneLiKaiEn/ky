import type { ApiResult } from "./comm";

export interface EmployeeRow {
  employee_id?: number;
  employee_no?: string;
  employee_name?: string;
  kb_code?: string;
}

export interface RetrieveEmployeeListReq {
  org_id?: number;
  dept_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  work_type?: string;
  work_title?: string;
  work_level?: string;
  column_list?: string;
}

export interface RetrieveEmployeeListRes extends ApiResult {
  employee_list?: EmployeeRow[];
}

export interface GetEmployeePropertyReq {
  employee_id?: number;
  employee_no?: string;
  column_list?: string;
}

export interface GetEmployeePropertyRes extends ApiResult {
  employee_property?: EmployeeRow;
}
