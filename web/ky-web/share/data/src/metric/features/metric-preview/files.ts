import type { ValueRow } from "./types";
import { flatten } from "./model";

export async function excelBlob(rows: ValueRow[]) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook(),
    sheet = workbook.addWorksheet("明细分析");
  sheet.columns = [
    { header: "名称", key: "name", width: 24 },
    { header: "值", key: "value", width: 18 },
    { header: "同比", key: "yoy", width: 14 },
    { header: "环比", key: "pop", width: 14 },
    { header: "目标", key: "goal", width: 20 },
  ];
  for (const row of flatten(rows)) {
    const added = sheet.addRow({
      name: row.object_name ?? "",
      value: row.metric_value_fmt ?? "",
      yoy: row.yoy_rate_fmt ?? "",
      pop: row.pop_rate_fmt ?? "",
      goal: row.goal_desc ?? "",
    });
    added.outlineLevel = Math.min(7, row.depth);
    added.getCell(1).alignment = { indent: Math.min(15, row.depth) };
  }
  sheet.properties.defaultRowHeight = 20;
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
export function download(url: string, name: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name.replace(/[\\/:*?"<>|]/g, "_");
  anchor.click();
}
export async function exportExcel(rows: ValueRow[], name: string) {
  const url = URL.createObjectURL(await excelBlob(rows));
  download(url, `${name}-同比-明细分析.xlsx`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
