import dayjs from "dayjs";
import type { VisitValueRow } from "@/types/emr";
import type { SysValueRow } from "@/types/form";
import type { FormElemValue } from "../types";

type ValueRow = VisitValueRow | SysValueRow;

export const toFormValues = (valueList: ValueRow[]): FormElemValue[] =>
  valueList
    .filter(
      (item): item is ValueRow & { section_id: number; elem_id: number } =>
        item.section_id != null && item.elem_id != null,
    )
    .map((item) => ({
      section_id: item.section_id,
      elem_id: item.elem_id,
      row_no: item.row_no,
      value_time: item.value_time,
      value_score: item.value_score,
      value_text: item.value_text ?? "",
      value_code: item.value_code,
      value_code_system: item.value_code_system,
      value_tag: item.value_tag,
      value_note: item.value_note,
    }));

export const formatCreateTime = (time?: string) =>
  time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "-";

export const isCommitted = (status?: string) => status === "COMMIT";
