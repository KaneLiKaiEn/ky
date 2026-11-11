/** 与 clinic.proto 对齐的类型定义 */

import type { ApiResult } from "./comm";

export interface GetClinicPropertyReq {
  visit_id?: number;
  column_list?: string;
}

export interface ClinicRow {
  visit_id?: number;

  /** 主诉 */
  cc_text?: string;
  /** 症状：[发热][呕吐] */
  cc_symptom?: string;

  /** 主诊断 */
  diag_main?: string;
  /** 主诊断代码：ABC.001 */
  diag_main_code?: string;
  /** 主诊断代码：ABC.001 */
  diag_main_code2?: string;
  diag_main_code_system?: string;
  /** 全部诊断 */
  diag_full?: string;
  /** [CODE1][CODE2] */
  diag_full_code?: string;
  diag_full_code_system?: string;
  diag_text?: string;
  /** 中医全部诊断 */
  tcm_diag_full?: string;
  tcm_diag_text?: string;

  /** 中医主病 */
  bing_main?: string;
  /** 中医主病代码：ABC.001 */
  bing_main_code?: string;
  bing_main_code_system?: string;
  /** 全部病 */
  bing_full?: string;
  /** [CODE1][CODE2] */
  bing_full_code?: string;
  bing_full_code_system?: string;
  bing_text?: string;

  /** 中医主症 */
  zheng_main?: string;
  /** 中医主症代码：ABC.001 */
  zheng_main_code?: string;
  zheng_main_code_system?: string;
  /** 全部病 */
  zheng_full?: string;
  /** [CODE1][CODE2] */
  zheng_full_code?: string;
  zheng_full_code_system?: string;
  zheng_text?: string;

  /** 中医治则治法 */
  zhi_main?: string;
  /** 代码 */
  zhi_main_code?: string;
  zhi_main_code_system?: string;
  /** 全部治则治法 */
  zhi_full?: string;
  /** [CODE1][CODE2] */
  zhi_full_code?: string;
  zhi_full_code_system?: string;
  zhi_text?: string;

  /** 损伤中毒的外部因素 */
  injury_name?: string;
  /** 代码 */
  injury_code?: string;
  injury_code_system?: string;
  /** 病理诊断 */
  pathology_name?: string;
  /** 代码 */
  pathology_code?: string;
  pathology_code_system?: string;

  /** 怀孕日期 */
  pregnancy_date?: string;
  /** 孕次 */
  pregnancy_g?: number;
  /** 产次 */
  pregnancy_p?: number;
  /** 孕妇标识 */
  pregnancy_tag?: string;
  /** 孕妇备注 */
  pregnancy_note?: string;

  /** 肿瘤分期：T */
  cancer_t?: string;
  /** 肿瘤分期：N */
  cancer_n?: string;
  /** 肿瘤分期：M */
  cancer_m?: string;
  /** 肿瘤分期 */
  cancer_stage?: string;
  /** 肿瘤标识 */
  cancer_tag?: string;
  /** 肿瘤备注 */
  cancer_note?: string;

  /** 入院前昏迷时长 */
  coma_before?: number;
  /** 入院后昏迷时长 */
  coma_after?: number;

  health_level?: string;
  care_level?: number;
  care_food?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetClinicPropertyRes extends ApiResult {
  clinic_property?: ClinicRow;
}

export interface NewProblemReq {
  visit_id: number;
  item_id: number;
  item_name?: string;
  problem_body?: string;
  treat_name?: string;
  treat_code?: string;
  treat_code_system?: string;
  begin_time?: string;
  found_time?: string;
}

export interface NewProblemRes extends ApiResult {
  problem_id?: number;
}

export interface ClinicProblemRow {
  problem_id?: number;
  visit_id?: number;
  item_id?: number;
  item_name?: string;
  end_time?: string;
}

export interface GetProblemListReq {
  visit_id: number;
  column_list?: string;
}

export interface GetProblemListRes extends ApiResult {
  row_list?: ClinicProblemRow[];
}

export interface NewProblemAssessReq {
  problem_id: number;
  assess_time?: string;
  assess_value?: string;
  assess_desc?: string;
  assess_tag?: string;
}

export interface NewProblemAssessRes extends ApiResult {
  assess_id?: number;
}
