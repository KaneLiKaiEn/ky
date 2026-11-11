import { ClinicRow } from "@/types/clinic";

export interface VisitStatusRow {
  visit_id?: number;

  /** 保险类型 */
  insurance_type?: string;
  /** 保险类型名称: 自费，部队，工伤，医保 */
  insurance_name?: string;
  insurance_no?: string;
  insurance_code?: string;
  /** 参保地 */
  insurance_district?: string;
  insurance_tag?: string;
  insurance_note?: string;

  /** 结算类型 */
  settle_type?: string;
  /** 结算名称 */
  settle_name?: string;
  settle_tag?: string;
  settle_note?: string;

  service_code?: string;
  service_name?: string;
  service_status?: string;
  service_tag?: string;
  service_note?: string;

  handle_id?: number;
  handle_no?: string;
  handle_tag?: string;
  handle_note?: string;

  /** 国籍 */
  country_name?: string;
  country_code?: string;
  /** 国籍编码系统 */
  country_code_system?: string;

  /** 文化程度 */
  edu_name?: string;
  edu_code?: string;
  edu_code_system?: string;

  /** 职业 */
  work_name?: string;
  work_code?: string;
  work_code_system?: string;
  /** 工作单位 */
  work_org?: string;
  /** 职务 */
  work_title?: string;
  /** 参加工作日期 */
  work_start?: string;
  /** 退休日期 */
  work_end?: string;
  work_telno?: string;

  /** 婚姻状态 */
  marital_name?: string;
  marital_code?: string;
  marital_code_system?: string;

  /** 语种 */
  lang_name?: string;
  lang_code?: string;
  lang_code_system?: string;

  /** 信仰 */
  faith_name?: string;
  faith_code?: string;
  faith_code_system?: string;

  /** ABO血型 */
  blood_abo?: string;
  /** RH血型 */
  blood_rh?: string;

  /** 身高 */
  body_height?: number;
  /** 体重 */
  body_weight?: string;
  /** BMI */
  body_bmi?: string;

  /** 患者类型 */
  patient_type?: string;
  /** 患者标识 */
  patient_tag?: string;

  disease_code?: string;
  disease_name?: string;

  /** 死亡日期 */
  death_date?: string;
  /** 死亡时间 */
  death_time?: string;
  /** 死亡地点 */
  death_place?: string;
  /** 死亡疾病 */
  death_disease?: string;
  /** 主诊断 */
  death_diag_name?: string;
  /** 主诊断代码 */
  death_diag_code?: string;
  death_diag_code_system?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}
/**
 * 就诊信息条展示数据
 */
export interface VisitInfoRow {
  /** 就诊ID */
  visit_id: number;
  /** 患者ID */
  patient_id: number;
  /** 床位号 */
  bed_no: string;
  /** 患者姓名 */
  patient_name: string;
  /** 病案号 */
  patient_no: string;
  /** 患者性别 */
  patient_gender: string;
  /** 患者年龄 */
  patient_age?: number;
  /** 患者年龄全称 */
  age_full?: string;
  /** 住院天数 */
  hospital_days: number;
  /** 诊断列表 */
  diag_list: string[];
  /** 就诊号（人读） */
  visit_no?: string;
  /** 入院时间 */
  admission_time?: string;
  /** 医保号 */
  insurance_no?: string;
  /** 分组/DRG 等标签 */
  group_tag?: string;
  /** 临床路径进度 0-100 */
  path_progress?: number;
  /** 病区 */
  ward_id?: number;
  ward_name?: string;
  /** 科室 */
  dept_id?: number;
  dept_name?: string;
  // 医保信息
  status_property?: VisitStatusRow;
  // 病人信息
  patient_property?: VisitPatientProperty;
  // 住院信息
  ip_property?: VisitIpRow;
  // 临床诊断属性
  clinic_property?: ClinicRow;
  // 患者就诊信息
  visit_property?: VisitRow;
}

/** GetVisitProperty 请求 */
export interface GetVisitPropertyReq {
  visit_id: number;
  column_visit?: string;
  column_ip?: string;
  column_patient?: string;
  column_status?: string;
}

/** 就诊属性（接口字段子集） */
export interface VisitRow {
  visit_id?: number;
  patient_id?: number;
  patient_no?: string;
  patient_xid?: string;
  visit_no?: string;
  visit_tag?: string;
  diag_info?: string;
}
/** 就诊类型：O-门诊 E-急诊 I-住院 */
export type VisitTypeCode = "O" | "E" | "I" | string;
/**
 * 就诊状态
 * VISIT: 就诊 / OBSERVE: 留观 / FINISH: 完成就诊
 * ADMISSION: 入院 / DISCHARGE: 出院 / CANCEL: 作废
 */
export type VisitStatusCode =
  | "VISIT"
  | "OBSERVE"
  | "FINISH"
  | "ADMISSION"
  | "DISCHARGE"
  | "CANCEL"
  | string;
