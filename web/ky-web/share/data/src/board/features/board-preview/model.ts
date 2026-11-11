import type { ArgValueRow, DatasetArgRow } from "../../types/references.d.ts";
import type {
  BoardComponentColRow,
  BoardComponentColThresholdRow,
} from "../../types/board.d.ts";

export type DataRow = Record<string, unknown>;
export interface PreviewCell {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  id: number;
}
export const supportedType = (type?: string) =>
  ["CHART", "TABLE", "FORM", "METRIC", "REPORT"].includes(type ?? "");
export const nativeType = (type?: string) =>
  ["CHART", "TABLE", "FORM"].includes(type ?? "");
export function componentBindings(
  type: "METRIC" | "REPORT",
  rows: { item_code?: string; item_value?: string; item_name?: string }[],
) {
  const bindings = rows
    .filter((row) => row.item_code === type)
    .map((row) => {
      const id = positiveId(row.item_value);
      if (!id)
        throw new Error(`${type === "METRIC" ? "指标" : "报表"}绑定 ID 无效`);
      return { id, title: row.item_name };
    });
  if (type === "REPORT" && bindings.length > 1)
    throw new Error("一个报表组件只能绑定一张报表");
  return bindings;
}
export const hasTag = (value: string | undefined, tag: string) =>
  (value ?? "").toUpperCase().includes(`[${tag.toUpperCase()}]`);
export function positiveId(value: unknown): number | undefined {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}
export function relatedParams(params: URLSearchParams, boardId?: number) {
  const next = new URLSearchParams(params);
  if (boardId) next.set("related_board_id", String(boardId));
  else next.delete("related_board_id");
  return next;
}
export function decodeJson(data: unknown): unknown {
  if (data !== null && typeof data === "object") return data;
  if (typeof data !== "string" || !data.trim())
    throw new Error("接口未返回有效 JSON 数据");
  try {
    return JSON.parse(data);
  } catch {
    /* protobuf bytes */
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        Uint8Array.from(atob(data), (c) => c.charCodeAt(0)),
      ),
    );
  } catch {
    throw new Error("JSON 数据解析失败");
  }
}
export function dataRows(data: unknown): DataRow[] {
  const rows = decodeJson(data);
  if (
    !Array.isArray(rows) ||
    rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))
  )
    throw new Error("行数据格式错误，应为对象数组");
  return rows;
}
export function mergeArguments(
  ...lists: readonly (readonly ArgValueRow[])[]
): ArgValueRow[] {
  const values = new Map<string, ArgValueRow>();
  for (const list of lists)
    for (const row of list) {
      if (!row.arg_code) continue;
      const previous = values.get(row.arg_code);
      values.set(row.arg_code, {
        arg_code: row.arg_code,
        arg_type: row.arg_type ?? previous?.arg_type ?? "STR",
        arg_value: String(row.arg_value ?? ""),
      });
    }
  return [...values.values()];
}
export function argumentRows(
  rows: DatasetArgRow[],
  values: Record<string, unknown>,
): ArgValueRow[] {
  return mergeArguments(
    rows.map((row) => ({
      arg_code: row.arg_code,
      arg_type: row.arg_type,
      arg_value: String(values[row.arg_code ?? ""] ?? ""),
    })),
  );
}
export function parsePreviewLayout(content: string): PreviewCell[] {
  let rows: unknown;
  try {
    rows = JSON.parse(content || "[]");
  } catch {
    throw new Error("布局内容不是有效 JSON");
  }
  if (!Array.isArray(rows)) throw new Error("布局应为格子数组");
  const seen = new Set<string>();
  return rows.map((row) => {
    if (!row || typeof row !== "object") throw new Error("布局中存在无效格子");
    const key = String(row.i ?? "");
    if (!key || seen.has(key)) throw new Error("布局格子标识缺失或重复");
    seen.add(key);
    if (
      [row.x, row.y, row.w, row.h].some(
        (v) => typeof v !== "number" || !Number.isFinite(v),
      ) ||
      row.x < 0 ||
      row.y < 0 ||
      row.w <= 0 ||
      row.h <= 0 ||
      row.x + row.w > 12
    )
      throw new Error(`布局 ${key} 超出 12 列网格范围或尺寸无效`);
    // Historical fractional positions are valid for display. Never mutate the stored layout.
    return {
      i: key,
      x: row.x,
      y: row.y,
      w: row.w,
      h: row.h,
      id: positiveId(row.id) ?? 0,
    };
  });
}
export function cellGeometry(
  cell: PreviewCell,
  width: number,
  rowHeight: number,
  gap = 8,
) {
  const unit = (width - gap) / 12;
  return {
    left: gap + cell.x * unit,
    top: gap + cell.y * (rowHeight + gap),
    width: Math.max(1, cell.w * unit - gap),
    height: Math.max(1, cell.h * rowHeight + (cell.h - 1) * gap),
  };
}
export function refreshTargets(ids: number[], source = 0, target = 0) {
  return [...new Set(ids)].filter(
    (id) => id !== source && (!target || id === target),
  );
}
const finite = (v: unknown) =>
  v !== "" && v !== null && v !== undefined && Number.isFinite(Number(v));
export function thresholdClass(
  rows: BoardComponentColThresholdRow[],
  value: unknown,
): string {
  let result = "";
  for (const row of rows) {
    const list = row.threshold_list
      ?.match(/\[([^\]]*)\]/g)
      ?.map((item) => item.slice(1, -1));
    const match = list?.length
      ? list.includes(String(value))
      : finite(value) &&
        (finite(row.threshold_min) || finite(row.threshold_max)) &&
        (!finite(row.threshold_min) ||
          Number(value) >= Number(row.threshold_min)) &&
        (!finite(row.threshold_max) ||
          Number(value) <= Number(row.threshold_max));
    if (match) result = row.class_name ?? "";
  }
  return result;
}
const named: Record<string, string> = {
  blue: "#0000ff",
  orange: "#ffa500",
  red: "#ff0000",
  green: "#008000",
  yellow: "#ffff00",
  white: "#ffffff",
  black: "#000000",
};
function rgb(value?: string): number[] | undefined {
  const hex = named[value?.toLowerCase() ?? ""] ?? value;
  if (!hex) return;
  if (/^#[\da-f]{3}$/i.test(hex))
    return hex
      .slice(1)
      .split("")
      .map((v) => parseInt(v + v, 16));
  if (/^#[\da-f]{6}$/i.test(hex))
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const match = hex.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,[^)]+)?\)$/i,
  );
  return match
    ? match.slice(1, 4).map((v) => Math.min(255, Number(v)))
    : undefined;
}
export function colorScale(col: BoardComponentColRow, value: unknown) {
  if (
    !finite(value) ||
    !finite(col.threshold_min) ||
    !finite(col.threshold_max)
  )
    return undefined;
  const min = Number(col.threshold_min),
    max = Number(col.threshold_max);
  if (max <= min) return undefined;
  const colors = [col.color_min, col.color_mean, col.color_max]
    .map(rgb)
    .filter((c): c is number[] => !!c);
  if (colors.length < 2) return undefined;
  const progress = Math.max(
    0,
    Math.min(1, (Number(value) - min) / (max - min)),
  );
  const position = progress * (colors.length - 1),
    index = Math.min(colors.length - 2, Math.floor(position));
  const color = colors[index].map((v, i) =>
    Math.round(v + (colors[index + 1][i] - v) * (position - index)),
  );
  return {
    background: `rgb(${color.join(", ")})`,
    color:
      color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114 > 128
        ? "#000"
        : "#fff",
    percent: progress * 100,
  };
}
export function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
