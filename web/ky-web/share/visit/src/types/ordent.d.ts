/** 与 ordent.proto 对齐的类型定义（医嘱开立） */

import type { ApiResult } from "./comm";

export interface GetDefaultPharmacyReq {
  dept_id?: number;
  insurance_type?: string;
  settle_type?: string;
  order_type?: string;
  order_catalog?: string;
}

export interface GetDefaultPharmacyRes extends ApiResult {
  pharmacy_id?: number;
  pharmacy_name?: string;
}

export interface FreqRow {
  item_id?: number;
  org_id?: number;

  catalog_id?: number;
  catalog_tag?: string;
  visit_type?: string;
  order_type?: string;
  order_catalog?: string;

  item_no?: string;
  item_code?: string;
  item_code_system?: string;
  item_name?: string;
  item_desc?: string;
  item_count?: number;
  item_duration?: number;
  item_duration_unit?: string;
  item_tag?: string;
  item_note?: string;

  sort_no?: string;
  kb_code?: string;

  valid_status?: string;
  valid_start?: string;
  valid_end?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface RetrieveFreqListReq {
  visit_type?: string;
  order_type?: string;
  order_catalog?: string;
  catalog_tag?: string;
  item_tag?: string;
  retrieve_input?: string;
  retrieve_limit?: number;
  column_list?: string;
}

export interface RetrieveFreqListRes extends ApiResult {
  row_list?: FreqRow[];
}

/** 医嘱类型和分类的默认用法 */
export interface GetDefaultUsageReq {
  order_type?: string;
  order_catalog?: string;
}

export interface GetDefaultUsageRes extends ApiResult {
  usage_id?: number;
  usage_name?: string;
}

/** 医嘱扩展属性行 */
export interface OrderExtRow {
  row_id?: number;
  order_id?: number;
  sub_id?: number;

  item_code?: string;
  item_name?: string;
  item_unit?: string;
  item_value?: string;
  item_value_int?: number;
  item_value_dec?: string;
  item_tag?: string;
  item_note?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** 用法（口服 / 输液 / 中草药等） */
export interface OrderUsageRow {
  order_id?: number;

  usage_id?: number;
  usage_name?: string;
  usage_desc?: string;
  /** 滴速等（兼容旧字段） */
  usage_speed?: string;
  usage_speed_unit?: string;
  /** 滴速等（proto: usage_rate） */
  usage_rate?: string;
  usage_rate_unit?: string;
  usage_tag?: string;
  usage_note?: string;

  route_no?: number;
  route_tag?: string;
  route_note?: string;

  produce_id?: number;
  produce_name?: string;
  produce_tag?: string;
  produce_note?: string;

  tcm_decoct_id?: number;
  tcm_decoct_name?: string;
  tcm_decoct_minute?: number;
  tcm_decoct_water?: number;
  tcm_decoct_tag?: string;
  tcm_decoct_note?: string;

  ivgtt_id?: number;
  ivgtt_name?: string;
}

/** 用法步骤（胰岛素等多时段） */
export interface OrderUsageStepRow {
  row_id?: number;
  order_id?: number;

  serial_no?: number;
  /** date */
  date_start?: string;
  /** date */
  date_end?: string;
  time_start?: string;
  time_end?: string;
  step_code?: string;
  step_name?: string;
  step_tag?: string;
  step_note?: string;

  /** decimal */
  dosage_quantity?: string;
  dosage_unit?: string;
  /** decimal */
  rate_value?: string;
  rate_unit?: string;
}

/** 频次 */
export interface OrderFreqRow {
  order_id?: number;

  freq_id?: number;
  freq_name?: string;
  freq_desc?: string;
  freq_tag?: string;
  freq_note?: string;
  freq_first?: number;
  freq_last?: number;
  /** 天数 */
  freq_day?: number;
  freq_count?: number;
  /** 时机，如 饭前 */
  freq_time?: string;

  tcm_freq_day?: number;
  tcm_freq_quantity?: number;
  tcm_freq_times?: number;
  tcm_freq_tag?: string;
  tcm_freq_note?: string;
}

/** 频次执行时间点（胰岛素等） */
export interface OrderFreqTimeRow {
  order_id?: number;
  time_id?: number;

  freq_name?: string;
  freq_time?: string;

  dosage_quantity?: string;
  dosage_unit?: string;
}

/** 检查 / 治疗方法 */
export interface OrderMethodRow {
  order_id?: number;

  method_id?: number;
  method_name?: string;
  method_code?: string;
  method_code_system?: string;
  method_tag?: string;
  method_note?: string;

  sort_no?: string;
}

/** 检查 / 治疗部位 */
export interface OrderBodyRow {
  row_id?: number;
  order_id?: number;

