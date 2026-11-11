import type { ElemProp, ElemValue, FormContext } from "../components/DataElem/types";
import type { FieldValue } from "./fieldValue";

export interface MultiRowContext extends Pick<FormContext, "form_id" | "visit_id" | "baby_id" | "emr_id"> {
  section_id: number;
}

export const getMultiRowScopeKey = (context: MultiRowContext): string => JSON.stringify([
  context.section_id, context.form_id, context.visit_id, context.baby_id, context.emr_id,
]);

/** The first saved EMR ID belongs to the draft currently being edited. */
export const isDraftRowsBinding = (previous: MultiRowContext, next: MultiRowContext): boolean =>
  previous.emr_id == null && next.emr_id != null
  && previous.section_id === next.section_id
  && previous.form_id === next.form_id
  && previous.visit_id === next.visit_id
  && previous.baby_id === next.baby_id;

export interface CellValue extends FieldValue {
  value_score?: number;
}

/** id is an editing identity; persisted row_no is assigned when serializing. */
export interface TableRow {
  id: number;
  values: Record<number, CellValue>;
}

export const EMPTY_CELL: CellValue = { value_text: "" };

export const resolveColumnLabel = (
  elem_title: string | null,
  elem_name: string,
): string => !elem_title || elem_title === "null" ? elem_name : elem_title;

const toInitCellText = (raw: unknown): string => raw == null ? "" : String(raw);

/** Map GetSectionInitData rows onto table columns. Keys are column titles. */
export const mapSectionInitDataToRows = (
  data: unknown,
  elemList: ElemProp[],
  allocateId?: () => number,
): TableRow[] => {
  if (!Array.isArray(data)) return [];
  let nextId = 1;
  return data.map((rowObj) => {
    const safeRow = rowObj && typeof rowObj === "object" && !Array.isArray(rowObj)
      ? rowObj as Record<string, unknown>
      : {};
    const titleUsageCount: Record<string, number> = {};
    const values: Record<number, CellValue> = {};
    elemList.forEach((elem, fieldIndex) => {
      const title = resolveColumnLabel(elem.elem_title, elem.elem_name);
      let rawValue: unknown;
      if (title && Object.prototype.hasOwnProperty.call(safeRow, title)) {
        const matched = safeRow[title];
        if (Array.isArray(matched)) {
          const index = titleUsageCount[title] ?? 0;
          rawValue = matched[index];
          titleUsageCount[title] = index + 1;
        } else {
          rawValue = matched;
        }
      } else {
        rawValue = Object.values(safeRow)[fieldIndex];
      }
      values[elem.elem_id] = { value_text: toInitCellText(rawValue) };
    });
    return { id: allocateId ? allocateId() : nextId++, values };
  });
};

export const isCellEmpty = (cell: CellValue | undefined): boolean => !cell || (
  !(cell.value_text ?? "").trim()
  && !(cell.value_code ?? "").trim()
  && !(cell.value_note ?? "").trim()
);

export const isRowEmpty = (row: TableRow, elemList: ElemProp[]): boolean =>
  elemList.every((elem) => isCellEmpty(row.values[elem.elem_id]));

export const buildInitialRows = (
  sectionValues?: ElemValue[],
  allocateId?: () => number,
): TableRow[] => {
  const valuesByRow = new Map<number, Record<number, CellValue>>();
  for (const value of sectionValues ?? []) {
    if (value.elem_id == null) continue;
    const rowNo = value.row_no ?? 1;
    const values = valuesByRow.get(rowNo) ?? {};
    values[value.elem_id] = {
      value_text: value.value_text,
      value_code: value.value_code,
      value_note: value.value_note,
      ...(value.value_score != null ? { value_score: value.value_score } : {}),
    };
    valuesByRow.set(rowNo, values);
  }
  let nextId = 1;
  return Array.from(valuesByRow.entries()).sort(([a], [b]) => a - b)
    .map(([, values]) => ({ id: allocateId ? allocateId() : nextId++, values }));
};

export const serializeRows = (
  section_id: number,
  rows: TableRow[],
  elemList: ElemProp[],
): ElemValue[] => rows.filter((row) => !isRowEmpty(row, elemList))
  .flatMap((row, index) => elemList.map((elem) => {
    const cell = row.values[elem.elem_id] ?? EMPTY_CELL;
    return {
      section_id,
      elem_id: elem.elem_id,
      row_no: index + 1,
      value_text: cell.value_text ?? "",
      value_code: cell.value_code || undefined,
      value_note: cell.value_note || undefined,
      ...(cell.value_score != null ? { value_score: cell.value_score } : {}),
    };
  }));
