import dayjs from "dayjs";
import type { CareRow } from "@/types/care";
import type { EmrRow } from "@/types/emr";
import type { Dict2ItemRow } from "@/types/sys";
import type { ElemOptionRow, ElemRow } from "@/types/elem";
import type {
  CellValue,
  NursingOption,
  NursingPage,
  NursingRow,
} from "./types";

const normalizeTime = (time: string) =>
  dayjs(time).second(0).format("YYYY-MM-DD HH:mm:ss");

export interface DictItem extends Dict2ItemRow {
  dict_name?: string;
  dict_note?: string;
  elemOptions?: NursingOption[];
  elemProperty?: ElemRow;
}

const isCheckboxType = (type?: string) =>
  (type ?? "").toUpperCase().includes("CHECKBOX");

const parseCheckbox = (content: string, options: NursingOption[] = []) =>
  content
    .split("、")
    .filter(Boolean)
    .map((text) => options.find((option) => option.option_text === text))
    .filter((option): option is NursingOption => !!option);

export function toOption(option: ElemOptionRow): NursingOption {
  return {
    ...option,
    label: option.option_text,
    value: option.option_text,
  };
}

export function buildRows(
  items: DictItem[],
  records: Array<CareRow | EmrRow>,
  page: NursingPage,
): NursingRow[] {
  const rows: NursingRow[] = items.map((item) => ({
    key: item.row_id ?? item.item_id ?? item.item_name ?? "",
    id: item.row_id ?? item.item_id,
    itemId: item.item_id,
    group: item.dict_name,
    label: item.item_name,
    unit: item.item_unit,
    type: item.item_tag,
    dictNote: item.dict_note,
    elemOptions: item.elemOptions,
    elemProperty: item.elemProperty,
    values: {},
  }));

  records.forEach((record) => {
    rows.forEach((row) => {
      if (page === "护理评估") {
        const emr = record as EmrRow;
        if (!emr.emr_id || !row.type?.includes("EVALUEATE_EMR")) return;
        if (emr.doc_name !== row.label || !emr.emr_time) return;
        row.values[normalizeTime(emr.emr_time)] = [
          emr.emr_id,
          emr.assess_score ?? "",
          emr.assess_result ?? "",
        ];
        return;
      }

      const care = record as CareRow;
      if (!care.care_id || !row.type?.includes("BASIC_CARE")) return;
      if (care.care_type !== row.label || !care.care_time) return;
      const content = care.care_content ?? "";
      const value: CellValue = isCheckboxType(row.type)
        ? [care.care_id, parseCheckbox(content, row.elemOptions)]
        : [care.care_id, content];
      row.values[normalizeTime(care.care_time)] = value;
    });
  });

  return rows;
}

export function careContentOf(value: CellValue | undefined) {
  if (!value) return "";
  const content = value[1];
  if (Array.isArray(content)) {
    return content
      .map((option) => option.option_text)
      .filter(Boolean)
      .join("、");
  }
  return String(content ?? "");
}
