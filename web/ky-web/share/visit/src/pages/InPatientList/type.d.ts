import { EmrWorkType } from "../EmrWorkspace";

/**
 * 住院患者列表标签
 */
export interface VisitItemTag {
  /** 标签文案 */
  label: string;
  /** 边框颜色 */
  border_color?: string;
  /** 背景颜色 */
  bg_color?: string;
  /** 文字颜色 */
  text_color?: string;
}
/**
 * 住院患者列表展示项
 */
export interface VisitItemRow {
  /** 就诊ID */
  visit_id: number;
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
}
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
export interface GetIpListReq {
  /** 机构ID */
  org_id?: number;
  /** 科室ID */
  dept_id?: number;
  /** 病区ID */
  ward_id?: number;
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
/**
 * 列表范围筛选（在院 / 出院共用；转科无此筛选）。
 * - mine: 我的 → 多传 user_id
 * - group: 医疗组 → 多传 group_id
 * - dept: 全科 → 仅 dept_id
 */
export type ListScope = "mine" | "group" | "dept";
/**
 * 列表类型。
 * - in: 在院 → GetIpList（无日期）
 * - out: 出院 → GetDischargeList（visit_start / visit_end）
 * - transfer: 转科 → GetTransferDeptList2（from_dept_id / from_ward_id + transfer_start / transfer_end）
 */
export type ListMode = "in" | "out" | "transfer";
/**
 * 转科状态
 * - NEW: 登记
 * - SEND: 转出
 * - RECV: 接收
 * - CANCEL: 取消
 */
export type TransferDeptStatus = "NEW" | "SEND" | "RECV" | "CANCEL" | string;
export interface InPatientListProps {
  /**
   * 外部已组装的住院患者列表。
   * 有值时直接展示，不再发起列表请求。
   */
  list?: VisitItemRow[];
  /**
   * 列表类型：在院 / 出院 / 转科。
   * 默认 in。
   */
  mode?: ListMode;
  /** 机构ID；无 list 时用于请求（在院） */
  org_id?: number;
  /** 科室ID；无 list 时用于请求（与 ward_id 至少传一个；转科写入 from_dept_id） */
  dept_id?: number;
  /** 病区ID；无 list 时用于请求（与 dept_id 至少传一个；转科写入 from_ward_id） */
  ward_id?: number;
  /**
   * 列表范围：我的 / 医疗组 / 全科（转科忽略）。
   * 自行请求时按范围补充 user_id / group_id（全科不加额外过滤）。
   */
  scope?: ListScope;
  /** 用户ID；scope=mine 时写入请求 */
  user_id?: number;
  /** 医疗组ID；scope=group 时写入请求（外层 GetUserActiveGroup 获取后传入） */
  group_id?: number;
  /** 出院：就诊开始日期 */
  visit_start?: string;
  /** 出院：就诊结束日期 */
  visit_end?: string;
  /** 转科：开始日期 */
  transfer_start?: string;
  /** 转科：结束日期 */
  transfer_end?: string;
  /**
   * 转科状态（GetTransferDeptList2 必传）。
   * 默认 SEND（转出）。
   */
  transfer_status?: TransferDeptStatus;
  /** 排除办理住院但还未入科的数据（仅在院） */
  exclude_preadmission?: boolean;
  /** 就诊字段选择 */
  column_visit?: string;
  /** 住院字段选择 */
  column_ip?: string;
  /**
   * 外部加载态（仅在传入 list 的受控场景使用）。
   * 组件自行请求时忽略此值。
   */
  loading?: boolean;
  /** 自行请求成功后回调（原始 visit / ip，未组织；转科时 ip_list 为空） */
  onLoad?: (data: { visit_list: VisitRow[]; ip_list: VisitIpRow[] }) => void;
  onSelect: (data: VisitItemRow) => void;
  activeId: number;
  /** 为 true 时展示完整信息，为 false 时姓氏缩略且列表宽 35px */
  collapsed?: boolean;
  /** 工作类型（DOCTOR / NURSE），传给 VisitItem 用于时限任务统计 */
  workType?: EmrWorkType;
  className?: string;
}
/** 出院患者列表请求 */
export interface GetDischargeListReq {
  /** 科室ID */
  dept_id?: number;
  /** 病区ID */
  ward_id?: number;
  /** 医疗组ID；scope=group 时传入 */
  group_id?: number;
  /** 用户ID；scope=mine 时传入 */
  user_id?: number;
  /** 就诊开始日期 */
  visit_start?: string;
  /** 就诊结束日期 */
  visit_end?: string;
  /** 就诊状态 */
  visit_status?: string;
  /** 就诊字段选择 */
  column_visit?: string;
  /** 住院字段选择 */
  column_ip?: string;
  /** 每页记录数，0=不分页 */
  page_size?: number;
  /** 获取第几页；page_size>0 且 page_no=0 时只返回 page_count */
  page_no?: number;
  /** 获取记录数限制，0=不限制；有分页时忽略 */
  row_limit?: number;
}
/** 出院患者列表响应 */
export interface GetDischargeListRes {
  /** 返回码 */
  code: number;
  /** 返回信息 */
  message: string;
  /** 提示信息 */
  hint: string;
  /** 总页数 */
  page_count?: number;
  /** 就诊列表 */
  visit_list: VisitRow[];
  /** 住院信息列表 */
  ip_list: VisitIpRow[];
}
/** 转科列表请求（GetTransferDeptList2） */
export interface GetTransferDeptList2Req {
  /**
   * 转出科室ID。
   * from_dept_id / from_ward_id / to_dept_id / to_ward_id 至少一项不为 0。
   */
  from_dept_id?: number;
  /** 转出病区ID */
  from_ward_id?: number;
  /** 转入科室ID */
  to_dept_id?: number;
  /** 转入病区ID */
  to_ward_id?: number;
  /**
   * 开始时间；无时间范围只查在线库。
   * 含义随 transfer_status 变化：NEW-登记时间，SEND-转出时间，RECV-接收时间，CANCEL-修改时间。
   */
  transfer_start?: string;
  /** 结束时间 */
  transfer_end?: string;
  /**
   * 转科状态（必传）
   * NEW-登记，SEND-转出，RECV-接收，CANCEL-取消
   */
  transfer_status: TransferDeptStatus;
  /** 返回字段选择 */
  column_list?: string;
}
/** 转科记录行 */
export interface TransferDeptRow {
  transfer_id?: number;
  visit_id?: number;
  transfer_status?: TransferDeptStatus;
  from_org_id?: number;
  from_org_name?: string;
  from_dept_id?: number;
  from_dept_name?: string;
  from_ward_id?: number;
  from_ward_name?: string;
  from_room_id?: number;
  from_room_no?: string;
  from_bed_id?: number;
  from_bed_no?: string;
  from_bed_service?: number;
  from_tag?: string;
  from_note?: string;
  admission_day?: number;
  to_org_id?: number;
  to_org_name?: string;
  to_dept_id?: number;
  to_dept_name?: string;
  to_ward_id?: number;
  to_ward_name?: string;
  to_room_id?: number;
  to_room_no?: string;
  to_bed_id?: number;
  to_bed_no?: string;
  to_bed_service?: number;
  to_tag?: string;
  to_note?: string;
  create_time?: string;
  create_session?: string;
  create_tag?: string;
  create_note?: string;
  send_time?: string;
  send_session?: string;
  send_tag?: string;
  send_note?: string;
  recv_time?: string;
  recv_session?: string;
  recv_tag?: string;
  recv_note?: string;
  link_name?: string;
  link_value?: number;
  link_tag?: string;
  link_data?: string;
  link_ext?: string;
  input_time?: string;
  input_session?: string;
  input_note?: string;
}
/** 转科列表响应（GetTransferDeptList2） */
export interface GetTransferDeptList2Res {
  /** 返回码 */
  code: number;
  /** 返回信息 */
  message: string;
  /** 提示信息 */
  hint: string;
  /** 转科列表 */
  transfer_list: TransferDeptRow[];
}
export interface RetrieveResultRow {
  visit_row?: VisitRow;
}
export interface RetrieveVisitListReq {
  retrieve_input?: string;
  retrieve_like?: boolean;
  visit_date?: string;
  visit_start?: string;
  visit_end?: string;
  dept_id_list?: number[];
  ward_id_list?: number[];
  visit_status?: string;
  column_visit?: string;
}
export interface RetrieveVisitListRes {
  code?: number;
  message?: string;
  hint?: string;
  result_list?: RetrieveResultRow[];
}
