import { ApiResult } from "@/types/comm";
import { EmrWorkType } from "../EmrWorkspace";

// 住院病人列表数据
export interface VisitRow {
  /** 就诊ID */
  visit_id?: number;

  /** 患者ID */
  patient_id?: number;

  /** 患者编号 */
  patient_no?: string;

  /** 患者XID */
  patient_xid?: string;

  /** 机构ID */
  org_id?: number;

  /** 机构名称 */
  org_name?: string;

  /** 科室ID */
  dept_id?: number;

  /** 科室名称 */
  dept_name?: string;

  /**
   * 就诊类型
   * O-门诊
   * E-急诊
   * I-住院
   */
  visit_type?: "O" | "E" | "I" | string;

  /** 就诊号，人读，机构唯一 */
  visit_no?: string;

  /** 就诊类型的就诊次数 */
  visit_serial?: number;

  /** 就诊时间 */
  visit_time?: string;

  /** 就诊标签 */
  visit_tag?: string;

  /**
   * 就诊状态
   * VISIT: 就诊
   * OBSERVE: 留观
   * FINISH: 完成就诊
   * ADMISSION: 入院
   * DISCHARGE: 出院
   * CANCEL: 作废
   */
  visit_status?:
    | "VISIT"
    | "OBSERVE"
    | "FINISH"
    | "ADMISSION"
    | "DISCHARGE"
    | "CANCEL"
    | string;

  /** 就诊信息 */
  visit_info?: string;

  /** 诊断信息 */
  diag_info?: string;

  /** 关联名称 */
  link_name?: string;

  /** 关联值 */
  link_value?: number;

  /** 关联标签 */
  link_tag?: string;

  /** 关联数据 */
  link_data?: string;

  /** 扩展字段 */
  link_ext?: string;

  /** 创建时间 */
  create_time?: string;

  /** 创建会话 */
  create_session?: string;

  /** 创建备注 */
  create_note?: string;

  /** 录入时间 */
  input_time?: string;

  /** 录入会话 */
  input_session?: string;

  /** 录入备注 */
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

/** 患者属性（GetVisitProperty / GetVisitProperty2） */
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

export interface DiagRow {
  /** 诊断ID */
  diag_id?: number;

  /** 机构ID */
  org_id?: number;

  /** 就诊ID */
  visit_id?: number;

  /** 诊断编号 */
  diag_no?: string;

  /** 诊断类型 */
  diag_type?: string;

  /** 诊断级别 */
  diag_level?: number;

  /** 序号 */
  serial_no?: string;

  /** 身体部位 */
  body_position?: string;

  /** 身体名称 */
  body_name?: string;

  /** 身体编码 */
  body_code?: string;

  /** 身体编码体系 */
  body_code_system?: string;

  /** 诊断时间 */
  diag_time?: string;

  /** 诊断描述 */
  diag_desc?: string;

  /** 诊断名称 */
  diag_name?: string;

  /** 诊断编码 */
  diag_code?: string;

  /** 项目ID */
  item_id?: number;

  /** 第二诊断名称 */
  diag_name2?: string;

  /** 第二诊断编码 */
  diag_code2?: string;

  /** 第二项目ID */
  item_id2?: number;

  /** 诊断编码体系 */
  diag_code_system?: string;

  /** 诊断状态 */
  diag_status?: string;

  /** 诊断标签 */
  diag_tag?: string;

  /** 诊断备注 */
  diag_note?: string;

  /** 诊断目录 */
  diag_catalog?: string;

  /** 诊断阶段 */
  diag_stage?: string;

  /** 诊断等级 */
  diag_grade?: string;

  /** 诊断程度 */
  diag_degree?: string;

  /** 诊断分组 */
  diag_group?: string;

  /** 创建时间 */
  create_time?: string;

  /** 创建医生ID */
  create_doctor_id?: number;

  /** 创建医生姓名 */
  create_doctor_name?: string;

  /** 创建医生级别 */
  create_doctor_level?: string;

  /** 确认时间 */
  confirm_time?: string;

  /** 确认医生ID */
  confirm_doctor_id?: number;

  /** 确认医生姓名 */
  confirm_doctor_name?: string;

  /** 确认医生级别 */
  confirm_doctor_level?: string;

  /** 审核时间 */
  check_time?: string;

  /** 审核医生ID */
  check_doctor_id?: number;

  /** 审核医生姓名 */
  check_doctor_name?: string;

  /** 审核医生级别 */
  check_doctor_level?: string;

  /** 审核标签 */
  check_tag?: string;

  /** 审核备注 */
  check_note?: string;

  /** 入院问题 */
  admission_issue?: string;

  /** 治疗问题 */
  treat_issue?: string;

  /** 出院问题 */
  discharge_issue?: string;

