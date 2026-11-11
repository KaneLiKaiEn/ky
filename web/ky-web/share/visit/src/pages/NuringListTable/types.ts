import type { Dayjs } from "dayjs";
import type { CareRow } from "@/types/care";
import type { ElemOptionRow, ElemRow } from "@/types/elem";
import type { EmrRow } from "@/types/emr";
import type { VisitPatientRow } from "@/types/visit";

export type NursingPage = "基础护理" | "护理评估";

export type ShiftType = "all" | "day" | "night";

export type CellValue =
  | [number, string | NursingOption[]]
  | [number, number | string, string];

export type NursingOption = ElemOptionRow & {
  label?: string;
  value?: string;
};

export interface NursingRow {
  key: string | number;
  id?: string | number;
  itemId?: number;
  group?: string;
  label?: string;
  unit?: string;
  type?: string;
  dictNote?: string;
  elemOptions?: NursingOption[];
  elemProperty?: ElemRow;
  values: Record<string, CellValue>;
}

export interface CopyInfo {
  time: string;
  row: NursingRow;
}

export interface ColumnCopy {
  time: string;
  rows: NursingRow[];
}

export interface EmrDialogState {
  open: boolean;
  emrId: number;
  docName: string;
  emrTime: string;
  patient?: VisitPatientRow;
  /** 当前评估项目的选项，图表用 option_score / option_note 画风险区间 */
  elemOptions?: NursingOption[];
}

export interface NursingMatrixProps {
  visit_id?: number;
  /** 基础护理、护理评估共用一套矩阵，用页面类型切换数据和单元格行为 */
  page: NursingPage;
  className?: string;
}

export type MatrixRecord = CareRow | EmrRow;

export interface TimeModalState {
  open: boolean;
}

export type HeaderAction = "add" | "copy" | "paste" | "delete";

export interface ShiftDate {
  date: Dayjs;
  shift: ShiftType;
}