  body_id?: number;
  body_name?: string;
  body_code?: string;
  body_code_system?: string;
  body_tag?: string;
  body_note?: string;

  item_quantity?: string;

  sort_no?: string;
}

/** 检验标本 */
export interface OrderSpecimenRow {
  order_id?: number;

  specimen_id?: number;
  specimen_name?: string;
  specimen_code?: string;
  specimen_code_system?: string;
  specimen_tag?: string;
  specimen_note?: string;

  /** 采集管（合管维度） */
  tube_id?: number;
  tube_name?: string;

  item_quantity?: string;

  sort_no?: string;
}

/** 条件医嘱条件行 */
export interface OrderConditionRow {
  row_id?: number;
  order_id?: number;

  serial_no?: number;
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  elem_operator?: string;
  elem_value?: string;
  elem_value_int?: number;
  /** decimal */
  elem_value_dec?: string;
  elem_unit?: string;

  condition_desc?: string;
  condition_link?: string;
}

/** 申请单数据元（talk.elem.VisitValueRow） */
export interface VisitValueRow {
  value_id?: number;
  org_id?: number;
  visit_id?: number;
  baby_id?: number;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  entry_id?: number;
  section_id?: number;
  row_id?: string;
  row_no?: number;
  serial_no?: number;
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  elem_version?: number;

  value_time?: string;
  value_score?: number;
  value_text?: string;
  value_code?: string;
  value_code_system?: string;
  value_tag?: string;
  value_note?: string;
  value_int?: number;
  value_dec?: string;
  value_tip?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

/** 收费项目明细 */
export interface OrderSubChargeRow {
  sub_id?: number;
  order_id?: number;

  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;

  item_id?: number;
  item_name?: string;
  item_spec?: string;
  item_tag?: string;
  item_note?: string;
  /** decimal */
  item_quantity?: string;
  item_unit?: string;

  price_value?: string;
  price_unit?: string;
  amount_value?: string;
}

/** 药品抗菌药物扩展 */
export interface OrderSubDrugAbRow {
  sub_id?: number;
  order_id?: number;
  item_id?: number;

  ab_level?: number;
  ab_type?: string;
  ab_tag?: string;
  ab_note?: string;

  prevent_tag?: string;
  prevent_ops_id?: number;
  prevent_ops_name?: string;
  prevent_ops_incision?: number;
  prevent_note?: string;

  treat_infect_code?: string;
  treat_infect_name?: string;
  treat_test?: string;
  treat_test_order?: number;
  treat_test_time?: string;
  treat_report?: string;
  treat_report_id?: string;
  treat_report_time?: string;
  treat_note?: string;

  consult_id?: number;
  consult_time?: string;
  consult_note?: string;
}

/**
 * 药品皮试扩展
 * test_action: TEST-皮试, DONE-已皮试, DENY-拒绝皮试
 * done_id: TEST-医嘱id，DONE-皮试id，DENY-0
 */
export interface OrderSubDrugTestRow {
  sub_id?: number;
  order_id?: number;
  item_id?: number;

  serial_no?: number;
  allergy_id?: number;
  allergy_name?: string;
  test_action?: string; // TEST-皮试, DONE-已皮试, DENY-拒绝皮试
  test_id?: number; // TEST-医嘱id，DONE-皮试id，DENY-0
  test_tag?: string; // [REUSE]-续用皮试药
  /** 无需皮试原因（DENY） */
  test_note?: string;
  done_id?: number;
  deny_tag?: string;
  deny_note?: string;
}

/** 药品明细（含抗菌药 / 皮试扩展） */
export interface OrderSubDrugRowExt {
  sub_id?: number;
  order_id?: number;

  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;

  item_id?: number;
  item_name?: string;
  item_spec?: string;
  item_form?: string;
  item_factory?: string;
  item_tag?: string;
  item_note?: string;
  /** decimal */
  item_quantity?: string;
  item_unit?: string;

  /** decimal */
  dosage_quantity?: string;
  dosage_unit?: string;
  price_value?: string;
  price_unit?: string;
  amount_value?: string;

  pharmacy_id?: number;
  pharmacy_name?: string;

  store_id?: number;
  store_name?: string;

  tcm_process_id?: number;
  tcm_process_name?: string;

  /** 非表字段：抗菌药物 */
  ext_ab?: OrderSubDrugAbRow;
  /** 非表字段：皮试 */
  ext_test?: OrderSubDrugTestRow;
}

/** 材料明细 */
export interface OrderSubMaterialRow {
  sub_id?: number;
  order_id?: number;

  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;

  item_id?: number;
  item_name?: string;
  item_spec?: string;
  item_model?: string;
  item_factory?: string;
  item_tag?: string;
  item_note?: string;
  /** decimal */
  item_quantity?: string;
  item_unit?: string;

