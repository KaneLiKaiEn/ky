import { retrieveItemList as retrieveBillItemList } from "@/api/bill";
import { retrieveItemList as retrieveDrugItemList } from "@/api/drug";
import { retrieveElemList } from "@/api/elem";
import { retrieveItemList as retrieveExamItemList } from "@/api/exam";
import { retrieveItemList as retrieveLabItemList } from "@/api/lab";
import { retrieveItemList as retrieveTreatItemList } from "@/api/treat";
import type { ElemRow } from "@/types/elem";
import { RETRIEVE_LIMIT } from "../constants";
import type { SourceItemOption, SourceKind } from "../types";

interface ItemLike {
  item_id?: number;
  item_no?: string;
  item_code?: string;
  item_name?: string;
  item_unit?: string;
  dosage_unit?: string;
  quantity_unit?: string;
  item_tag?: string;
  item_note?: string;
  sort_no?: string;
}

const optionLabel = (name?: string, code?: string) =>
  [name, code].filter(Boolean).join(" / ");

const mapElemRow = (row: ElemRow): SourceItemOption | null => {
  const key = row.elem_id ?? row.elem_code ?? row.elem_name;
  if (key == null || key === "") return null;
  return {
    value: `elem-${key}`,
    label: optionLabel(row.elem_name, row.elem_code),
    item_name: row.elem_name,
    item_code: row.elem_code,
    fill: {
      item_id: row.elem_id,
      item_name: row.elem_name ?? "",
      item_code: row.elem_code ?? "",
      item_no: row.elem_no ?? "",
      item_unit: row.elem_unit ?? "",
      item_value: row.value_init ?? "",
      item_tag: row.elem_tag ?? "",
      item_note: row.elem_note ?? "",
      sort_no: row.sort_no ?? "",
    },
  };
};

const mapItemRow = (
  row: ItemLike,
  source: Exclude<SourceKind, "elem">,
): SourceItemOption | null => {
  const key = row.item_id ?? row.item_code ?? row.item_name;
  if (key == null || key === "") return null;
  const itemUnit =
    source === "drug"
      ? row.dosage_unit || row.quantity_unit || ""
      : (row.item_unit ?? "");
  return {
    value: `${source}-${key}`,
    label: optionLabel(row.item_name, row.item_code),
    item_name: row.item_name,
    item_code: row.item_code,
    fill: {
      item_id: row.item_id,
      item_name: row.item_name ?? "",
      item_code: row.item_code ?? "",
      item_no: row.item_no ?? "",
      item_unit: itemUnit,
      item_tag: row.item_tag ?? "",
      item_note: row.item_note ?? "",
      sort_no: row.sort_no ?? "",
    },
  };
};

const compactOptions = (list: Array<SourceItemOption | null>) =>
  list.filter((item): item is SourceItemOption => item != null);

export const retrieveSourceItemList = async (
  source: SourceKind,
  params: { org_id?: number; retrieve_input?: string },
): Promise<SourceItemOption[]> => {
  const retrieve_input = params.retrieve_input;
  switch (source) {
    case "elem": {
      const res = await retrieveElemList({
        org_id: params.org_id,
        retrieve_input,
        retrieve_limit: RETRIEVE_LIMIT,
      });
      return compactOptions((res.row_list ?? []).map(mapElemRow));
    }
    case "drug": {
      const res = await retrieveDrugItemList({
        org_id: params.org_id,
        retrieve_input,
        retrieve_limit: RETRIEVE_LIMIT,
      });
      return compactOptions(
        (res.row_list ?? []).map((row) => mapItemRow(row, "drug")),
      );
    }
    case "lab": {
      const res = await retrieveLabItemList({
        retrieve_input,
        retrieve_limit: RETRIEVE_LIMIT,
      });
      return compactOptions(
        (res.item_list ?? []).map((row) => mapItemRow(row, "lab")),
      );
    }
    case "exam": {
      const res = await retrieveExamItemList({
        retrieve_input,
        retrieve_limit: RETRIEVE_LIMIT,
      });
      return compactOptions(
        (res.row_list ?? []).map((row) => mapItemRow(row, "exam")),
      );
    }
    case "treat": {
      const res = await retrieveTreatItemList({
        retrieve_input,
        retrieve_limit: RETRIEVE_LIMIT,
      });
      return compactOptions(
        (res.row_list ?? []).map((row) => mapItemRow(row, "treat")),
      );
    }
    case "bill": {
      const res = await retrieveBillItemList({
        org_id: params.org_id,
        retrieve_input,
        retrieve_limit: RETRIEVE_LIMIT,
      });
      return compactOptions(
        (res.row_list ?? []).map((row) => mapItemRow(row, "bill")),
      );
    }
    default:
      return [];
  }
};
