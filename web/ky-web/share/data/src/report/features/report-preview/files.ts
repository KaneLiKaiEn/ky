import { getReportStyle } from "../../api/report";
import { base64Blob } from "../../utils/media";
import {
  canvasLayout,
  leaves,
  replaceTitle,
  success,
  type DataRow,
  type Metadata,
  type Result,
  type Values,
  type Column,
} from "./model";
import type { Ticket } from "./runtime";

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name.replace(/[\\/:*?"<>|]/g, "_");
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function headerLayout(columns: Column[], values: Values) {
  const depth = (list: Column[]): number =>
    Math.max(
      1,
      ...list.map((c) => (c.children?.length ? depth(c.children) + 1 : 1)),
    );
  const levels = depth(columns);
  const cells: {
    row: number;
    col: number;
    endRow: number;
    endCol: number;
    value: string;
  }[] = [];
  let col = 1;
  const visit = (items: Column[], row: number) => {
    for (const item of items) {
      const start = col,
        width = leaves([item]).length;
      cells.push({
        row,
        col: start,
        endRow: item.children?.length ? row : levels,
        endCol: start + width - 1,
        value: replaceTitle(item.name, values),
      });
      if (item.children?.length) visit(item.children, row + 1);
      else col++;
    }
  };
  visit(columns, 1);
  return { levels, cells };
}
export async function excel(
  meta: Metadata,
  result: Result,
  rows: DataRow[],
  values: Values,
  ticket: Ticket,
) {
  const ExcelJS = await import("exceljs");
  ticket.check();
  const workbook = new ExcelJS.Workbook();
  const style = success(
    await ticket.run(() =>
      getReportStyle({ report_id: meta.property.report_id! }, ticket.signal),
    ),
  );
  ticket.check();
  const templated = !!style.style_content;
  if (templated) {
    if (style.style_format?.toLowerCase() !== "xlsx")
      throw new Error("导出模板必须为 XLSX 格式");
    await workbook.xlsx.load(
      await base64Blob(
        style.style_content!,
        "application/octet-stream",
      ).arrayBuffer(),
    );
    ticket.check();
  }
  const sheet = workbook.worksheets[0] || workbook.addWorksheet("报表");
  const flat = leaves(result.columns),
    canvas = meta.property.report_type === "CANVAS";
  let start = canvas ? 1 : meta.property.data_start || 1;
  if (!templated && !canvas) {
    const header = headerLayout(result.columns, values);
    for (const cell of header.cells) {
      sheet.getCell(cell.row, cell.col).value = cell.value;
      if (cell.row !== cell.endRow || cell.col !== cell.endCol)
        sheet.mergeCells(cell.row, cell.col, cell.endRow, cell.endCol);
    }
    start = header.levels + 1;
  }
  if (templated) {
    for (let r = 1; r < start; r++)
      sheet.getRow(r).eachCell((cell) => {
        if (typeof cell.value === "string")
          cell.value = replaceTitle(cell.value, values);
      });
  }
  flat.forEach((column, index) => {
    if (!templated) sheet.getColumn(index + 1).width = column.width / 7;
  });
  const layout = canvas
    ? canvasLayout(result.cells, rows.length, flat.length)
    : undefined;
  rows.forEach((row, r) =>
    flat.forEach((col, c) => {
      if (layout?.covered.has(`${r + 1}:${c + 1}`)) return;
      const cell = sheet.getCell(start + r, c + 1),
        value = row[col.key];
      cell.value =
        typeof value === "number" && Number.isFinite(value)
          ? value
          : value == null
            ? ""
            : String(value);
      cell.alignment = {
        ...cell.alignment,
        horizontal: col.align || "left",
        vertical: "middle",
        wrapText: true,
      };
    }),
  );
  if (canvas) {
    for (const cell of result.cells) {
      const target = sheet.getCell(cell.r, cell.c);
      if (!templated && (cell.mh || cell.mv))
        sheet.mergeCells(
          cell.r,
          cell.c,
          Math.min(rows.length, cell.r + (cell.mv || 0)),
          Math.min(flat.length, cell.c + (cell.mh || 0)),
        );
      target.alignment = {
        horizontal: (cell.ah as "left" | "center" | "right") || "left",
        vertical: (cell.av as "top" | "middle" | "bottom") || "middle",
        wrapText: true,
      };
      const color = (value: string | undefined) =>
        value && /^#?[\da-f]{6}$/i.test(value)
          ? { argb: `FF${value.replace("#", "")}` }
          : undefined;
      target.font = {
        ...target.font,
        name: cell.ff || target.font?.name,
        size: Number(cell.fs) || target.font?.size,
        color: color(cell.cf) || target.font?.color,
      };
      if (color(cell.cb))
        target.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: color(cell.cb)!,
        };
    }
  }
  ticket.check();
  const buffer = await workbook.xlsx.writeBuffer();
  ticket.check();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
