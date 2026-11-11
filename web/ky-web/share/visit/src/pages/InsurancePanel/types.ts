import type { SettleServiceInfo } from "./api";

/**
 * 面板字段。
 * 放在父表单内时写入同一组名称，调用方初始化、保存时直接读写；
 * 未包在 Form 内时由面板内部维护。
 */
export interface InsuranceFormValues {
  /** 患者类型 code：dict=insurance.type */
  insurance_type?: string;
  insurance_name?: string;
  /** 结算方式 code */
  settle_type?: string;
  settle_name?: string;
  insurance_no?: string;
  insurance_code?: string;
}

/** onSettleServiceInfo 回调载荷 */
export interface SettleServiceInfoPayload {
  /** 当前结算方式 */
  settle_type?: string | null;
  /** GetSettleServiceInfo 结果；失败或清空时为 null */
  info: SettleServiceInfo | null;
}

export interface InsurancePanelProps {
  disabled?: boolean;
  /**
   * 当前患者 ID。
   * 用于查询医保状态 / 登记号；无 visitId 时还会请求 patient/GetStatusProperty
   * 以回填 settle_type、insurance_type 等初始值（单独挂载场景）。
   */
  patientId?: number | null;
  /**
   * 有值且不为 0 时，参保地、医保状态、结算方式初始值走 visit/GetStatusProperty。
   * 为空或 0 时仍走原有结算服务 / 患者状态。
   */
  visitId?: number | null;
  /** 就诊维度刷卡更新成功后递增，用于重新拉取医保状态 */
  visitStatusNonce?: number;
  /**
   * true=就诊维度（护士站等）：
   * - 患者类型不过滤 [VISIT] 字典项（如工伤）
   * - 结算方式额外保留「自费」
   * - 有就诊且非自费时展示 status.handle_no
   */
  fromVisit?: boolean;
  /** true 时非自费患者类型下隐藏「自费」结算方式 */
  filterSelfPaid?: boolean;
  /** 状态属性中的参保地区域 ID。无就诊时作为参保地兜底 */
  insuranceDistrict?: string | null;
  /**
   * GetSettleServiceInfo 结果回调（结算方式在组件内切换 / 初始化后自动请求）。
   * 同时带回当前 settle_type；失败或清空时 info 为 null。
   */
  onSettleServiceInfo?: (payload: SettleServiceInfoPayload) => void;
}