  price_value?: string;
  price_unit?: string;
  amount_value?: string;

  store_id?: number;
  store_name?: string;
}

/**
 * 服务项目明细（检查 / 检验 / 病理 / 治疗等）
 * item_type: lab | exam | pathology | treat | other
 */
export interface OrderSubServiceRowExt {
  sub_id?: number;
  order_id?: number;

  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;

  item_type?: string;
  item_id?: number;
  item_name?: string;
  item_spec?: string;
  item_tag?: string;
  item_note?: string;
  /** decimal */
  item_quantity?: string;
  item_unit?: string;
  price_value?: string;
  price_unit?: string;
  amount_value?: string;

  ext_list?: OrderExtRow[];
}

/** 标本明细（病理等） */
export interface OrderSubSpecimenRow {
  sub_id?: number;
  order_id?: number;

  serial_no?: number;
  item_type?: string;
  item_no?: string;
  item_code?: string;
  item_name?: string;
  item_spec?: string;
  item_tag?: string;
  item_note?: string;
  item_quantity?: string;
  item_unit?: string;

  size_length?: string;
  size_width?: string;
  size_height?: string;

  body_name?: string;
  body_code?: string;
  body_code_system?: string;
  body_tag?: string;
  body_note?: string;

  collect_time?: string;
  collect_user_id?: number;
  collect_user_name?: string;
  collect_tag?: string;
  collect_note?: string;

  fix_time?: string;
  fix_name?: string;
  fix_user_id?: number;
  fix_user_name?: string;
  fix_tag?: string;
  fix_note?: string;
}

/** 文字医嘱 / 说明明细 */
export interface OrderSubNoteRow {
  sub_id?: number;
  order_id?: number;

  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;
}

/** 转科 / 转床 / 转病区明细 */
export interface OrderSubTransferRow {
  sub_id?: number;
  order_id?: number;

  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;

  /** 转科 / 转床 / 转病区 */
  transfer_type?: string;
  dept_id?: number;
  dept_name?: string;
  ward_id?: number;
  ward_name?: string;
  bed_id?: number;
  bed_no?: string;
}

/** 出院 / 转院 / 离院 / 死亡明细 */
export interface OrderSubDischargeRow {
  sub_id?: number;
  order_id?: number;

  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;

  /** 出院 / 转院 / 离院 / 死亡 */
  discharge_type?: string;
  discharge_time?: string;
  org_id?: number;
  org_name?: string;
}

/**
 * 下达医嘱请求（长期 / 临时 / 检查 / 检验等统一入口）
 *
 * - order_id: 0=新建，>0=修改
 * - visit_id / visit_no 二选一
 * - before_id: 插入到该医嘱之前（order_time 需一致）
 * - 药品走 drug_list；检查检验等服务走 service_list + order_method / body_list / order_specimen
 */
export interface InputOrderReq {
  /** 0=new, >0: modify */
  order_id?: number;
  /** visit_id / visit_no 二选一 */
  visit_id?: number;
  /** visit_id / visit_no 二选一 */
  visit_no?: string;
  baby_id?: number;
  rx_id?: number;
  encounter_id?: number;
  /** 插入到 before_id 之前，order_time 要一致 */
  before_id?: number;

  order_no?: string;
  /** 如：长期医嘱 / 临时医嘱 */
  order_type?: string;
  /** 如：口服 / 外用 / 输液 / 检查 / 检验 */
  order_catalog?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;
  tcm_quantity?: number;

  order_time?: string;
  /** 0=session.user_id */
  order_user_id?: number;
  /** 空=session.user_name */
  order_user_name?: string;
  order_dept_id?: number;
  order_dept_name?: string;
  exec_dept_id?: number;
  exec_dept_name?: string;

  ext_list?: OrderExtRow[];
  order_usage?: OrderUsageRow;
  usage_step_list?: OrderUsageStepRow[];
  order_freq?: OrderFreqRow;
  freq_time_list?: OrderFreqTimeRow[];
  /** 检查 / 治疗方法 */
  order_method?: OrderMethodRow;
  /** 检查 / 治疗部位 */
  body_list?: OrderBodyRow[];
  /** 检验标本 */
  order_specimen?: OrderSpecimenRow;
  condition_list?: OrderConditionRow[];

  /** 申请单 */
  form_id?: number;
  form_version?: number;
  /** 申请单数据元 */
  elem_list?: VisitValueRow[];

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  charge_list?: OrderSubChargeRow[];
  drug_list?: OrderSubDrugRowExt[];
  material_list?: OrderSubMaterialRow[];
  service_list?: OrderSubServiceRowExt[];
  specimen_list?: OrderSubSpecimenRow[];
  note_list?: OrderSubNoteRow[];
  transfer_list?: OrderSubTransferRow[];
  discharge_list?: OrderSubDischargeRow[];

