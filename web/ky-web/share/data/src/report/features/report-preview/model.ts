import type { ArgValueRow } from "../../types/source.d.ts";
import type {
  ReportArgRow,
  ReportCell,
  ReportRow,
  PreviewResult,
} from "../../types/report.d.ts";
import { id, text } from "comm/utils";

export type DataRow = Record<string, unknown>;
export type Values = Record<string, unknown>;
export type PageSize = number | "all";
export interface Column {
  key: string;
  name: string;
  width: number;
  children?: Column[];
  align?: "left" | "center" | "right";
  frozen?: boolean;
  editable?: boolean;
  sum?: boolean;
  distinct?: boolean;
  ln?: string;
  lv?: string;
  la?: string;
  lt?: string;
  lo?: string;
}
export interface Sort {
  key: string;
  order: "ascend" | "descend";
}
export interface Option {
  item_code: string | number;
  item_name: string;
}
export interface Argument extends ReportArgRow {
  options?: Option[];
}
export interface Metadata {
  property: ReportRow;
  args: Argument[];
  columns: Column[];
  defaults: Values;
}
export interface Result {
  rows: DataRow[];
  columns: Column[];
  cells: ReportCell[];
  total: number;
  pdf?: string;
}
export interface Snapshot {
  values: Values;
  args: ArgValueRow[];
  page: number;
  size: PageSize;
}
export interface Link {
  ln?: string;
  lv?: string;
  la?: string;
  lt?: string;
  lo?: string;
}

export const hasTag = (tags: string | undefined, tag: string) =>
  new RegExp(`\\[${tag}\\]`, "i").test(tags ?? "");
export function success<T extends PreviewResult>(response: T): T {
  if (response.code !== 0)
    throw new Error(response.message || response.hint || "报表接口返回失败");
  return response;
}
export function decodeJson(data: unknown): unknown {
  if (data !== null && typeof data === "object") return data;
  if (typeof data !== "string" || !data.trim())
    throw new Error("接口未返回有效 JSON 数据");
  try {
    return JSON.parse(data);
  } catch {
    /* protobuf bytes are base64 UTF-8 JSON */
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        Uint8Array.from(atob(data), (c) => c.charCodeAt(0)),
      ),
    );
  } catch {
    throw new Error("报表 JSON 数据解析失败");
  }
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function dataRows(data: unknown): DataRow[] {
  const rows = decodeJson(data);
  if (!Array.isArray(rows) || !rows.every(object))
    throw new Error("报表行数据格式错误");
  return rows;
}
export function columnsFrom(data: unknown, freeze = 0): Column[] {
  const source = decodeJson(data);
  if (!Array.isArray(source)) throw new Error("报表列数据格式错误");
  let leafIndex = 0,
    groupIndex = 0;
  const keys = new Set<string>();
  const convert = (items: unknown[]): Column[] =>
    items.map((item) => {
      if (!object(item)) throw new Error("报表列数据格式错误");
      const key = text(item.key || item.col_code);
      const children =
        Array.isArray(item.children) && item.children.length
          ? convert(item.children)
          : undefined;
      if (!key && !children) throw new Error("报表列缺少字段代码");
      if (!children && keys.has(key)) throw new Error(`报表列字段重复：${key}`);
      if (!children) keys.add(key);
      const align = text(item.align || item.ah || item.col_align).toLowerCase();
      const tag = text(item.col_tag);
      return {
        key: key || `group:${++groupIndex}`,
        name: text(item.name ?? item.col_name),
        width: Math.max(50, Number(item.width || item.col_width) || 140),
        children,
        align: ["left", "center", "right"].includes(align)
          ? (align as Column["align"])
          : undefined,
        frozen: !children && (++leafIndex <= freeze || item.frozen === true),
        editable: item.editable === true || hasTag(tag, "EDIT"),
        sum: item.sum === true || hasTag(tag, "SUM"),
        distinct: item.distinct === true || hasTag(tag, "DISTINCT"),
        ln: text(item.ln ?? item.link_name),
        lv: text(item.lv ?? item.link_value),
        la: text(item.la ?? item.link_arg),
        lt: text(item.lt ?? item.link_tag),
        lo: text(item.lo ?? item.link_note),
      };
    });
  return convert(source);
}
export function leaves(columns: Column[]): Column[] {
  return columns.flatMap((c) =>
    c.children?.length ? leaves(c.children) : [c],
  );
}
export function pivotResult(data: unknown): Pick<Result, "rows" | "columns"> {
  const result = decodeJson(data);
  if (!object(result)) throw new Error("透视/表单数据格式错误");
  return { rows: dataRows(result.Row), columns: columnsFrom(result.Column) };
}
export function canvasRows(cells: ReportCell[], columns: Column[]): DataRow[] {
  const flat = leaves(columns),
    positions = new Map<string, ReportCell>();
  let count = 0;
  for (const cell of cells) {
    if (
      !Number.isSafeInteger(cell.r) ||
      cell.r < 1 ||
      !Number.isSafeInteger(cell.c) ||
      cell.c < 1 ||
      cell.c > flat.length
    )
      throw new Error("画布单元格坐标错误");
    const key = `${cell.r}:${cell.c}`;
    if (positions.has(key)) throw new Error("画布存在重复单元格");
    positions.set(key, cell);
    count = Math.max(count, cell.r + Math.max(0, cell.mv || 0));
  }
  return Array.from({ length: count }, (_, i) =>
    Object.fromEntries(
      flat.map((c, j) => [c.key, positions.get(`${i + 1}:${j + 1}`)?.v ?? ""]),
    ),
  );
}
export const isOption = (arg: ReportArgRow) =>
  ["OPTION", "SQL", "DATASET", "DICT"].includes(arg.source_type ?? "");
