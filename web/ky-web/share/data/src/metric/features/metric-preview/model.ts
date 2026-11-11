import type { MetricAnalysisReq } from "../../api/ai";
import type { MetricRow, MetricValue } from "../../types/metric.d.ts";
import type { CatalogRow, GetCatalogListReq } from "../../types/sys.d.ts";
import type {
  Filters,
  PreviewArgument,
  PreviewTarget,
  Query,
  ValueRow,
} from "./types";
import { dateBounds } from "./dates";

export function positiveId(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error("ID 必须是正整数");
  return n;
}
export function selection(params: URLSearchParams) {
  const raw = params.get("catalog_id"),
    catalogId = raw === "0" ? 0 : positiveId(raw);
  const date = params.get("date_name") || undefined,
    detailDate = params.get("detail_date") || undefined;
  if (date) dateBounds(date);
  if (detailDate) dateBounds(detailDate);
  return {
    libId: positiveId(params.get("lib_id")),
    moduleId: positiveId(params.get("moduleId")),
    catalogId,
    metricId: positiveId(params.get("metric_id")),
    unitId: positiveId(params.get("unit_id")),
    entityId: positiveId(params.get("entity_id")),
    date,
    detailDate,
  };
}
export function updateParams(
  params: URLSearchParams,
  values: Record<string, string | number | undefined>,
) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(values)) {
    if (value == null || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  return next;
}
export interface ModuleConfig {
  lib_id?: number;
  type?: string;
  title?: string;
  metric_id?: number;
}
export function moduleConfig(raw?: string): ModuleConfig {
  if (!raw?.trim()) return {};
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("模块 entry_arg 必须是 JSON 对象");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("模块 entry_arg 必须是 JSON 对象");
  const config = value as Record<string, unknown>;
  return {
    lib_id: positiveId(config.lib_id),
    type: typeof config.type === "string" ? config.type : undefined,
    ...(typeof config.title === "string" ? { title: config.title } : {}),
    ...(config.metric_id != null
      ? { metric_id: positiveId(config.metric_id) }
      : {}),
  };
}
/** Same catalog scope as the mounted legacy desktop page; 0 is the proto root. */
export function catalogParams(libId: number, orgId: number): GetCatalogListReq {
  return {
    catalog_type: `metric.${libId}`,
    org_id: orgId,
    parent_id: 0,
    include_descendant: true,
    include_invalid: false,
    include_self: false,
  };
}
export const hasTag = (value: unknown, tag: string) =>
  typeof value === "string" && value.includes(`[${tag}]`);
export const metricName = (row: MetricRow) =>
  row.metric_title || row.metric_name || `指标 ${row.metric_id}`;
export const display = (value: unknown) =>
  value == null || value === "" ? "-" : String(value);
export const numberValue = (value: unknown) =>
  value == null || value === "" || !Number.isFinite(Number(value))
    ? undefined
    : Number(value);
export const rateClass = (value: unknown) =>
  (numberValue(value) ?? 0) > 0
    ? "mp-positive"
    : (numberValue(value) ?? 0) < 0
      ? "mp-negative"
      : "mp-neutral";
export const objectParams = (query: Query) =>
  query.entityId
    ? { entity_id_list: [query.entityId] }
    : { unit_id_list: [query.unitId] };
export const filterParams = (filters: Filters) => ({
  filter_null: !filters.showNull,
  sort_mode: filters.sort,
  filter_top: filters.top,
  filter_finish: filters.finish,
  filter_yoy: filters.yoy,
});

export interface CatalogNode {
  key: number;
  title: string;
  row: CatalogRow;
  children: CatalogNode[];
}
export function catalogTree(rows: CatalogRow[]): CatalogNode[] {
  const map = new Map<number, CatalogNode>();
  for (const row of rows)
    if (row.catalog_id)
      map.set(row.catalog_id, {
        key: row.catalog_id,
        title: row.catalog_name || "",
        row,
        children: [],
      });
  const roots: CatalogNode[] = [];
  for (const node of map.values()) {
    let parent = node.row.parent_id,
      cyclic = false;
    const seen = new Set([node.key]);
    while (parent && map.has(parent)) {
      if (seen.has(parent)) {
        cyclic = true;
        break;
      }
      seen.add(parent);
      parent = map.get(parent)?.row.parent_id;
    }
    const target =
      !cyclic && node.row.parent_id ? map.get(node.row.parent_id) : undefined;
    if (target) target.children.push(node);
    else roots.push(node);
  }
  return roots;
}
export function metricRows(
  rows: MetricRow[],
  values: (MetricValue & Pick<MetricRow, "metric_title">)[],
  query: Query,
  prefix = "",
  nameSource: "value" | "definition" = "value",
): ValueRow[] {
  const objectId = query.entityId ?? query.unitId;
  const map = new Map(
    values
      .filter(
        (value) =>
          value.object_id === objectId && value.date_name === query.date,
      )
      .map((value) => [value.metric_id, value]),
  );
  return rows.map((row, index) => {
    const value = map.get(row.metric_id);
    return {
      ...row,
      ...value,
      // Legacy root rows prefer nonempty value names; expanded children use child_name.
      metric_name:
        nameSource === "definition"
          ? row.metric_name || value?.metric_name
          : value?.metric_name || row.metric_name,
      metric_title: value?.metric_title || row.metric_title,
      source: row,
      key: `${prefix}/${row.metric_id}:${index}`,
      children: row.child_count ? [] : undefined,
    };
  });
}
export function replaceChildren(
  rows: ValueRow[],
  key: string,
  children: ValueRow[],
): ValueRow[] {
  return rows.map((row) =>
    row.key === key
      ? { ...row, children }
      : row.children
        ? { ...row, children: replaceChildren(row.children, key, children) }
        : row,
  );
}
export function flatten(
  rows: ValueRow[],
  depth = 0,
): (ValueRow & { depth: number })[] {
  return rows.flatMap((row) => [
    { ...row, depth },
    ...flatten(row.children ?? [], depth + 1),
  ]);
}
export function metricAnalysisParams(
  metric: Pick<MetricRow, "metric_id" | "metric_name">,
  query: Pick<Query, "unitId" | "unitName" | "date">,
  libId?: number,
  modelCode?: string,
): MetricAnalysisReq {
  const { start, end } = dateBounds(query.date);
  const subject = metric.metric_name?.trim() || "当前指标";
  const period = start === end ? start : `${start}至${end}`;
  const unit = `「${query.unitName}」（unit_id=${query.unitId}）`;
  const metricLabel = `「${subject}」（metric_id=${metric.metric_id}）`;
  const question = `你是一名资深医院运营管理顾问，熟悉公立医院绩效考核、DRG/DIP支付改革、平衡计分卡、本量利分析、标杆管理、数据包络分析等工具，长期为医院院长、书记、总会计师和运营管理部门提供决策支持。请查询并分析${unit}在${query.date}（${period}）的${metricLabel}。分析方法：首先获取该项指标的值以及同比、环比、目标等，可以根据分析需要获取指标趋势，也可以根据需要获取${unit}的子单元该指标的值进行多维度分析。输出建议：先对指标值进行总体评价，如果发现问题，就深入分析问题，找到导致该问题的主要原因，最后提出改进建议。输出只依据本次查询到的数据，缺少的数据直接说明，不要编造。`;
  return {
    ...(metric.metric_id != null ? { metric_id: metric.metric_id } : {}),
    ...(metric.metric_name ? { metric_name: metric.metric_name } : {}),
    lib_id: libId ?? 0,
    unit_id: query.unitId,
    unit_name: query.unitName,
    date_start: start,
    date_end: end,
    ...(modelCode ? { model_code: modelCode } : {}),
    question,
  };
}
export function previewArgs(
  query: Query,
  metricId?: number,
  entityIds: number[] = [],
): PreviewArgument[] {
  const { start, end } = dateBounds(query.date);
  const args: PreviewArgument[] = [
    { arg_code: "arg_date", arg_type: "STR", arg_value: query.date },
    { arg_code: "arg_start", arg_type: "STR", arg_value: start },
    { arg_code: "arg_end", arg_type: "STR", arg_value: end },
  ];
  if (metricId)
    args.push({
      arg_code: "arg_metric",
      arg_type: "INT",
      arg_value: String(metricId),
    });
  if (query.entityId) {
    args.push({
      arg_code: "arg_entity",
      arg_type: "INT",
      arg_value: String(query.entityId),
    });
    if (entityIds.length)
      args.push({
        arg_code: "arg_entity_list",
        arg_type: "INT",
        arg_value: entityIds.join(","),
      });
  } else
    args.push({
      arg_code: "arg_unit",
      arg_type: "INT",
      arg_value: String(query.unitId),
    });
  return args;
}
export function mergePreviewArguments(
  ...lists: readonly (readonly PreviewArgument[])[]
): PreviewArgument[] {
  const args = new Map<string, PreviewArgument>();
  for (const list of lists)
    for (const row of list)
      if (row.arg_code) args.set(row.arg_code, { ...row });
  return [...args.values()];
}
export function detailTarget(
  type: unknown,
  id: unknown,
  args: PreviewArgument[],
  title?: string,
): PreviewTarget | undefined {
  if (!id || !["BOARD", "REPORT", "TABLE"].includes(String(type)))
    return undefined;
  return {
    type: type === "BOARD" ? "BOARD" : "REPORT",
    id: positiveId(id)!,
    argList: args,
    title,
  };
}
export const favoriteTags = [
  ["今天", "TODAY"],
  ["昨天", "YESTERDAY"],
  ["上周", "WEEK"],
  ["上个月", "MONTH"],
  ["今年", "YEAR"],
  ["去年", "LASTYEAR"],
  ["前年", "TWOYEAR"],
] as const;