  /** rx、apply 不能自动提交；自动提交时不再调用检查器 */
  auto_commit?: boolean;
  /** 是否跳过检查器 */
  skip_check?: boolean;

  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  create_note?: string;
}

export interface InputOrderRes extends ApiResult {
  order_id?: number;
}

/** 就诊医嘱列表请求 */
export interface GetVisitOrderListReq {
  visit_id?: number;
  baby_id?: number;
  rx_id?: number;
  encounter_id?: number;

  order_type?: string;
  order_catalog?: string;
  /** 格式：[ORDER][STOP][-CANCEL] */
  order_status?: string;

  order_start?: string;
  order_end?: string;

  stop_start?: string;
  stop_end?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  /** 每页记录数，0=不分页 */
  page_size?: number;
  /** 获取第几页；page_size>0 and page_no=0 时只返回 page_count */
  page_no?: number;

  column_list?: string;

  // 后端模糊匹配
  order_name?: string;
}

/** 就诊医嘱列表行 */
export interface OrderRow {
  order_id?: number;
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;
  rx_id?: number;
  encounter_id?: number;

  order_no?: string;
  order_type?: string;
  order_catalog?: string;
  order_status?: string;
  order_content?: string;
  order_content_fmt?: string;
  order_usage?: string;
  order_usage_fmt?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;
  tcm_quantity?: number;
  /** 金额（列表展示用，后端按需返回） */
  order_price?: string | number;

  order_dept_id?: number;
  order_dept_name?: string;
  exec_dept_id?: number;
  exec_dept_name?: string;

  order_time?: string;
  draft_user_id?: number;
  draft_user_name?: string;
  order_user_id?: number;
  order_user_name?: string;
  commit_time?: string;
  commit_user?: string;

  check_status?: string;
  check_time?: string;
  check_user?: string;
  verify_time?: string;
  verify_user?: string;
  verify_tag?: string;
  verify_note?: string;
  exec_time?: string;
  exec_user?: string;
  exec_tag?: string;
  exec_note?: string;

  stop_time?: string;
  stop_draft?: string;
  stop_user?: string;
  end_time?: string;
  end_user?: string;
  end_tag?: string;
  end_note?: string;

  cancel_time?: string;
  cancel_user?: string;
  cancel_tag?: string;
  cancel_note?: string;
  terminate_time?: string;
  terminate_user?: string;

  base_count?: number;
  drug_count?: number;
  material_count?: number;
  blood_count?: number;
  milk_count?: number;
  nutrition_count?: number;
  charge_count?: number;
  service_count?: number;
  specimen_count?: number;
  note_count?: number;
  transfer_count?: number;
  discharge_count?: number;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  valid_start?: string;
  valid_end?: string;
  sort_no?: string;
  create_time?: string;
  create_session?: string;
  create_note?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetVisitOrderListRes extends ApiResult {
  page_count?: number;
  row_list?: OrderRow[];
}

/** 获取医嘱属性请求 */
export interface GetOrderPropertyReq {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  order_no?: string;

  include_pharmacy?: boolean;

  /** master */
  column_list?: string;

  column_apply?: string;
  column_body?: string;
  column_condition?: string;
  column_ext?: string;
  column_freq?: string;
  column_freq_time?: string;
  column_method?: string;
  column_specimen?: string;
  column_usage?: string;
  column_usage_step?: string;
  column_user?: string;
  column_visit?: string;

  /** 数据元 */
  column_elem?: string;
}

/** 申请单属性 */
export interface OrderApplyRow {
  order_id?: number;
  form_id?: number;
  form_version?: number;
  doc_type?: string;
  doc_name?: string;
  doc_tag?: string;
}

/** 医嘱相关用户 */
export interface OrderUserRow {
  order_id?: number;
  user_id?: number;
  user_name?: string;
  user_role?: string;
  user_tag?: string;
  user_note?: string;
}

/** 医嘱关联就诊摘要 */
export interface OrderVisitRow {
  visit_id?: number;
  visit_no?: string;
  patient_id?: number;
  patient_name?: string;
  visit_type?: string;
  ward_id?: number;
  ward_name?: string;
  dept_id?: number;
  dept_name?: string;
}

/** 获取医嘱属性响应 */
export interface GetOrderPropertyRes extends ApiResult {
  order_property?: OrderRow;

  apply_property?: OrderApplyRow;
  body_list?: OrderBodyRow[];
  condition_list?: OrderConditionRow[];
  ext_list?: OrderExtRow[];
  freq_property?: OrderFreqRow;
  freq_time_list?: OrderFreqTimeRow[];
  method_property?: OrderMethodRow;
  specimen_property?: OrderSpecimenRow;
  usage_property?: OrderUsageRow;
  usage_step_list?: OrderUsageStepRow[];
  user_list?: OrderUserRow[];
  visit_property?: OrderVisitRow;

