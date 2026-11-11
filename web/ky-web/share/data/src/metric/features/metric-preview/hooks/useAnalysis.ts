import { useEffect, useRef, useState } from "react";
import type { UnitRow } from "../../../types/factor.d.ts";
import type { MetricValue } from "../../../types/metric.d.ts";
import { usePreview } from "../context";
import { filterParams, replaceChildren } from "../model";
import type { Filters, ValueRow } from "../types";
import { errorText, useRead } from "./useRead";

export function unitValueRows(
  units: UnitRow[],
  values: MetricValue[],
  prefix: string,
  kind: "unit" | "entity" = "unit",
): ValueRow[] {
  return values.map((value, index) => {
    const unit = units.find((unit) => unit.unit_id === value.object_id);
    return {
      ...value,
      key: `${prefix}/${kind}:${value.object_id}:${index}`,
      kind,
      child_count: unit?.child_count,
      entity_count: unit?.entity_count,
      children: unit?.child_count || unit?.entity_count ? [] : undefined,
    };
  });
}
export function useAnalysis(
  metricId: number,
  filters: Filters,
  unitType: string,
) {
  const { service, detailQuery: query } = usePreview();
  const key = JSON.stringify([metricId, query, filters, unitType]);
  const filter = filterParams(filters);
  const read = useRead(key, async (signal) => {
    const units = await service.childUnits(
      {
        parent_id: query.unitId,
        ...(unitType === "leaf"
          ? { include_descendant: true, only_leaf: true }
          : unitType === "child"
            ? {}
            : { unit_type: unitType }),
      },
      signal,
    );
    const ids =
      units.row_list?.map((row) => row.unit_id!).filter(Boolean) ?? [];
    if (!ids.length) return [];
    const values = await service.values(
      {
        metric_id: metricId,
        unit_id_list: ids,
        date_list: [query.date],
        object_name: true,
        yoy_value: true,
        pop_value: true,
        goal_value: true,
        ...filter,
      },
      signal,
    );
    return unitValueRows(units.row_list ?? [], values.value_list ?? [], "root");
  });
  const [state, setState] = useState<{ key: string; rows: ValueRow[] }>({
    key: "",
    rows: [],
  });
  const [expanded, setExpanded] = useState<React.Key[]>([]),
    [loading, setLoading] = useState(new Set<string>()),
    [error, setError] = useState<string>();
  const requests = useRef(new Map<string, AbortController>()),
    generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setExpanded([]);
    setLoading(new Set());
    setError(undefined);
    return () => {
      generation.current++;
      requests.current.forEach((controller) => controller.abort());
      requests.current.clear();
    };
  }, [key, read.data]);
  useEffect(() => setState({ key, rows: read.data ?? [] }), [key, read.data]);
  const expand = async (open: boolean, row: ValueRow) => {
    setExpanded((previous) =>
      open
        ? [...previous.filter((key) => key !== row.key), row.key]
        : previous.filter(
            (key) => key !== row.key && !String(key).startsWith(`${row.key}/`),
          ),
    );
    if (!open) {
      requests.current.get(row.key)?.abort();
      requests.current.delete(row.key);
      setLoading(
        (previous) => new Set([...previous].filter((key) => key !== row.key)),
      );
      return;
    }
    if (row.children?.length || requests.current.has(row.key)) return;
    const controller = new AbortController(),
      ticket = generation.current;
    requests.current.set(row.key, controller);
    setLoading((previous) => new Set(previous).add(row.key));
    setError(undefined);
    try {
      let children: ValueRow[];
      if (row.child_count) {
        const units = await service.childUnits(
          { parent_id: row.object_id! },
          controller.signal,
        );
        const ids =
          units.row_list?.map((unit) => unit.unit_id!).filter(Boolean) ?? [];
        const values = ids.length
          ? await service.values(
              {
                metric_id: metricId,
                unit_id_list: ids,
                date_list: [query.date],
                object_name: true,
                yoy_value: true,
                pop_value: true,
                goal_value: true,
                ...filter,
              },
              controller.signal,
            )
          : { value_list: [] };
        children = unitValueRows(
          units.row_list ?? [],
          values.value_list ?? [],
          row.key,
        );
      } else {
        const entities = await service.entities(
          { unit_id: row.object_id! },
          controller.signal,
        );
        const ids =
          entities.row_list
            ?.map((entity) => entity.entity_id!)
            .filter(Boolean) ?? [];
        const values = ids.length
          ? await service.values(
              {
                metric_id: metricId,
                entity_id_list: ids,
                date_list: [query.date],
                object_name: true,
                yoy_value: true,
                pop_value: true,
                goal_value: true,
                ...filter,
              },
              controller.signal,
            )
          : { value_list: [] };
        children = unitValueRows(
          [],
          values.value_list ?? [],
          row.key,
          "entity",
        );
      }
      if (ticket === generation.current && !controller.signal.aborted)
        setState((previous) => ({
          key,
          rows: replaceChildren(previous.rows, row.key, children),
        }));
    } catch (err) {
      if (ticket === generation.current && !controller.signal.aborted)
        setError(errorText(err));
    } finally {
      if (requests.current.get(row.key) === controller) {
        requests.current.delete(row.key);
        if (ticket === generation.current)
          setLoading(
            (previous) =>
              new Set([...previous].filter((key) => key !== row.key)),
          );
      }
    }
  };
  return {
    ...read,
    rows: state.key === key ? state.rows : (read.data ?? []),
    expanded,
    expand,
    loadingRows: loading,
    treeError: error,
  };
}
