/** 与 problem.proto（care.CareProblem）对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface CareProblemRow {
  problem_id?: number;
  visit_id?: number;
  item_id?: number;
  item_name?: string;
  end_time?: string;
}

export interface GetCareProblemListReq {
  visit_id: number;
  baby_id?: number;
  column_list?: string;
}

export interface GetCareProblemListRes extends ApiResult {
  row_list?: CareProblemRow[];
}

export interface NewCareProblemAssessReq {
  problem_id: number;
  assess_time?: string;
  assess_value?: number;
  assess_desc?: string;
  assess_tag?: string;
}

export interface NewCareProblemAssessRes extends ApiResult {
  assess_id?: number;
}