  /** 数据元 */
  elem_list?: VisitValueRow[];

  pharmacy_id?: number;
  pharmacy_name?: string;
}

/** 医嘱子项基础行 */
export interface OrderSubBaseRow {
  sub_id?: number;
  order_id?: number;
  order_no?: string;

  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;

  item_type?: string;
  item_id?: number;
  item_code?: string;
  item_name?: string;
  item_tag?: string;
  item_note?: string;
  /** decimal */
  item_quantity?: string;
  item_unit?: string;

  price_value?: string;
  price_unit?: string;
  amount_value?: string;

  freq_id?: number;
  freq_name?: string;

  /** 执行科室 */
  dept_id?: number;
  dept_name?: string;
}

/** 类别项目行（GetCategoryItemList） */
export interface CategoryItemRow {
  row_id?: number;
  org_id?: number;
  dept_id?: number;
  category_name?: string;
  item_id?: number;
  item_name?: string;
  sort_no?: string;
  kb_code?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetCategoryItemListReq {
  org_id?: number;
  dept_id?: number;
  category_name?: string;
  include_org?: boolean;
  column_list?: string;
}

export interface GetCategoryItemListRes extends ApiResult {
  row_list?: CategoryItemRow[];
}

/** 下达基础医嘱 */
export interface InputBaseReq {
  visit_id?: number;
  visit_no?: string;
  baby_id?: number;
  order_time?: string;
  order_user_id?: number;
  order_user_name?: string;
  order_dept_id?: number;
  order_dept_name?: string;
  exec_dept_id?: number;
  exec_dept_name?: string;
  care_comm_list?: OrderSubBaseRow[];
  care_level?: OrderSubBaseRow;
  care_give?: OrderSubBaseRow;
  drink_food_list?: OrderSubBaseRow;
  health_level?: OrderSubBaseRow;
  activity_restrict?: OrderSubBaseRow;
  recline_position?: OrderSubBaseRow;
  isolation_precaution?: OrderSubBaseRow;
  exam_observe?: OrderSubBaseRow;
  auto_commit?: boolean;
  skip_check?: boolean;
}

export interface InputBaseRes extends ApiResult {}

/** 查询就诊最近基础医嘱 */
export interface GetOrderBaseLatestReq {
  visit_id?: number;
  /** 可以为空；护理常规等场景服务端 like 匹配 */
  item_type?: string;
  column_list?: string;
}

/** 就诊最近基础医嘱行（proto: VisitBaseLastestRow） */
export interface OrderBaseLatestRow {
  visit_id?: number;
  order_id?: number;
  order_time?: string;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;
  item_type?: string;
  item_id?: number;
  item_code?: string;
  item_name?: string;
  item_tag?: string;
  item_note?: string;
  /** decimal */
  item_quantity?: string;
  item_unit?: string;
  freq_id?: number;
  freq_name?: string;
}

export interface GetOrderBaseLatestRes extends ApiResult {
  row_list?: OrderBaseLatestRow[];
}

/** 停止所有在执行医嘱 */
export interface StopAllReq {
  visit_id?: number;
  baby_id?: number;
  stop_time?: string;
  /** dict=order.stopall */
  stop_code?: string;
  stop_name?: string;
  care_comm_list?: OrderSubBaseRow[];
  care_level?: OrderSubBaseRow;
  care_give?: OrderSubBaseRow;
  drink_food_list?: OrderSubBaseRow;
  health_level?: OrderSubBaseRow;
  activity_restrict?: OrderSubBaseRow;
  recline_position?: OrderSubBaseRow;
  isolation_precaution?: OrderSubBaseRow;
  exam_observe?: OrderSubBaseRow;
}

export interface StopAllRes extends ApiResult {
  order_id?: number;
}

/** 用血明细 */
export interface OrderSubBloodRow {
  sub_id?: number;
  order_id?: number;
  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;
  item_id?: number;
  item_name?: string;
  item_tag?: string;
  item_note?: string;
  item_quantity?: string;
  item_unit?: string;
  price_value?: string;
  price_unit?: string;
  amount_value?: string;
}

/** 奶类明细 */
export interface OrderSubMilkRow {
  sub_id?: number;
  order_id?: number;
  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;
  item_id?: number;
  item_name?: string;
  item_tag?: string;
  item_note?: string;
  item_quantity?: string;
  item_unit?: string;
  price_value?: string;
  price_unit?: string;
  amount_value?: string;
}

/** 营养明细 */
export interface OrderSubNutritionRow {
  sub_id?: number;
  order_id?: number;
  serial_no?: number;
  order_name?: string;
  order_note?: string;
  order_tag?: string;
  sys_tag?: string;
  item_id?: number;
  item_name?: string;
  item_tag?: string;
  item_note?: string;
  item_quantity?: string;
  item_unit?: string;
  price_value?: string;
  price_unit?: string;
  amount_value?: string;
}

/** 获取医嘱药品、项目等子列表请求 */
export interface GetOrderSubListReq {
  /** 至少一项 ID 不能为空 */
  order_id?: number;
  order_no?: string;
  rx_id?: number;

