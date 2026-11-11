import { forwardRef } from "react";
import MainContent, {
  type CareRecordHandle,
} from "./components/main-content/MainContent";
import type { CareRecordTableColumnKey } from "./columns";
import type { CareRecordRow } from "./utils/care-related";

export type { CareRecordRow };
export type { CareRecordHandle };
export type { CareRecordTableColumnKey, CareRecordVitalColumnKey } from "./columns";
export {
  CARE_RECORD_TABLE_COLUMNS,
  CARE_RECORD_VITAL_COLUMN_KEYS,
  shouldShowCareContentForm,
  shouldShowVitalField,
  shouldShowVitalForm,
} from "./columns";

export type CareLinkFilter = {
  link_name: string;
  link_value: number | string;
  link_tag?: string;
};

export interface CareRecordProps {
  visit_id?: number;
  /**
   * 为 true 时可新增/编辑、转护理等级、录入吸氧与入出量；
   * 为 false 时仅显示表格查看与打印（无下半录入区）。
   */
  isEdit?: boolean;
  /**
   * 录入方式：
   * - panel：表格下方分栏录入（默认）
   * - modal：仅表格，新增/编辑用弹窗
   */
  entryMode?: "panel" | "modal";
  /** 仅展示匹配的关联护理记录；新增时默认并锁定该关联 */
  linkFilter?: CareLinkFilter;
  className?: string;
  /** 双击表格行回调（如交接班追加病情措施） */
  onRowDoubleClick?: (record: CareRecordRow) => void;
  /**
   * 表格数据列展示范围；未传则展示全部列。
   * 仅控制表头/数据列，左侧勾选/删除或刷新列不受影响。
   */
  visibleColumns?: readonly CareRecordTableColumnKey[];
  /**
   * 为 true 时体征等在弹窗录入，不展示表格下方分栏（等同 entryMode=modal 的布局）。
   * 可与 entryMode=panel 组合，仅关闭下半区并走弹窗。
   */
  vitalEntryInModal?: boolean;
  /** 为 false 时不展示「转护理等级」按钮 */
  showTransferCareLevel?: boolean;
  /**
   * 为 true 时在工具栏展示「新增」（弹窗录入场景，位于左侧查询区之后）。
   * 默认不展示，ICU 等场景传 true。
   */
  showAddButton?: boolean;
  /**
   * 为 false 时表格使用 Ant Design 默认字号；默认 true 为紧凑 11px 样式。
   */
  compactTableFont?: boolean;
  /** 为 true 时在病情措施区展示「载入24小时入出量」按钮（默认不展示） */
  showLoad24HourInOut?: boolean;
  /** 为 false 时不展示「关联手术」勾选与手术选择（默认展示） */
  showLinkSurgery?: boolean;
  /** 为 true 时在病情措施区展示「引用」按钮（默认不展示） */
  showReportReference?: boolean;
}

/**
 * 护理记录共享页。
 * isEdit=true：上列表删除/刷新/提交，下录入新增编辑，可转护理等级、录入吸氧/入出量。
 * isEdit=false：仅表格与打印，无下半录入区、无转护理等级、不可录入吸氧/入出量。
 * entryMode=modal：仅表格，新增/编辑走弹窗。
 * visibleColumns：限定表格数据列。
 * vitalEntryInModal：不展示下半分栏，体征等走弹窗（可与 entryMode=panel 同用）。
 */
const CareRecord = forwardRef<CareRecordHandle, CareRecordProps>(function CareRecord(
  {
  visit_id,
  isEdit = false,
  entryMode = "panel",
  linkFilter,
  className,
  onRowDoubleClick,
  visibleColumns,
  vitalEntryInModal = false,
  showTransferCareLevel = true,
  showAddButton = false,
  compactTableFont = true,
  showLoad24HourInOut = false,
  showLinkSurgery = true,
  showReportReference = false,
  },
  ref,
) {
  const validVisitId =
    visit_id != null && Number.isFinite(visit_id) && visit_id > 0
      ? visit_id
      : undefined;

  return (
    <div
      className={
        className ?? "flex h-full min-h-0 flex-col overflow-hidden"
      }
    >
      <MainContent
        ref={ref}
        key={`${validVisitId ?? "empty"}-${entryMode}-${vitalEntryInModal}-${visibleColumns?.join(",") ?? "all"}-${linkFilter?.link_name ?? ""}-${linkFilter?.link_value ?? ""}-${linkFilter?.link_tag ?? ""}`}
        visitId={validVisitId}
        isEdit={isEdit}
        entryMode={entryMode}
        linkFilter={linkFilter}
        onRowDoubleClick={onRowDoubleClick}
        visibleColumns={visibleColumns}
        vitalEntryInModal={vitalEntryInModal}
        showTransferCareLevel={showTransferCareLevel}
        showAddButton={showAddButton}
        compactTableFont={compactTableFont}
        showLoad24HourInOut={showLoad24HourInOut}
        showLinkSurgery={showLinkSurgery}
        showReportReference={showReportReference}
      />
    </div>
  );
});

export default CareRecord;

export type { CareRecordProps as CareRecordPageProps };
