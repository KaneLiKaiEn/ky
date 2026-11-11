import type { ElemRow } from "@/types/elem";
import type { SectionElemRow } from "@/types/form";
import type { ElemProp } from "../components/DataElem/types";

export const buildSectionDefinition = (
  section_id: number,
  sectionRows: SectionElemRow[],
  elems: ElemRow[],
): ElemProp[] => {
  const elemMap = new Map(
    elems
      .filter((elem): elem is ElemRow & { elem_id: number } => elem.elem_id != null)
      .map((elem) => [elem.elem_id, elem]),
  );

  return sectionRows.flatMap((row) => {
    if (row.elem_id == null) return [];
    const elem = elemMap.get(row.elem_id);
    if (!elem) return [];
    return [{
      section_id,
      row_id: row.row_id,
      elem_id: row.elem_id,
      elem_name: elem.elem_name ?? "",
      elem_title: row.elem_title ?? elem.elem_title ?? null,
      elem_unit: elem.elem_unit ?? null,
      elem_type: elem.elem_type ?? null,
      value_type: elem.value_type ?? null,
      value_length: elem.value_length ?? null,
      elem_width: row.elem_width ?? "",
      elem_tag: (row.elem_tag ?? "") + (elem.elem_tag ?? ""),
      elem_note: row.elem_note ?? elem.elem_note ?? "",
      support_init: Boolean(elem.value_text || elem.value_init),
    }];
  });
};

export const getElemKey = (elemProp: ElemProp, index: number): string =>
  elemProp.row_id != null ? String(elemProp.row_id) : `idx-${index}`;