  column_base?: string;
  column_drug?: string;
  column_drug_ab?: string;
  column_drug_test?: string;
  column_blood?: string;
  column_milk?: string;
  column_nutrition?: string;
  column_material?: string;
  column_charge?: string;
  column_service?: string;
  column_specimen?: string;
  column_note?: string;
  column_transfer?: string;
  column_discharge?: string;
}

/** 获取医嘱药品、项目等子列表响应 */
export interface GetOrderSubListRes extends ApiResult {
  base_list?: OrderSubBaseRow[];
  drug_list?: OrderSubDrugRowExt[];
  blood_list?: OrderSubBloodRow[];
  milk_list?: OrderSubMilkRow[];
  nutrition_list?: OrderSubNutritionRow[];
  material_list?: OrderSubMaterialRow[];
  charge_list?: OrderSubChargeRow[];
  service_list?: OrderSubServiceRowExt[];
  specimen_list?: OrderSubSpecimenRow[];
  note_list?: OrderSubNoteRow[];
  transfer_list?: OrderSubTransferRow[];
  discharge_list?: OrderSubDischargeRow[];
}

/**
 * 医嘱状态（列表 order_status；实现时兼容带方括号如 [ORDER]）。
 * DRAFT 草稿 → ORDER 已下达 → ORDER_COMMIT 已提交；
 * ORDER_RETURN 退回（按已下达处理）；STOP / CANCEL 终态；STOP_COMMIT 已停止（可撤销停止）。
 */
export type OrderStatus =
  | "DRAFT"
  | "ORDER"
  | "ORDER_COMMIT"
  | "ORDER_RETURN"
  | "STOP"
  | "STOP_COMMIT"
  | "CANCEL";

/** 提交时带回的自动审核说明行 */
export interface OrderCheckAlertCommentRow {
  alert_id?: number;
  comment_code?: string;
  comment_tag?: string;
  comment_desc?: string;
  /** 可选标识，如 [自费] */
  order_tag?: string;
}

/** 提交时带回的人工审核说明行 */
export interface OrderCheckConfirmCommentRow {
  confirm_id?: number;
  comment_code?: string;
  comment_tag?: string;
  comment_desc?: string;
  /** 可选标识，如 [自费] */
  order_tag?: string;
}

/** 单条提交医嘱 */
export interface CommitOrderReq {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  order_no?: string;
  /**
   * 指定实际提交时间（延迟提交）：更新 order_time，写入 commit_time，
   * 不更新 order_status。
   */
  commit_time?: string;
  alert_list?: OrderCheckAlertCommentRow[];
  confirm_list?: OrderCheckConfirmCommentRow[];
}

export interface CommitOrderRes extends ApiResult {}

/** 批量提交医嘱 */
export interface CommitOrder2Req {
  order_id?: number[];
  commit_time?: string;
  alert_list?: OrderCheckAlertCommentRow[];
  confirm_list?: OrderCheckConfirmCommentRow[];
}

export interface CommitOrder2Res extends ApiResult {}

/** 限制级药品：授权医师登录后提交授权 */
export interface AuthOrderReq {
  order_id?: number;
  /** 授权医师登录得到的 session_id */
  session_id?: string;
}

export interface AuthOrderRes extends ApiResult {}

/** 获取自动审核（alert）质控列表 */
export interface GetOrderCheckAlertListReq {
  order_id?: number;
  column_list?: string;
}

export interface OrderCheckAlertRow {
  alert_id?: number;
  order_id?: number;
  checker_code?: string;
  serial_no?: number;
  alert_no?: string;
  /** 如 DENY / WARN 等 */
  alert_level?: string;
  alert_code?: string;
  alert_name?: string;
  alert_tag?: string;
  alert_desc?: string;
  alert_note?: string;
  comment_code?: string;
  comment_tag?: string;
  comment_desc?: string;
  valid_status?: string;
}

export interface GetOrderCheckAlertListRes extends ApiResult {
  row_list?: OrderCheckAlertRow[];
}

/** 获取人工审核（confirm）质控列表 */
export interface GetOrderCheckConfirmListReq {
  order_id?: number;
  column_list?: string;
}

export interface OrderCheckConfirmRow {
  confirm_id?: number;
  order_id?: number;
  checker_code?: string;
  serial_no?: number;
  alert_no?: string;
  alert_level?: string;
  alert_code?: string;
  alert_name?: string;
  alert_tag?: string;
  alert_desc?: string;
  alert_note?: string;
  comment_code?: string;
  comment_tag?: string;
  comment_desc?: string;
  confirm_app?: string;
  confirm_status?: string;
  confirm_no?: string;
  confirm_code?: string;
  confirm_tag?: string;
  confirm_desc?: string;
  confirm_note?: string;
  confirm_dept_id?: number;
  confirm_dept_name?: string;
  confirm_user_id?: number;
  confirm_user_name?: string;
}

export interface GetOrderCheckConfirmListRes extends ApiResult {
  row_list?: OrderCheckConfirmRow[];
}

/** 取消提交（单条） */
export interface UndoCommitOrderReq {
  order_id?: number;
  order_no?: string;
  undo_note?: string;
}

export interface UndoCommitOrderRes extends ApiResult {}

/** 取消提交（批量） */
export interface UndoCommitOrder2Req {
  order_id_list?: number[];
  undo_note?: string;
}

export interface UndoCommitOrder2Res extends ApiResult {}

/** 删除医嘱（未提交 / 已下达） */
export interface DeleteOrderReq {
  order_id?: number;
  order_no?: string;
  delete_note?: string;
}

export interface DeleteOrderRes extends ApiResult {}

/** 取消医嘱（已提交） */
export interface CancelOrderReq {
  order_id?: number;
  order_no?: string;
  cancel_note?: string;
}

export interface CancelOrderRes extends ApiResult {}

/**
 * 胰岛素：某频次对应的餐前/剂量时间点（GetFreqTimeList）。
 * 与医嘱属性里的 OrderFreqTimeRow 字段对齐，供弹窗初始化条数与默认时机/时间。
 */
export interface FreqTimeRow {
  freq_name?: string;
  freq_time?: string;
  dosage_quantity?: string;
  dosage_unit?: string;
  time_id?: number;
}

/** 获取胰岛素频次对应的剂量时间列表 */
export interface GetFreqTimeListReq {
  /** 频次 id（freq_id） */
  item_id?: number;
  column_list?: string;
}

export interface GetFreqTimeListRes extends ApiResult {
  row_list?: FreqTimeRow[];
}

/** 按患者查询医嘱列表（如近 N 天皮试医嘱） */
export interface GetPatientOrderListReq {
  patient_id?: number;
  /** O-门诊 E-急诊 I-住院 */
  visit_type?: string;
  include_empi?: boolean;

