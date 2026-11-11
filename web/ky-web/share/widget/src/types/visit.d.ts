import type { ApiResult } from "./comm";

export interface VisitRow {
  visit_id?: number;
  patient_id?: number;
  patient_no?: string;
  patient_xid?: string;
  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  visit_type?: string;
  visit_no?: string;
  visit_serial?: number;
  visit_time?: string;
  visit_tag?: string;
  visit_status?: string;
  visit_info?: string;
  diag_info?: string;
}

export interface VisitIpRow {
  visit_id?: number;
  clinic_id?: number;
  clinic_type?: string;
  admission_time?: string;
  admission_type?: string;
  admission_level?: string;
  dept_id?: number;
  dept_name?: string;
  ward_id?: number;
  ward_name?: string;
  bed_id?: number;
  bed_no?: string;
  doctor_id?: number;
  doctor_name?: string;
  doctor_level?: string;
  doctor_group_id?: number;
  doctor_group_name?: string;
  nurse_id?: number;
  nurse_name?: string;
  discharge_time?: string;
}

export interface VisitPatientRow {
  visit_id?: number;
  org_id?: number;
  patient_id?: number;
  patient_name?: string;
  patient_gender?: string;
  patient_idno?: string;
  patient_telno?: string;
  birth_date?: string;
  age_full?: string;
  age_year?: number;
  age_month?: number;
  age_day?: number;
}

export interface VisitStatusRow {
  visit_id?: number;
  insurance_type?: string;
  insurance_name?: string;
  insurance_no?: string;
  /** 医保区划，如 3503 开头表示本地 */
  insurance_district?: string;
  settle_type?: string;
  settle_name?: string;
  settle_tag?: string;
  settle_note?: string;
  service_name?: string;
  service_note?: string;
}

export interface VisitPredischargeRow {
  visit_id?: number;
  discharge_time?: string;
  discharge_note?: string;
}

export interface GetPredischargeListReq {
  ward_id?: number;
  dept_id?: number;
  column_list?: string;
}

export interface GetPredischargeListRes extends ApiResult {
  row_list?: VisitPredischargeRow[];
}

export interface GetIpListReq {
  org_id?: number;
  dept_id?: number;
  ward_id?: number;
  group_id?: number;
  user_id?: number;
  exclude_preadmission?: boolean;
  only_preadmission?: boolean;
  column_visit?: string;
  column_ip?: string;
  exclude_preadmission?: boolean;
}

export interface GetIpListRes extends ApiResult {
  visit_list?: VisitRow[];
  ip_list?: VisitIpRow[];
}

export interface GetVisitPropertyReq {
  visit_id: number;
  column_visit?: string;
  column_ip?: string;
  column_patient?: string;
  column_status?: string;
  column_predischarge?: string;
}

export interface GetVisitPropertyRes extends ApiResult {
  visit_property?: VisitRow;
  ip_property?: VisitIpRow;
  patient_property?: VisitPatientRow;
  status_property?: VisitStatusRow;
  predischarge_property?: VisitPredischargeRow;
}

export interface GetVisitProperty2Req {
  visit_id_list?: number[];
  visit_no_list?: string[];
  visit_type?: string;
  column_visit?: string;
  column_ip?: string;
  column_patient?: string;
  column_status?: string;
  column_predischarge?: string;
}

export interface GetVisitProperty2Res extends ApiResult {
  visit_list?: VisitRow[];
  ip_list?: VisitIpRow[];
  patient_list?: VisitPatientRow[];
  status_list?: VisitStatusRow[];
  predischarge_list?: VisitPredischargeRow[];
}

export interface GetAllergyInfo2Req {
  patient_id_list: number[];
  allergy_type?: string;
}

export interface GetAllergyInfo2Res extends ApiResult {
  /** 与 patient_id_list 顺序一一对应 */
  allergy_info?: string[];
}

export interface GetClinicPropertyReq {
  visit_id?: number;
  column_list?: string;
}

export interface ClinicRow {
  visit_id?: number;
  diag_main?: string;
  diag_full?: string;
  diag_text?: string;
  tcm_diag_full?: string;
}

export interface GetClinicPropertyRes extends ApiResult {
  clinic_property?: ClinicRow;
}

export interface GetClinicProperty2Req {
  visit_id_list?: number[];
  column_list?: string;
}

export interface GetClinicProperty2Res extends ApiResult {
  row_list?: ClinicRow[];
}

export interface PatientTag {
  label: string;
  color?:
    | "default"
    | "volcano"
    | "orange"
    | "success"
    | "purple"
    | "blue"
    | string;
}

export interface PatientItem {
  visit_id: number;
  patient_id: number;
  bed_no: string;
  patient_name: string;
  patient_no: string;
  patient_gender: string;
  patient_age: number;
  age_full: string;
  hospital_days: number;
  hospital_days_tag?: PatientTag;
  is_predischarge?: boolean;
  diag_list: string[];
  tag_list: PatientTag[];
  admission_time?: string;
  dept_name?: string;
  ward_name?: string;
  doctor_name?: string;
  nurse_name?: string;
  /** 担保金额 */
  guarantee_amount?: number;
  /** 预交金余额 */
  prepay_amount?: number;
  /** 累计费用 = bill_amount + charge_amount */
  total_amount?: number;
  /** 待扣金额 = bill_amount */
  bill_amount?: number;
  /** 预交金余额 + 担保金额 < 0 */
  is_arrears?: boolean;
}
