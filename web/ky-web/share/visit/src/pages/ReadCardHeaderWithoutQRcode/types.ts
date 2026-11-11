import type { CardReadInfo } from "./types/card";
import type { GetPatientPropertyRes, PatientRow } from "./types/patient";

export interface ReadCardHeaderProps {
  /** 当前已读取的患者基本信息（中间展示区） */
  patient?: PatientRow | null;
  className?: string;
  /** 读卡 / 检索选中患者成功后的回调（父组件写入 store 等） */
  onPatientLoaded?: (data: GetPatientPropertyRes) => void;
  /**
   * 仅读卡回调：读卡并匹配患者后，将 read_info + patient_id 交给业务处理，不再走定位患者。
   * 提供时建议同时关闭 showPatientActions。
   */
  onReadInfo?: (
    readInfo: CardReadInfo,
    patientId: number,
  ) => void | Promise<void>;
  /** 清空当前患者 */
  onClear?: () => void;
  /** 编辑患者信息（有患者时才可点） */
  onEditInfo?: () => void;
  /** 读卡时自动建档，透传给读卡接口 */
  autoInsert?: boolean;
  /** 读卡时自动更新，透传给读卡接口 */
  autoUpdate?: boolean;
  /** 是否展示右侧「编辑信息 / 搜索患者」，默认 true */
  showPatientActions?: boolean;
}