export const multiple = (arg: ReportArgRow) =>
  isOption(arg) && !hasTag(arg.arg_tag, "SINGLE");
export function defaultsFor(args: ReportArgRow[], overrides: Values): Values {
  return Object.fromEntries(
    args.map((arg) => {
      const key = arg.arg_code || "";
      let value = Object.prototype.hasOwnProperty.call(overrides, key)
        ? overrides[key]
        : arg.arg_value;
      if (multiple(arg)) {
        if (typeof value === "string") {
          if (value.trim().startsWith("[")) {
            try {
              const parsed = JSON.parse(value);
              value = Array.isArray(parsed) ? parsed : value;
            } catch {
              /* comma values remain supported */
            }
          }
          if (typeof value === "string")
            value = value === "" ? [] : value.split(",");
        }
        if (value == null) value = [];
        if (Array.isArray(value)) value = value.map(text);
      } else if (isOption(arg)) value = text(value);
      return [key, value ?? ""];
    }),
  );
}
export const valueText = (value: unknown): string =>
  Array.isArray(value) ? value.map(text).join(",") : text(value);
export function argumentsFor(
  args: ReportArgRow[],
  values: Values,
): ArgValueRow[] {
  return args.map((arg) => ({
    arg_code: arg.arg_code,
    arg_type: arg.arg_type,
    arg_value: valueText(values[arg.arg_code || ""]),
  }));
}
export function validateValues(args: Argument[], values: Values): void {
  for (const arg of args) {
    const value = valueText(values[arg.arg_code || ""]),
      label = arg.arg_name || arg.arg_code;
    if (!value) continue;
    if (
      arg.arg_type === "INT" &&
      (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
    )
      throw new Error(`${label}请输入整数`);
    if (arg.arg_type === "DEC" && !Number.isFinite(Number(value)))
      throw new Error(`${label}请输入数字`);
    if (["INT", "DEC"].includes(arg.arg_type || "")) {
      if (arg.value_min && Number(value) < Number(arg.value_min))
        throw new Error(`${label}不能小于 ${arg.value_min}`);
      if (arg.value_max && Number(value) > Number(arg.value_max))
        throw new Error(`${label}不能大于 ${arg.value_max}`);
    }
    if (arg.arg_type === "PERIOD") parsePeriod(value);
    if (["DATE", "DATETIME"].includes(arg.arg_type || "")) {
      const date = value.slice(0, 10);
      const time = value.slice(10);
      if (
        !validDate(date) ||
        (arg.arg_type === "DATE"
          ? !!time
          : !/^ ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time))
      )
        throw new Error(`${label}日期格式无效`);
    }
  }
}
export function autoQuery(args: ReportArgRow[], values: Values) {
  return args.every((arg) => valueText(values[arg.arg_code || ""]) !== "");
}
export function sortRows(rows: DataRow[], sorts: Sort[]): DataRow[] {
  return sorts.length
    ? [...rows].sort((a, b) => {
        for (const sort of sorts) {
          const x = a[sort.key],
            y = b[sort.key];
          let result = x == null ? (y == null ? 0 : 1) : y == null ? -1 : 0;
          if (x != null && y != null) {
            const nx = Number(x),
              ny = Number(y);
            result =
              text(x).trim() &&
              text(y).trim() &&
              Number.isFinite(nx) &&
              Number.isFinite(ny)
                ? nx - ny
                : text(x).localeCompare(text(y), "zh-CN");
          }
          if (result) return sort.order === "ascend" ? result : -result;
        }
        return 0;
      })
    : rows;
}
export function distinctSpans(rows: DataRow[], key: string): number[] {
  const spans = Array<number>(rows.length).fill(0);
  for (let i = 0; i < rows.length;) {
    let end = i + 1;
    while (end < rows.length && rows[end][key] === rows[i][key]) end++;
    spans[i] = end - i;
    i = end;
  }
  return spans;
}
export function canvasLayout(
  cells: ReportCell[],
  rowCount: number,
  colCount: number,
) {
  const positions = new Map<string, ReportCell>(),
    covered = new Set<string>();
  for (const cell of cells) positions.set(`${cell.r}:${cell.c}`, cell);
  for (let r = 1; r <= rowCount; r++)
    for (let c = 1; c <= colCount; c++) {
      if (covered.has(`${r}:${c}`)) continue;
      const cell = positions.get(`${r}:${c}`);
      const height = Math.min(rowCount - r, Math.max(0, cell?.mv || 0));
      const width = Math.min(colCount - c, Math.max(0, cell?.mh || 0));
      for (let dr = 0; dr <= height; dr++)
        for (let dc = 0; dc <= width; dc++)
          if (dr || dc) covered.add(`${r + dr}:${c + dc}`);
    }
  return { positions, covered };
}
export function rowPayload(row: DataRow) {
  // UI identity lives outside the raw row, so hidden server keys remain available to edit SQL.
  return Object.entries(row).map(([k, value]) => ({ k, v: text(value) }));
}
export function linkValues(
  argument: string | undefined,
  row: DataRow,
  values: Values,
): Values {
  const result: Values = {};
  for (const [key, value] of new URLSearchParams(argument || "")) {
    const match = value.match(/^\{([^{}]+)\}$/);
    result[key] = match ? (row[match[1]] ?? values[match[1]] ?? "") : value;
  }
  return result;
}
/** Carry queried values through embedded drilling; explicit link arguments win. */
export function navigationArguments(
  inherited: readonly ArgValueRow[],
  values: Values,
  linked: Values,
) {
  const args = new Map(
    inherited
      .filter((row) => !!row.arg_code)
      .map((row) => [
        row.arg_code!,
        {
          arg_code: row.arg_code!,
          arg_type: row.arg_type || "STR",
          arg_value: valueText(row.arg_value),
        },
      ]),
  );
  for (const [arg_code, value] of Object.entries({ ...values, ...linked }))
    args.set(arg_code, {
      arg_code,
      arg_type: args.get(arg_code)?.arg_type || "STR",
      arg_value: valueText(value),
    });
  return [...args.values()];
}
export function webUrl(target: string, params: Values, origin: string) {
  const url = new URL(target, origin);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("仅支持 HTTP/HTTPS 网页链接");
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, valueText(value));
  return url.toString();
}
export function tabKey(reportId: number, params: Values) {
  return JSON.stringify([
    reportId,
    Object.entries(params).sort(([a], [b]) => a.localeCompare(b)),
  ]);
}
export function csv(rows: DataRow[], columns: Column[]): string {
  const flat = leaves(columns);
  return rows
    .map((row) =>
      flat
        .map((col) => `"${text(row[col.key]).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\r\n");
}
export function refreshDelay(tag: string | undefined): number | null {
  const seconds = Number(tag?.match(/\[REFRESH=(\d+)\]/i)?.[1]);
  return Number.isSafeInteger(seconds) &&
    seconds > 0 &&
    seconds * 1000 <= 2147483647
    ? seconds * 1000
    : null;
}
export function refreshAllowed(state: {
  active: boolean;
  hidden: boolean;
  loading: boolean;
  editing: boolean;
  working: boolean;
  queried: boolean;
}) {
  return (
    state.active &&
    !state.hidden &&
    !state.loading &&
    !state.editing &&
    !state.working &&
    state.queried
  );
}
export function selectedReport(params: URLSearchParams) {
  const raw = params.get("report_id");
  if (raw !== null && !id(raw)) throw new Error("报表 ID 必须为正数安全整数");
  return raw === null ? null : id(raw);
}
export function reportParams(params: URLSearchParams, reportId: number) {
  if (!id(reportId)) throw new Error("报表 ID 无效");
  const next = new URLSearchParams(params);
  next.set("report_id", String(reportId));
  return next;
}
export const replaceTitle = (title: string, values: Values) =>
  title.replace(/\{([^{}]+)\}/g, (match, key) =>
    values[key] == null ? match : valueText(values[key]),
  );

/** PERIOD encodings consumed by the backend, independent of picker component state. */
export interface Period {
  year: number;
  kind: string;
  start?: string;
  end?: string;
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function parsePeriod(value: string): Period {
  const range = value.match(/^(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})$/);
  if (
    range &&
    validDate(range[1]) &&
    validDate(range[2]) &&
    range[1] <= range[2]
  )
    return {
      year: Number(range[1].slice(0, 4)),
      kind: "range",
      start: range[1],
      end: range[2],
    };
  const match = value.match(
    /^(\d{4})(?:-(0[1-9]|1[0-2]|Q[1-4]|H[12]|01~(?:0[2-9]|1[0-2])))?$/,
  );
  if (match) return { year: Number(match[1]), kind: match[2] || "year" };
  throw new Error("时间段格式无效，请重新选择");
}
