import * as metric from "../../api/metric";
import * as factor from "../../api/factor";
import { getCatalogList, retrieveDict2ItemList } from "../../api/sys";
import { request } from "comm/request";
import type { ApiResult } from "../../types/comm.d.ts";
import type { Runtime } from "./runtime";

export function createService(runtime: Runtime) {
  const wrap =
    <P, T>(
      name: string,
      load: (params: P, signal?: AbortSignal) => Promise<T>,
    ) =>
    (params: P, signal: AbortSignal) =>
      runtime.read(
        `${name}:${JSON.stringify(params)}`,
        (s) => load(params, s),
        signal,
      );
  return {
    library: wrap("library", metric.getLibProperty),
    libraries: wrap("libraries", metric.getLibList),
    catalogs: wrap("catalogs", getCatalogList),
    dictionary: wrap("dictionary", retrieveDict2ItemList),
    defaults: wrap("defaults", metric.getArgDefault),
    metrics: wrap("metrics", metric.getMetricList),
    search: wrap("search", metric.retrieveMetricList),
    history: wrap("history", metric.getMetricSearchList),
    property: wrap("property", metric.getMetricProperty),
    values: wrap("values", metric.getMetricValueList),
    batch: wrap("batch", metric.getMetricValueList2),
    trend: wrap("trend", metric.getMetricTrendList),
    children: wrap("children", metric.getMetricChildList),
    childrenBatch: wrap("childrenBatch", metric.getMetricChildList2),
    links: wrap("links", metric.getMetricLinkList),
    variables: wrap("variables", metric.getMetricVarList),
    favorites: wrap("favorites", metric.getMetricFavoriteList),
    supportToday: wrap("supportToday", metric.isMetricSupportToday),
    units: wrap("units", factor.getUnitList),
    childUnits: wrap("childUnits", factor.getUnitList2),
    unit: wrap("unit", factor.getUnitProperty),
    searchUnits: wrap("searchUnits", factor.retrieveUnitList),
    entities: wrap("entities", factor.getUnitEntityList),
    types: wrap("types", factor.getUnitTypeList),
    background: wrap("background", factor.getUnitBackground),
    factors: wrap("factors", factor.getFactorProperty2),
    factor: wrap("factor", factor.getFactorProperty),
    factorValues: wrap("factorValues", factor.getFactorValueList),
    groups: wrap("groups", factor.getGroupList),
    groupUsers: wrap("groupUsers", factor.getGroupUserList),
    users: wrap("users", factor.getUnitUserList),
    module: wrap(
      "module",
      (params: { module_id: number }, signal?: AbortSignal) =>
        request.post<ApiResult & { module_property?: { entry_arg?: string } }>(
          "federation/GetModuleProperty",
          params,
          { signal },
        ),
    ),
  };
}
export type Service = ReturnType<typeof createService>;