  order_type?: string;
  order_catalog?: string;
  /** 格式如：[ORDER][STOP][-CANCEL] */
  order_status?: string;

  order_start?: string;
  order_end?: string;

  stop_start?: string;
  stop_end?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  /** 每页记录数，0=不分页 */
  page_size?: number;
  /** page_size>0 且 page_no=0 时只返回 page_count */
  page_no?: number;

  column_list?: string;
}

export interface GetPatientOrderListRes extends ApiResult {
  page_count?: number;
  row_list?: OrderRow[];
}

/** 皮试医嘱是否可续用 */
export interface CanReuseOrderReq {
  order_id?: number;
}

export interface CanReuseOrderRes extends ApiResult {
  /** 是否可以复用 */
  can_reuse?: boolean;
}

/** 批量获取医嘱药品、项目等子列表请求 */
export interface GetOrderSubList2Req {
  order_id_list?: number[];
  /** 其次 */
  order_no_list?: string[];

  column_base?: string;
  column_drug?: string;
  column_drug_ab?: string;
  column_drug_test?: string;
  column_blood?: string;
  column_milk?: string;
  column_nutrition?: string;
  column_material?: string;
  column_charge?: string;
  column_service?: string;
  column_specimen?: string;
  column_note?: string;
  column_transfer?: string;
  column_discharge?: string;
}

/** 批量获取医嘱药品、项目等子列表响应 */
export interface GetOrderSubList2Res extends ApiResult {
  base_list?: OrderSubBaseRow[];
  drug_list?: OrderSubDrugRowExt[];
  // drug_ab_list?: OrderSubDrugAbRow[];
  // drug_test_list?: OrderSubDrugTestRow[];
  blood_list?: OrderSubBloodRow[];
  milk_list?: OrderSubMilkRow[];
  nutrition_list?: OrderSubNutritionRow[];
  material_list?: OrderSubMaterialRow[];
  charge_list?: OrderSubChargeRow[];
  service_list?: OrderSubServiceRowExt[];
  specimen_list?: OrderSubSpecimenRow[];
  note_list?: OrderSubNoteRow[];
  transfer_list?: OrderSubTransferRow[];
  discharge_list?: OrderSubDischargeRow[];
}

/** 停止单条长期医嘱 */
export interface StopOrderReq {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  order_no?: string;
  /** 停止时间；延迟停止时写入 stop_time，不立即更新 order_status */
  stop_time?: string;
  /** 0 = session.user_id */
  user_id?: number;
  /** 0 = session.user_name */
  user_name?: string;
  freq_last?: number;
}

export interface StopOrderRes extends ApiResult {}

/** 撤销停止（STOP_COMMIT） */
export interface UndoStopOrderReq {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  order_no?: string;
  undo_note?: string;
}

export interface UndoStopOrderRes extends ApiResult {}

/**
 * 新建医嘱模板（药品类「存为模板」第一步）。
 * 明细另走 SavePrefabDetail(order_id_list)；检验/治疗见 lab/treat 的 NewPrefab。
 */
export interface NewPrefabReq {
  catalog_id?: number;
  org_id?: number;
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;
  share_tag?: string;

