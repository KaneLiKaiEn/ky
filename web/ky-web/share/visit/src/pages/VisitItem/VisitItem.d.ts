import { EmrWorkType } from "../EmrWorkspace";
import type { ListMode } from "../InPatientList/type";
import type { VisitItemRow } from "./types";
export interface VisitItemProps {
  /**
   * 已组织好的展示数据。
   * 有值时直接使用，不再发起请求。
   */
  data?: VisitItemRow | null;
  /**
   * 就诊 ID。
   * 当 data 为空时，用该 ID 请求完整展示数据
   *（GetVisitProperty + GetAllergyInfo2 + GetDiagList）。
   */
  visitId?: number | null;
  /**
   * 列表模式，影响住院天数计算与展示：
   * - in: 在院天数（当前 - 入院）
   * - out: 出院天数（出院 - 入院，为 0 时记 1）
   * - transfer: 不展示天数
   */
  mode?: ListMode;
  /**
   * 外部加载态（仅在传入 data 的受控场景使用）。
   * 组件自行请求时忽略此值。
   */
  loading?: boolean;
  /** 是否高亮选中，由外部控制 */
  selected?: boolean;
  /** 为 true 时展示完整信息，为 false 时姓氏缩略 */
  collapsed?: boolean;
  /** 自行请求成功后回调 */
  onLoad?: (data: VisitItemRow) => void;
  /** 点击回调（始终回传组织后的 VisitItemRow） */
  onClick?: (data: VisitItemRow) => void;
  /** 工作类型（DOCTOR / NURSE），用于时限任务统计 */
  workType?: EmrWorkType;
  className?: string;
}
declare const VisitItem: ({
  data,
  visitId,
  mode,
  loading: loadingProp,
  selected,
  collapsed,
  onLoad,
  onClick,
  workType,
  className,
}: VisitItemProps) => import("react/jsx-runtime").JSX.Element | null;
export default VisitItem;
