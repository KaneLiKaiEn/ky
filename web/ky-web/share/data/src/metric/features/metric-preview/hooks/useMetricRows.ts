import { useEffect, useRef, useState } from "react";
import type { MetricRow } from "../../../types/metric.d.ts";
import { usePreview } from "../context";
import { metricRows, objectParams, replaceChildren } from "../model";
import type { Query, ValueRow } from "../types";
import { errorText, useRead } from "./useRead";

export function useMetricRows(
  metrics: MetricRow[],
  query: Query,
  revision = 0,
) {
  const { service } = usePreview();
  const key = JSON.stringify([
    metrics,
    query.unitId,
    query.entityId,
    query.date,
  ]);
  const readKey = `${key}:${revision}`;
  const values = useRead(metrics.length ? readKey : null, (signal) =>
    service.batch(
      {
        metric_id_list: [...new Set(metrics.map((row) => row.metric_id!))],
        ...objectParams(query),
        date_name: query.date,
        yoy_value: true,
        pop_value: true,
        goal_value: true,
      },
      signal,
    ),
  );
  const [tree, setTree] = useState<{ key: string; rows: ValueRow[] }>({
    key: "",
    rows: [],
  });
  const [expanded, setExpanded] = useState<React.Key[]>([]),
    [loading, setLoading] = useState(new Set<string>()),
    [error, setError] = useState<string>();
  const generation = useRef(0),
    requests = useRef(new Map<string, AbortController>());
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
  }, [readKey]);
  const roots = values.data
    ? metricRows(metrics, values.data.value_list ?? [], query)
    : [];
  useEffect(() => {
    if (values.data || !metrics.length) setTree({ key, rows: roots });
  }, [values.data, key]);
  const rows = tree.key === key ? tree.rows : roots;
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
      const list = await service.children(
        { metric_id: row.metric_id!, include_child: true },
        controller.signal,
      );
      const childMetrics = (list.row_list ?? []).map((child) => ({
        metric_id: child.child_id,
        metric_name: child.child_name,
        child_count: child.child_count,
      }));
      const result = childMetrics.length
        ? await service.batch(
            {
              metric_id_list: childMetrics.map((child) => child.metric_id!),
              ...objectParams(query),
              date_name: query.date,
              object_name: true,
              yoy_value: true,
              pop_value: true,
              goal_value: true,
            },
            controller.signal,
          )
        : { value_list: [] };
      if (ticket !== generation.current || controller.signal.aborted) return;
      setTree((previous) => ({
        key,
        rows: replaceChildren(
          previous.key === key ? previous.rows : roots,
          row.key,
          metricRows(
            childMetrics,
            result.value_list ?? [],
            query,
            row.key,
            "definition",
          ),
        ),
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
    ...values,
    rows,
    expanded,
    expand,
    loadingRows: loading,
    treeError: error,
  };
}