/** 就诊主表行 */
export interface VisitRow {
  visit_id?: number;
  patient_id?: number;
  patient_no?: string;
  patient_xid?: string;
  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  /** O-门诊 E-急诊 I-住院 */
  visit_type?: VisitTypeCode;
  /** 就诊号，人读，机构唯一 */
  visit_no?: string;
  /** 就诊类型的就诊次数 */
  visit_serial?: number;
  visit_time?: string;
  visit_tag?: string;
  visit_status?: VisitStatusCode;
  visit_info?: string;
  diag_info?: string;
  link_name?: string;
  link_value?: number;
  link_tag?: string;
  link_data?: string;
  link_ext?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface VisitIpRow {
  /** 就诊ID */
  visit_id?: number;
  /** 预约ID */
  appoint_id?: number;
  /** 病区就诊ID */
  clinic_id?: number;
  /** 就诊类型 */
  clinic_type?: string;
  /** 挂号时间 */
  reg_time?: string;
  /** 挂号会话 */
  reg_session?: string;
  /** 挂号标签 */
  reg_tag?: string;
  /** 挂号备注 */
  reg_note?: string;
  /** 入院时间 */
  admission_time?: string;
  /** 入院类型 */
  admission_type?: string;
  /** 入院类型编码 */
  admission_type_code?: string;
  /** 入院级别 */
  admission_level?: string;
  /** 入院级别编码 */
  admission_level_code?: string;
  /** 入院科室ID */
  admission_dept_id?: number;
  /** 入院科室名称 */
  admission_dept_name?: string;
  /** 入院病区ID */
  admission_ward_id?: number;
  /** 入院病区名称 */
  admission_ward_name?: string;
  /** 入院会话 */
  admission_session?: string;
  /** 入院标签 */
  admission_tag?: string;
  /** 入院备注 */
  admission_note?: string;
  /** 当前病区ID */
  ward_id?: number;
  /** 当前病区名称 */
  ward_name?: string;
  /** 房间ID */
  room_id?: number;
  /** 房间号 */
  room_no?: string;
  /** 床位ID */
  bed_id?: number;
  /** 床位号 */
  bed_no?: string;
  /** 床位服务状态 */
  bed_service?: number;
  /** 医生ID */
  doctor_id?: number;
  /** 医生姓名 */
  doctor_name?: string;
  /** 医生级别 */
  doctor_level?: string;
  /** 医生组ID */
  doctor_group_id?: number;
  /** 医生组名称 */
  doctor_group_name?: string;
  /** 护士ID */
  nurse_id?: number;
  /** 护士姓名 */
  nurse_name?: string;
  /** 护士级别 */
  nurse_level?: string;
  /** 护士组ID */
  nurse_group_id?: number;
  /** 护士组名称 */
  nurse_group_name?: string;
  /** 出院时间 */
  discharge_time?: string;
  /** 出院会话 */
  discharge_session?: string;
  /** 出院标签 */
  discharge_tag?: string;
  /** 出院备注 */
  discharge_note?: string;
  /** 排序号 */
  sort_no?: string;
  /** 录入时间 */
  input_time?: string;
  /** 录入会话 */
  input_session?: string;
  /** 录入备注 */
  input_note?: string;
}


/** 患者属性（接口字段子集） */
export interface VisitPatientProperty {
  visit_id?: number;
  patient_id?: number;
  patient_name?: string;
  patient_gender?: string;
  age_year?: number;
}

/** GetVisitProperty 响应 */
export interface GetVisitPropertyRes {
  code: number;
  message: string;
  hint: string;
  visit_property: VisitRow;
  ip_property: VisitIpRow;
  patient_property: VisitPatientProperty;
  status_property: VisitStatusRow;
}

/** GetDiagList 请求 */
export interface GetDiagListReq {
  visit_id: number;
  diag_type: string;
  column_list?: string;
}

/** 诊断行（接口字段子集） */
export interface DiagRow {
  diag_name?: string;
  visit_id?: number;
  serial_no?: string;
  diag_level?: number;
}

/** GetDiagList 响应 */
export interface GetDiagListRes {
  code: number;
  message: string;
  hint: string;
  diag_list: DiagRow[];
}

export interface VisitInfoProps {
  /**
   * 当前就诊患者信息。
   * 有值时直接展示，不再发起请求。
   */
  data?: VisitInfoRow | null;
  /**
   * 就诊 ID。
   * 当 data 为空时，用该 ID 请求展示数据。
   */
  visitId?: number | null;
  /**
   * 外部加载态（仅在传入 data 的受控场景使用）。
   * 组件自行按 visitId 请求时忽略此值。
   */
  loading?: boolean;
  /**
   * 外部错误信息（仅在传入 data 的受控场景使用）。
   * 组件自行按 visitId 请求时忽略此值。
   */
  error?: string | null;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自行请求成功后回调（可用于同步外部 store） */
  onLoad?: (data: VisitInfoRow) => void;
  className?: string;
}
