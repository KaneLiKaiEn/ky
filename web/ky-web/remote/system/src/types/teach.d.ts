import type { ApiResult } from "./comm";

export interface StudentRow {
  student_id?: number;
  student_no?: string;
  student_name?: string;
  kb_code?: string;
}

export interface RetrieveStudentListReq {
  org_id?: number;
  dept_id?: number;
  retrieve_input?: string;
  retrieve_limit?: number;
  work_type?: string;
  student_type?: string;
  column_list?: string;
}

export interface RetrieveStudentListRes extends ApiResult {
  student_list?: StudentRow[];
}

export interface GetStudentPropertyReq {
  student_id?: number;
  student_no?: string;
  column_list?: string;
}

export interface GetStudentPropertyRes extends ApiResult {
  student_property?: StudentRow;
}
