import type { VisitRow } from "../PatientInfo/types/visit";
export interface VisitSelectModalProps {
    open: boolean;
    /** 打开时默认的患者 ID */
    initialPatientId?: number | null;
    selecting?: boolean;
    onClose: () => void;
    onSelect: (visit: VisitRow) => void | Promise<void>;
}
/**
 * 选择就诊记录弹窗
 * - 头部：时间范围 + 患者 ID（边输入边检索）
 * - 表格固定表头；点击行用 visit_id 交给上层拉取 visit 服务数据
 */
declare const VisitSelectModal: React.FC<VisitSelectModalProps>;
export default VisitSelectModal;