  /** 处方，中草药处方，麻精一处方，精二处方，长期医嘱，临时医嘱，出院带药... */
  prefab_type?: string;
  prefab_name?: string;
  prefab_tag?: string;
  prefab_note?: string;

  disease_id?: number;
  disease_name?: string;

  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface NewPrefabRes extends ApiResult {
  prefab_id?: number;
}

export interface SavePrefabDetailReq {
  prefab_id?: number;
  order_id_list?: number[];
}

export interface SavePrefabDetailRes extends ApiResult {}

export interface GetPrefabListReq {
  org_id?: number;
  dept_id?: number;
  user_id?: number;
  catalog_id?: number;
  prefab_type?: string;
  prefab_tag?: string;
  include_dept?: boolean;
  include_org?: boolean;

  disease_id?: number;
  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  column_list?: string;
}

export interface PrefabRow {
  /** 行ID */
  prefab_id?: number;
  catalog_id?: number;
  org_id?: number;
  dept_id?: number;
  dept_name?: string;
  user_id?: number;
  user_name?: string;
  share_tag?: string;

  /** RX, ORDER */
  prefab_type?: string;
  prefab_name?: string;
  prefab_tag?: string;
  prefab_note?: string;

  disease_id?: number;
  disease_name?: string;

  gender_name?: string;
  age_min?: number;
  age_max?: number;
  age_unit?: string;

  sort_no?: string;
  kb_code?: string;
  valid_status?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPrefabListRes extends ApiResult {
  row_list?: PrefabRow[];
}

export interface GetPrefabDetailReq {
  prefab_id?: number;
  column_list?: string;
}

export interface PrefabDetailRow {
  prefab_id?: number;

  order_id?: number;
  order_type?: string;
  order_catalog?: string;
  order_content?: string;
  order_content_fmt?: string;
  order_usage?: string;
  order_usage_fmt?: string;
  order_note?: string;

  sort_no?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface GetPrefabDetailRes extends ApiResult {
  row_list?: PrefabDetailRow[];
}

/** 护士确认停止（停嘱校对） */
export interface EndOrderReq {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  order_no?: string;
  /** empty=now */
  end_time?: string;
  /** empty=session.user_name */
  end_user?: string;
  end_tag?: string;
  end_note?: string;
}

export interface EndOrderRes extends ApiResult {}

/** 护士校对 / 退回（退回时 return_order=true，并传 return_note） */
export interface VerifyOrderReq {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  order_no?: string;
  return_order?: boolean;
  return_tag?: string;
  return_note?: string;
  /** 0=session.user_id */
  user_id?: number;
  /** empty=session.user_name */
  user_name?: string;
}

export interface VerifyOrderRes extends ApiResult {}

/** 护士执行医嘱 */
export interface ExecOrderReq {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  order_no?: string;
  exec_time?: string;
  /** 可以是[未执行] */
  exec_tag?: string;
  /** 未执行原因 */
  exec_note?: string;
}

export interface ExecOrderRes extends ApiResult {}

/** 护士作废医嘱 */
export interface TerminateOrderReq {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  order_no?: string;
}

export interface TerminateOrderRes extends ApiResult {}

/** 护士取消校对 / 取消通过 */
export interface UndoVerifyOrderReq {
  /** 优先 */
  order_id?: number;
  /** 其次 */
  order_no?: string;
  undo_note?: string;
}

export interface UndoVerifyOrderRes extends ApiResult {}

/** 附加项目明细 */
export interface AttachOrderSubListReq {
  order_id: number;
  charge_list?: OrderSubChargeRow[];
  material_list?: OrderSubMaterialRow[];
}

export interface AttachOrderSubListRes extends ApiResult {}

/** 删除附加项目明细 */
export interface DetachOrderSubListReq {
  order_id: number;
  charge_id_list?: number[];
  material_id_list?: number[];
  detach_note?: string;
}

export interface DetachOrderSubListRes extends ApiResult {}