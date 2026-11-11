import { cleanRow, encodeTags, id, text } from "comm/utils";
import type {
  DatasetArgRow,
  DatasetRow,
  SubsetRow,
} from "../../types/dataset.d.ts";
export const argumentTypes = ["STR", "INT", "DEC", "DATE", "DATETIME"];
export const sourceTypes = ["OPTION", "SQL", "DATASET", "DICT"];
export function argumentPayload(rows: DatasetArgRow[], datasetId: number) {
  const codes = new Set<string>();
  return rows.map((row) => {
    const code = row.arg_code?.trim();
    if (!code || !row.arg_name?.trim())
      throw new Error("参数编码和名称不能为空");
    if (codes.has(code)) throw new Error(`参数编码重复：${code}`);
    codes.add(code);
    if (
      (row.source_type === "SQL" || row.source_type === "DATASET") &&
      !id(row.source_id)
    )
      throw new Error(`请为参数 ${code} 选择来源`);
    if (
      row.value_min &&
      row.value_max &&
      ["INT", "DEC"].includes(row.arg_type || "") &&
      Number(row.value_min) > Number(row.value_max)
    )
      throw new Error(`参数 ${code} 的最小值不能大于最大值`);
    return cleanRow({
      ...row,
      dataset_id: datasetId,
      arg_code: code,
      source_tag: encodeTags(row.source_tag),
    });
  });
}
export const testArguments = (rows: DatasetArgRow[]) =>
  rows.map((row) => ({
    arg_code: text(row.arg_code),
    arg_type: text(row.arg_type || "STR"),
    arg_value: text(row.arg_value),
  }));
export function propertyPayload<T extends DatasetRow | SubsetRow>(
  baseline: T,
  values: Partial<T>,
): T {
  return cleanRow({ ...baseline, ...values });
}
