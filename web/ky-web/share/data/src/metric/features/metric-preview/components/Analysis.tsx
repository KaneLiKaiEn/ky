import { PreviewModal } from "../theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, App, Button, Select, Space, Tabs } from "antd";
import type { MetricRow } from "../../../types/metric.d.ts";
import { usePreview } from "../context";
import { filterParams, flatten, metricName } from "../model";
import { groupEntities, mergeEntities } from "../analysisModel";
import { useAnalysis } from "../hooks/useAnalysis";
import { errorText, useRead } from "../hooks/useRead";
import { gaugeOptions, scatterOption } from "../chartOptions";
import { defaultFilters, type ValueRow } from "../types";
import Feedback from "./Feedback";
import Chart, { type ChartHandle } from "./Chart";
import ValueTable, { FilterFields } from "./ValueTable";

const unitNames: Record<string, string> = {
  ORG: "机构",
  BRANCH: "院区",
  CATALOG: "分类",
  UNIT: "核算单元",
  DEPT: "科室",
  GROUP: "诊疗组",
  USER: "个人",
};
export default function Analysis({ metric }: { metric: MetricRow }) {
  const { service, detailQuery: query, setBusy, busy } = usePreview(),
    { message } = App.useApp();
  const [filters, setFilters] = useState({ ...defaultFilters }),
    [unitType, setUnitType] = useState("child");
  const [x, setX] = useState("average"),
    [y, setY] = useState("0"),
    [detail, setDetail] = useState<ValueRow>(),
    [exporting, setExporting] = useState(false);
  const scatter = useRef<ChartHandle>(null);
  const types = useRead(`types:${query.unitId}`, (signal) =>
    service.types(
      { parent_id: query.unitId, include_descendant: true },
      signal,
    ),
  );
  const read = useAnalysis(metric.metric_id!, filters, unitType),
    all = flatten(read.rows);
  const gauges = useMemo(() => gaugeOptions(all), [read.rows]);
  const option = useMemo(
    () => scatterOption(all, metricName(metric), x, y),
    [read.rows, metric, x, y],
  );
  const title = metricName(metric);
  const exportTable = async () => {
    if (exporting || !read.rows.length) return;
    setExporting(true);
    setBusy("export", true);
    try {
      const { exportExcel } = await import("../files");
      await exportExcel(read.rows, title);
    } catch (err) {
      void message.error(errorText(err));
    } finally {
      setExporting(false);
      setBusy("export", false);
    }
  };
  return (
    <section className="mp-section mp-analysis">
      <div className="mp-section-title">{title}-明细分析</div>
      <div className="mp-analysis-filters">
        <Select
          aria-label="分析单元范围"
          style={{ width: 100 }}
          value={unitType}
          onChange={setUnitType}
          options={[
            { label: "子项", value: "child" },
            { label: "明细项", value: "leaf" },
            ...(types.data?.type_list ?? []).map((value) => ({
              value,
              label: unitNames[value] || value,
            })),
          ]}
        />
        <FilterFields value={filters} onChange={setFilters} />
      </div>
      {types.error && <Feedback read={types} />}
      <Feedback read={read} />
      {read.treeError && <Alert type="error" title={read.treeError} />}
      <div className="mp-gauges">
        {gauges.map((item) => (
          <Chart key={item.name} label={item.name} option={item.option} />
        ))}
      </div>
      <div className="mp-export-row">
        <Button
          type="primary"
          disabled={busy || !read.rows.length}
          loading={exporting}
          onClick={() => void exportTable()}
        >
          导出
        </Button>
      </div>
      <ValueTable
        rows={read.rows}
        loading={read.loading}
        onValue={setDetail}
        expandable={{
          expandedRowKeys: read.expanded,
          rowExpandable: (row) => !!row.child_count || !!row.entity_count,
          onExpand: (open, row) => void read.expand(open, row),
          expandIcon: ({ expanded, record }) =>
            record.child_count || record.entity_count ? (
              <Button
                size="small"
                className="mp-expand"
                loading={read.loadingRows.has(record.key)}
                aria-busy={read.loadingRows.has(record.key)}
                onClick={() => void read.expand(!expanded, record)}
                aria-label={`${expanded ? "收起" : "展开"}${record.object_name}`}
              >
                {read.loadingRows.has(record.key) ? null : expanded ? "−" : "+"}
              </Button>
            ) : (
              <span className="mp-expand-spacer" />
            ),
        }}
      />
      <div className="mp-section-title">{title}-同比象限分布图</div>
      <div className="mp-chart-controls">
        <Space.Compact>
          <span className="mp-control-label">X轴</span>
          <Select
            value="指标值"
            options={[{ value: "指标值" }]}
            style={{ width: 90 }}
          />
          <span className="mp-control-label">分割</span>
          <SplitSelect label="X轴分割" value={x} onChange={setX} />
        </Space.Compact>
        <Space.Compact>
          <span className="mp-control-label">Y轴</span>
          <Select
            value="同比"
            options={[{ value: "同比" }]}
            style={{ width: 90 }}
          />
          <span className="mp-control-label">分割</span>
          <SplitSelect label="Y轴分割" value={y} onChange={setY} />
        </Space.Compact>
        <Button
          type="primary"
          onClick={async () => {
            const image = scatter.current?.image();
            if (image) {
              const { download } = await import("../files");
              download(image, `${title}-同比象限分布图.png`);
            }
          }}
        >
          导出图表
        </Button>
      </div>
      <Chart
        ref={scatter}
        label="同比象限分布图"
        option={option}
        height={600}
      />
      {detail && (
        <WorkforceDialog
          key={`${metric.metric_id}:${query.date}:${query.unitId}:${detail.key}`}
          metricId={metric.metric_id!}
          row={detail}
          close={() => setDetail(undefined)}
        />
      )}
    </section>
  );
}
function SplitSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <Select
      aria-label={label}
      style={{ width: 90 }}
      value={value}
      onChange={onChange}
      options={[
        { label: "平均值", value: "average" },
        { label: "中位数", value: "median" },
        { label: "0值", value: "0" },
      ]}
    />
  );
}
function WorkforceDialog({
  metricId,
  row,
  close,
}: {
  metricId: number;
  row: ValueRow;
  close: () => void;
}) {
  const { service, detailQuery: query, session } = usePreview();
  const [tab, setTab] = useState("group"),
    [filters, setFilters] = useState({ ...defaultFilters });
  const [expanded, setExpanded] = useState<React.Key[]>([]),
    [overrides, setOverrides] = useState<{
      root: ValueRow[];
      children: Map<string, ValueRow[]>;
    }>({ root: [], children: new Map() });
  const [expanding, setExpanding] = useState(new Set<string>()),
    [error, setError] = useState<string>();
  const key = JSON.stringify([
    metricId,
    row.object_id,
    query.date,
    filters,
    tab,
  ]);
  const read = useRead(key, async (signal) => {
    const entities =
      tab === "group"
        ? await service
            .groups(
              { unit_id: row.object_id!, column_entity: "*", column_list: "*" },
              signal,
            )
            .then((result) =>
              groupEntities(result.row_list ?? [], result.entity_list ?? []),
            )
        : await service
            .users({ unit_id: row.object_id!, date_name: query.date }, signal)
            .then((result) =>
              (result.row_list ?? []).map((entity, index) => ({
                ...entity,
                key: `user:${entity.entity_id}:${index}`,
              })),
            );
    const ids = entities.map((entity) => entity.entity_id!).filter(Boolean);
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
            ...filterParams(filters),
          },
          signal,
        )
      : { value_list: [] };
    return mergeEntities(
      entities,
      values.value_list ?? [],
      filters,
      tab === "group",
    );
  });
  const childControllers = useRef(new Map<string, AbortController>()),
    latestKey = useRef(key);
  latestKey.current = key;
  // Child snapshots belong to one root result, rather than mutating API entity IDs.
  const rows =
    overrides.root === read.data
      ? (read.data ?? []).map((item) => ({
          ...item,
          children: overrides.children.get(item.key) ?? item.children,
        }))
      : (read.data ?? []);
  const expand = async (open: boolean, group: ValueRow) => {
    setExpanded((previous) =>
      open
        ? [...previous, group.key]
        : previous.filter((key) => key !== group.key),
    );
    if (!open) {
      childControllers.current.get(group.key)?.abort();
      childControllers.current.delete(group.key);
      setExpanding(
        (previous) => new Set([...previous].filter((key) => key !== group.key)),
      );
      return;
    }
    if (childControllers.current.has(group.key)) return;
    const controller = new AbortController(),
      currentKey = key;
    childControllers.current.set(group.key, controller);
    setExpanding((previous) => new Set(previous).add(group.key));
    setError(undefined);
    try {
      const result = await service.groupUsers(
        group.object_id
          ? { entity_id: group.object_id, column_entity: "*" }
          : {
              org_id: session.orgId,
              group_no: group.group_no,
              group_code: group.group_code,
              column_entity: "*",
            },
        controller.signal,
      );
      const entities = (result.entity_list ?? []).map((entity, index) => ({
        ...entity,
        key: `${group.key}/user:${entity.entity_id}:${index}`,
      }));
      const ids = entities.map((entity) => entity.entity_id!).filter(Boolean);
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
              ...filterParams(filters),
            },
            controller.signal,
          )
        : { value_list: [] };
      if (!controller.signal.aborted && latestKey.current === currentKey)
        setOverrides((previous) => ({
          root: read.data ?? [],
          children: new Map(
            previous.root === read.data ? previous.children : [],
          ).set(
            group.key,
            mergeEntities(entities, values.value_list ?? [], filters),
          ),
        }));
    } catch (err) {
      if (!controller.signal.aborted && latestKey.current === currentKey)
        setError(errorText(err));
    } finally {
      if (childControllers.current.get(group.key) === controller)
        childControllers.current.delete(group.key);
      if (!controller.signal.aborted && latestKey.current === currentKey)
        setExpanding(
          (previous) =>
            new Set([...previous].filter((key) => key !== group.key)),
        );
    }
  };
  // Abort pending expansions when the modal closes, or its filters/tab change.
  useAnalysisCleanup(key, childControllers, () => {
    setExpanded([]);
    setExpanding(new Set());
    setError(undefined);
  });
  return (
    <PreviewModal
      className="mp-modal"
      title={row.object_name || "详情"}
      open
      width="90vw"
      onCancel={close}
      footer={null}
      destroyOnHidden
      styles={{ body: { maxHeight: "78vh", overflow: "auto" } }}
    >
      <FilterFields value={filters} onChange={setFilters} />
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: "group", label: "诊疗组" },
          { key: "user", label: "人员" },
        ]}
      />
      <Feedback read={read} />
      {error && <Alert type="error" title={error} />}
      <ValueTable
        rows={rows}
        loading={read.loading}
        expandable={
          tab === "group"
            ? {
                expandedRowKeys: expanded,
                rowExpandable: (group) => group.kind === "group",
                onExpand: (open, group) => void expand(open, group),
                expandIcon: ({ expanded, record }) =>
                  record.kind === "group" ? (
                    <Button
                      size="small"
                      loading={expanding.has(record.key)}
                      aria-busy={expanding.has(record.key)}
                      onClick={() => void expand(!expanded, record)}
                    >
                      {expanding.has(record.key) ? null : expanded ? "−" : "+"}
                    </Button>
                  ) : (
                    <span className="mp-expand-spacer" />
                  ),
              }
            : undefined
        }
      />
    </PreviewModal>
  );
}
function useAnalysisCleanup(
  key: string,
  controller: React.RefObject<Map<string, AbortController>>,
  reset: () => void,
) {
  const fn = useRef(reset);
  fn.current = reset;
  // Separate effect keeps the reset callback out of the dependency identity.
  useEffect(() => {
    fn.current();
    return () => {
      controller.current.forEach((value) => value.abort());
      controller.current.clear();
    };
  }, [key]);
}
