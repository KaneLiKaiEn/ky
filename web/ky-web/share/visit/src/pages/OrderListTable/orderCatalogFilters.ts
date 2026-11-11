/**
 * 头部 Segmented「全部」的哨兵值。
 * 不能直接用空字符串：Segmented 需要稳定 value；请求时再转成「不传 order_catalog」。
 */
export const ORDER_CATALOG_ALL = "__all__";

/** 工作台 kind（长期 / 临时 / 出院带药） */
export type OrderWorkspaceKind = "longTerm" | "temporary" | "discharge";

const LONG_TERM_CATALOGS = [
  "基础",
  "口服",
  "外用",
  "输液",
  "注射",
  "雾化",
  "胰岛素",
  "草药",
  "治疗",
  "嘱托",
] as const;

const TEMPORARY_CATALOGS = [
  "口服",
  "外用",
  "输液",
  "注射",
  "皮试",
  "雾化",
  "胰岛素",
  "草药",
  "检验",
  "检查",
  "治疗",
  "病理",
  "嘱托",
  "转科",
  "转床",
  "出院",
] as const;

const DISCHARGE_CATALOGS = ["口服", "外用", "注射", "雾化"] as const;

const withAll = (catalogs: readonly string[]) => [
  { label: "全部", value: ORDER_CATALOG_ALL },
  ...catalogs.map((catalog) => ({ label: catalog, value: catalog })),
];

export const ORDER_CATALOG_FILTERS: Record<
  OrderWorkspaceKind,
  { label: string; value: string }[]
> = {
  longTerm: withAll(LONG_TERM_CATALOGS),
  temporary: withAll(TEMPORARY_CATALOGS),
  discharge: withAll(DISCHARGE_CATALOGS),
};

export const ORDER_TYPE_BY_KIND: Record<OrderWorkspaceKind, string> = {
  longTerm: "长期医嘱",
  temporary: "临时医嘱",
  discharge: "出院带药",
};

export const toOrderCatalogParam = (catalog: string) =>
  catalog === ORDER_CATALOG_ALL || !catalog ? undefined : catalog;

/**
 * 临时医嘱选中处方时：列表类别过滤去掉不可入方的 catalog。
 * 未选处方（excluded 为空）时与 ORDER_CATALOG_FILTERS.temporary 一致。
 */
export function buildTemporaryCatalogFilters(
  excludedCatalogs: readonly string[] = [],
): { label: string; value: string }[] {
  if (excludedCatalogs.length === 0) {
    return ORDER_CATALOG_FILTERS.temporary;
  }
  const excluded = new Set(excludedCatalogs);
  const catalogs = TEMPORARY_CATALOGS.filter((c) => !excluded.has(c));
  return withAll(catalogs);
}