  /** 关联名称 */
  link_name?: string;

  /** 关联值 */
  link_value?: number;

  /** 关联数据 */
  link_data?: string;

  /** 关联标签 */
  link_tag?: string;

  /** 扩展字段 */
  link_ext?: string;

  /** 录入时间 */
  input_time?: string;

  /** 录入会话 */
  input_session?: string;

  /** 录入备注 */
  input_note?: string;
}

/**
 * 住院患者列表标签
 */
export interface VisitItemTag {
  /** 标签文案 */
  label: string;
  /** antd Tag 预设色，如 volcano / default / orange */
  color?: string;
}

/**
 * 住院患者列表展示项
 */
export interface VisitItemRow {
  /** 就诊ID */
  visit_id: number;
  /** 患者ID */
  patient_id: number;
  /** 患者XID */
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
  /** 住院天数：in 为当前 - 入院；out 为出院 - 入院（0 记 1）；transfer 不展示 */
  hospital_days: number;
  /** 诊断列表 */
  diag_list: string[];
  /** 标签列表 */
  tag_list: VisitItemTag[];
  /** 就诊号（人读） */
  visit_no?: string;
  /** 入院时间 */
  admission_time?: string;
  /** 医保号 */
  insurance_no?: string;
  /** 分组/DRG 等标签，如 GR10 */
  group_tag?: string;
  /** 临床路径进度 0-100 */
  path_progress?: number;
  /** 病区ID */
  ward_id?: number;
  /** 病区名称 */
  ward_name?: string;
  /** 科室ID */
  dept_id?: number;
  /** 科室名称 */
  dept_name?: string;
  /** 就诊信息（后端拼装的患者摘要） */
  visit_info?: string;
  /** 主管医生姓名 */
  doctor_name?: string;
  /** 医保信息 */
  status_property?: VisitStatusRow;
  // 新增病人信息、住院信息、门诊诊断信息
  patient_property?: VisitPatientRow;
  ip_property?: VisitIpRow;
  clinic_property?: VisitIpRow;
  // 新增患者就诊信息
  visit_property?: VisitRow;
  /** 区域属性（由 insurance_district 查询区域属性得到） */
  area_property?: AreaRow;
}

/** 预出院属性 */
export interface VisitPredischargeRow {
  // visit_id
  visit_id?: number;

  // 预出院时间
  discharge_date?: string;
  discharge_time?: string;

  // 出院信息
  discharge_type?: string;
  discharge_type_code?: string;

  discharge_admission?: number;
  discharge_admission_note?: string;
  discharge_tag?: string;
  discharge_note?: string;

  // 转院信息
  transfer_no?: string;
  transfer_org_id?: number;
  transfer_org_name?: string;
  transfer_tag?: string;
  transfer_note?: string;

  // 登记信息
  reg_time?: string;
  reg_doctor_id?: number;
  reg_doctor_name?: string;
  reg_doctor_level?: string;
  reg_tag?: string;
  reg_note?: string;

  // 审批信息
  approve_time?: string;
  approve_doctor_id?: number;
  approve_doctor_name?: string;
  approve_doctor_level?: string;
  approve_tag?: string;
  approve_note?: string;

  // 录入信息
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
/** GetVisitProperty 请求 */
export interface GetVisitPropertyReq {
  visit_id: number;
  column_visit?: string;
  column_ip?: string;
  column_patient?: string;
  column_status?: string;
  /** 空值不取，传 * 取预出院属性 */
  column_predischarge?: string;
}

/** GetVisitProperty 响应 */
export interface GetVisitPropertyRes {
  code: number;
  message: string;
  hint: string;
  visit_property: VisitRow;
  ip_property: VisitIpRow;
  patient_property: VisitPatientRow;
  status_property: VisitStatusRow;
  predischarge_property?: VisitPredischargeRow;
}

export interface GetIpListReq {
  /** 科室ID */
  dept_id: number;

  /** 病区ID */
  ward_id: number;

  /** 医疗组ID */
  group_id?: number;

  /** 用户ID */
  user_id?: number;

  /**
   * 排除办理住院但还未入科的数据
   */
  exclude_preadmission?: boolean;

  /** 就诊字段选择 */
  column_visit?: string;

  /** 住院字段选择 */
  column_ip?: string;
}

export interface GetIpListRes {
  /** 返回码 */
  code: number;

  /** 返回信息 */
  message: string;

  /** 提示信息 */
  hint: string;

  /** 就诊列表 */
  visit_list: VisitRow[];

  /** 住院信息列表 */
  ip_list: VisitIpRow[];
}

export interface GetDiagListReq {
  /** 就诊ID */
  visit_id: number;

  /** 诊断类型 */
  diag_type: string;

  /** 关联名称 */
  link_name?: string;

  /** 关联值 */
  link_value?: number;

  /** 关联数据 */
  link_data?: string;

  /** 关联标签 */
  link_tag?: string;

  /** 扩展字段 */
  link_ext?: string;

  /** 返回字段列表 */
  column_list?: string;

  /**
   * 可选，为空不返回
   * 诊断差异字段
   */
  column_diff?: string;

  /**
   * 可选，为空不返回
   * 诊断证据字段
   */
  column_evidence?: string;

  /**
   * 可选，为空不返回
   * 治疗字段
   */
  column_treat?: string;
}

export interface GetDiagListRes {
  /** 返回码 */
  code: number;

  /** 返回信息 */
  message: string;

  /** 提示信息 */
  hint: string;

  /** 诊断列表 */
  diag_list: DiagRow[];
}

export interface GetAllergyInfo2Req {
  /** 患者ID列表 */
  patient_id_list?: number[];

  /**
   * 过敏类型
   * empty 或 * 表示全部
   */
  allergy_type?: string;

  /** 是否包含EMPI信息 */
  include_empi?: boolean;
}

export interface GetAllergyInfo2Res {
  /** 返回码 */
  code: number;

  /** 返回信息 */
  message: string;

  /** 提示信息 */
  hint: string;

  /**
   * 过敏信息列表
   * 与 patient_id_list 顺序一一对应
   */
  allergy_info: string[];
}


export interface GetQcList3Req {
  org_id?: number;
  visit_id_list?: number[];
  column_list?: string;
}

export interface QcVisitRow {
  visit_id?: number;
  patient_id?: number;
  patient_no?: string;

  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  ward_id?: number;
  ward_name?: string;

  visit_type?: string;
  visit_no?: string;
  visit_serial?: number;
  visit_time?: string;
  visit_tag?: string;
  visit_info?: string;

  doctor_commit_time?: string;
  doctor_commit_tag?: string;
  doctor_commit_note?: string;
  doctor_commit_session?: string;

  doctor_qc_time?: string;
  doctor_qc_score?: string;
  doctor_qc_level?: string;
  doctor_qc_tag?: string;
  doctor_qc_note?: string;
  doctor_qc_session?: string;

  nurse_commit_time?: string;
  nurse_commit_tag?: string;
  nurse_commit_note?: string;
  nurse_commit_session?: string;

  nurse_qc_time?: string;
  nurse_qc_score?: string;
  nurse_qc_level?: string;
  nurse_qc_tag?: string;
  nurse_qc_note?: string;
  nurse_qc_session?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetQcList3Res extends ApiResult {
  row_list?: QcVisitRow[];
}

export interface GetCaseList3Req {
  org_id?: number;
  visit_id_list?: number[];
  column_list?: string;
}

export interface CaseVisitRow {
  visit_id?: number;
  patient_id?: number;
  patient_no?: string;

  org_id?: number;
  org_name?: string;
  dept_id?: number;
  dept_name?: string;
  ward_id?: number;
  ward_name?: string;

  visit_type?: string;
  visit_no?: string;
  visit_serial?: number;
  visit_time?: string;
  visit_tag?: string;
  visit_info?: string;

  code_time?: string;
  code_tag?: string;
  code_note?: string;
  code_session?: string;
  approve_time?: string;
  approve_tag?: string;
  approve_note?: string;
  approve_session?: string;

  archive_time?: string;
  archive_tag?: string;
  archive_note?: string;
  archive_session?: string;
  receive_time?: string;
  receive_tag?: string;
  receive_note?: string;
  receive_session?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}


export interface GetCaseList3Res extends ApiResult {
  row_list?: CaseVisitRow[];
}


export interface GetTimeTaskCount2Req {
  visit_id?: number;
  /** DOCTOR / NURSE */
  rule_type?: EmrWorkType;
}

export interface GetTimeTaskCount2Res extends ApiResult {
  task_count?: number;
  timeout_count?: number;

  expire1_count?: number; //1小时将过期
  expire2_count?: number; //2小时将过期
  expire4_count?: number; //4小时将过期
  expire8_count?: number; //8小时将过期
}

/** 区域属性行（参保地等） */
export interface AreaRow {
  area_id?: number;
  parent_id?: number;

  area_name?: string;
  area_name_full?: string;
  area_name_short?: string;
  area_level?: number;
  area_district?: string;
  area_post?: string;
  area_tag?: string;
  area_note?: string;

  map_long?: string;
  map_lat?: string;

  kb_code?: string;
}

/** 获取区域属性，展示医保归属地 area_name */
export interface GetAreaPropertyReq {
  area_id: number;
  column_list?: string;
}

export interface GetAreaPropertyRes extends ApiResult {
  area_property?: AreaRow;
}