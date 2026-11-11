import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tooltip,
} from "antd";
import {
  InfoCircleOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import type { MetricRow } from "../../../types/metric.d.ts";
import type { ColumnsType } from "antd/es/table";
import { usePreview } from "../context";
import { useRead } from "../hooks/useRead";
import { useRetainedData } from "../hooks/useRetainedData";
import { useMetricRows } from "../hooks/useMetricRows";
import { display, flatten, hasTag, metricRows, rateClass } from "../model";
import { sparkOption } from "../chartOptions";
import type { Query, ValueRow } from "../types";
import Feedback from "./Feedback";
import Chart from "./Chart";
import ValueSkeleton from "./ValueSkeleton";

export default function MetricList() {
  const {
    service,
    libId,
    catalogId,
    session,
    query,
    favoriteError,
    reloadFavorites,
    busy,
  } = usePreview();
  const [input, setInput] = useState(""),
    [search, setSearch] = useState(""),
    [revision, setRevision] = useState(0),
    [showFavorites, setShowFavorites] = useState(false);
  const list = useRead(
    catalogId == null ? null : `list:${libId}:${catalogId}:${search}`,
    async (signal) => {
      if (catalogId === 0) {
        if (search)
          return (
            (await service.search({ retrieve_input: search }, signal))
              .row_list ?? []
          );
        return (
          (
            await service.history(
              { user_id: session.userId, lib_id: libId },
              signal,
            )
          ).row_list ?? []
        );
      }
      return (
        (
          await service.metrics(
            { lib_id: libId!, catalog_id: catalogId!, include_shortcut: true },
            signal,
          )
        ).row_list ?? []
      );
    },
  );
  if (catalogId == null)
    return <Empty className="mp-empty" description="请选择指标目录" />;
  return (
    <div className="mp-list-panel">
      {catalogId === 0 && (
        <div className="mp-search">
          <Input
            aria-label="指标名称"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            allowClear
            placeholder="请输入指标名称"
            onPressEnter={() => setSearch(input.trim())}
          />
          <Button
            type="primary"
            aria-label="搜索"
            onClick={() => setSearch(input.trim())}
          >
            搜索
          </Button>
        </div>
      )}
      <div className="mp-list-toolbar">
        <span>
          共{list.data?.length ?? 0}个指标{" "}
          <Tooltip title="按住shift+鼠标滚轮可横向滚动表格">
            <InfoCircleOutlined />
          </Tooltip>
        </span>
        <Space>
          <Switch
            checked={showFavorites}
            onChange={setShowFavorites}
            size="small"
            checkedChildren="收藏"
            unCheckedChildren="收藏"
          />
          <Button
            size="small"
            type="primary"
            ghost
            icon={<ReloadOutlined />}
            aria-label="刷新指标"
            disabled={busy}
            loading={list.loading}
            onClick={() => setRevision((value) => value + 1)}
          />
        </Space>
      </div>
      <Feedback read={list} />
      {favoriteError && (
        <Alert
          type="error"
          title={favoriteError}
          action={
            <Button onClick={() => void reloadFavorites().catch(() => {})}>
              重试读取收藏
            </Button>
          }
        />
      )}
      {list.data && (
        <MetricTable
          metrics={list.data}
          query={query}
          revision={revision}
          showFavorites={showFavorites}
        />
      )}
    </div>
  );
}
export function MetricTable({
  metrics,
  query,
  revision = 0,
  showFavorites = false,
  compact = false,
  onMove,
  nameColumnWidth = 220,
  variant = "preview",
}: {
  metrics: MetricRow[];
  query: Query;
  revision?: number;
  showFavorites?: boolean;
  compact?: boolean;
  onMove?: (favoriteId: number, direction: "up" | "down") => void;
  nameColumnWidth?: number;
  variant?: "preview" | "favorites";
}) {
  const {
    library,
    selectMetric,
    metricId,
    favorites,
    favorite,
    busy,
    appearance,
    identity,
  } = usePreview();
  const values = useMetricRows(metrics, query, revision);
  const retainedValues = useRetainedData(
    variant === "favorites"
      ? JSON.stringify([
          identity,
          metrics,
          query.unitId,
          query.entityId,
          query.date,
        ])
      : null,
    values.data,
  );
  const unresolved = variant === "favorites" && !values.rows.length;
  const pending = unresolved && values.loading;
  const rows = unresolved ? metricRows(metrics, [], query) : values.rows;
  const [nameWidth, setNameWidth] = useState(nameColumnWidth),
    [yearCount, setYearCount] = useState(2);
  const depths = useMemo(
    () => new Map(flatten(rows).map((row) => [row.key, row.depth])),
    [rows],
  );
  const [range, setRange] = useState<{ key: string; title: string }>();
  const rangeKey = JSON.stringify([metrics[0]?.metric_id, query, revision]);
  const showRange = useCallback(
    (dates: string[]) => {
      if (!dates.length) return;
      const first = dates[0].split("~")[0],
        last = dates[dates.length - 1].split("~");
      setRange({ key: rangeKey, title: `${first}~${last[1] || last[0]}` });
    },
    [rangeKey],
  );
  const yearMode =
      variant === "preview" && hasTag(library?.lib_tag, "YEAR_MODE"),
    year = new Date().getFullYear();
  const years = useMemo(
    () =>
      yearMode
        ? Array.from({ length: yearCount }, (_, index) =>
            String(year - yearCount + index + 1),
          )
        : undefined,
    [yearMode, yearCount, year],
  );
  const cols: ColumnsType<ValueRow> = [
    {
      title: "指标名称",
      dataIndex: "metric_name",
      width: nameWidth,
      fixed: "left",
      ellipsis: true,
      onHeaderCell: () =>
        ({
          width: nameWidth,
          onWidth: setNameWidth,
        }) as React.ThHTMLAttributes<HTMLTableCellElement>,
      render: (_, row) => (
        <button
          className="mp-name-link"
          disabled={unresolved && !!row.child_count}
          // Reserve cell padding, expand control and tree indent so the text itself truncates.
          style={{
            maxWidth: Math.max(
              0,
              nameWidth - 16 - 25 - (depths.get(row.key) ?? 0) * 22,
            ),
          }}
          onClick={() =>
            row.child_count
              ? void values.expand(!values.expanded.includes(row.key), row)
              : selectMetric(row.metric_id!)
          }
        >
          {row.metric_title || row.metric_name || `指标 ${row.metric_id}`}
        </button>
      ),
    },
    {
      title: "指标值",
      align: "right",
      fixed: "left",
      render: (_, row) =>
        pending ? (
          <ValueSkeleton />
        ) : (
          <button
            className="mp-value-button"
            disabled={busy}
            onClick={() => selectMetric(row.metric_id!)}
          >
            <span
              className={`mp-goal-dot ${row.goal_finish === "1" ? "mp-goal-met" : row.goal_finish === "0" ? "mp-goal-missed" : ""}`}
            />
            <span className="mp-metric-number">
              <FormattedNumber value={row.metric_value_fmt} />
            </span>
            <small>
              {row.metric_value_abbr}
              {variant === "preview" ? row.metric_value_unit : null}
            </small>
          </button>
        ),
    },
    {
      title: "同比",
      align: "right",
      render: (_, row) =>
        pending ? (
          <ValueSkeleton kind="rate" />
        ) : row.yoy_rate_fmt ? (
          <span className={`mp-rate-badge ${rateClass(row.yoy_rate)}`}>
            {row.yoy_rate_fmt}
          </span>
        ) : (
          "-"
        ),
    },
    ...((variant === "preview" || appearance === "dashboard") &&
    retainedValues?.pop_value
      ? [
          {
            title: "环比",
            align: "right" as const,
            render: (_: unknown, row: ValueRow) =>
              pending ? (
                <ValueSkeleton kind="rate" />
              ) : row.pop_rate_fmt ? (
                <span className={`mp-rate-badge ${rateClass(row.pop_rate)}`}>
                  {row.pop_rate_fmt}
                </span>
              ) : (
                "-"
              ),
          },
        ]
      : []),
    ...(!compact
      ? [
          {
            title: yearMode ? (
              <Select
                aria-label="年份趋势区间"
                size="small"
                style={{ minWidth: 140 }}
                value={yearCount}
                onChange={setYearCount}
                options={Array.from({ length: 9 }, (_, index) => ({
                  label: `${year - index - 1}-${year}年`,
                  value: index + 2,
                }))}
              />
            ) : range?.key === rangeKey ? (
              range.title
            ) : null,
            width: appearance === "dashboard" ? 136 : 160,
            render: (_: unknown, row: ValueRow) =>
              unresolved ? (
                <span className="mp-spark" />
              ) : (
                <Spark
                  legacyRange={variant === "favorites"}
                  metricId={row.metric_id!}
                  query={query}
                  revision={revision}
                  years={years}
                  onDates={
                    !yearMode && row.key === values.rows[0]?.key
                      ? showRange
                      : undefined
                  }
                />
              ),
          },
        ]
      : []),
    ...(variant === "favorites"
      ? [
          {
            title: "单位",
            align: "right" as const,
            render: (_: unknown, row: ValueRow) =>
              pending ? <ValueSkeleton kind="unit" /> : row.metric_value_unit,
          },
        ]
      : []),
    ...(onMove
      ? [
          {
            title: "排序",
            fixed: "right" as const,
            align: "center" as const,
            render: (_: unknown, row: ValueRow) => {
              const index = metrics.findIndex(
                (metric) => metric.metric_id === row.source?.metric_id,
              );
              const id = (
                row.source as import("../../../types/metric.d.ts").MetricFavoriteRow
              )?.favorite_id;
              if (index < 0 || !id) return null;
              return (
                <Space size={4}>
                  <Button
                    size="small"
                    aria-label={`上移${row.metric_name}`}
                    disabled={busy || index === 0}
                    onClick={() => onMove(id, "up")}
                  >
                    ↑
                  </Button>
                  <Button
                    size="small"
                    aria-label={`下移${row.metric_name}`}
                    disabled={busy || index === metrics.length - 1}
                    onClick={() => onMove(id, "down")}
                  >
                    ↓
                  </Button>
                </Space>
              );
            },
          },
        ]
      : []),
    ...(showFavorites
      ? [
          {
            title: "收藏",
            fixed: "right" as const,
            align: "center" as const,
            render: (_: unknown, row: ValueRow) => (
              <Button
                type="text"
                className="mp-star"
                aria-label={`${favorites.some((item) => item.metric_id === row.metric_id) ? "取消收藏" : "收藏"}${row.metric_name}`}
                disabled={busy}
                onClick={() => favorite(row.metric_id!)}
                icon={
                  favorites.some((item) => item.metric_id === row.metric_id) ? (
                    <StarFilled />
                  ) : (
                    <StarOutlined />
                  )
                }
              />
            ),
          },
        ]
      : []),
  ];
  return (
    <>
      {values.error && <Feedback read={values} />}
      {values.treeError && (
        <Alert
          type="error"
          title={values.treeError}
          action={
            <Button
              disabled={busy}
              onClick={() => {
                for (const row of flatten(rows))
                  if (
                    values.expanded.includes(row.key) &&
                    !row.children?.length
                  )
                    void values.expand(true, row);
              }}
            >
              重试展开
            </Button>
          }
        />
      )}
      <Table<ValueRow>
        className="mp-metric-table"
        rowKey="key"
        dataSource={rows}
        columns={cols}
        rowClassName={(row) =>
          row.metric_id === metricId ? "mp-selected-row" : ""
        }
        loading={variant === "preview" && values.loading}
        pagination={false}
        size="small"
        scroll={{ x: "max-content" }}
        components={{ header: { cell: ResizeHeader } }}
        expandable={{
          expandedRowKeys: values.expanded,
          onExpand: (expanded, row) => void values.expand(expanded, row),
          indentSize: 22,
          rowExpandable: (row) => !!row.child_count,
          expandIcon: ({ expanded, record }) =>
            record.child_count ? (
              <Button
                size="small"
                className="mp-expand"
                disabled={unresolved}
                loading={values.loadingRows.has(record.key)}
                aria-busy={values.loadingRows.has(record.key)}
                aria-label={`${expanded ? "收起" : "展开"}${record.metric_name}`}
                onClick={() => void values.expand(!expanded, record)}
              >
                {values.loadingRows.has(record.key)
                  ? null
                  : expanded
                    ? "−"
                    : "+"}
              </Button>
            ) : (
              <span className="mp-expand-spacer" />
            ),
        }}
      />
    </>
  );
}

function ResizeHeader({
  width,
  onWidth,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  width?: number;
  onWidth?: (width: number) => void;
}) {
  return (
    <th {...props} style={{ ...props.style, ...(width ? { width } : {}) }}>
      {props.children}
      {onWidth && (
        <span
          className="mp-column-resizer"
          role="separator"
          aria-label="调整指标名称列宽"
          onPointerDown={(event) => {
            const node = event.currentTarget,
              start = event.clientX,
              original = width ?? 220;
            node.setPointerCapture(event.pointerId);
            node.onpointermove = (move) =>
              onWidth(
                Math.max(120, Math.min(500, original + move.clientX - start)),
              );
            node.onpointerup = () => {
              node.onpointermove = null;
              node.onpointerup = null;
            };
          }}
        />
      )}
    </th>
  );
}
function FormattedNumber({ value }: { value?: string }) {
  const match = value?.match(/^(-?[\d,]+)(\.)(\d+)(.*)$/);
  return match ? (
    <>
      {match[1]}
      {match[2]}
      <span className="mp-decimal">{match[3]}</span>
      {match[4]}
    </>
  ) : (
    <>{display(value)}</>
  );
}
function Spark({
  metricId,
  query,
  revision,
  years,
  onDates,
  legacyRange = false,
}: {
  metricId: number;
  query: Query;
  revision: number;
  years?: string[];
  onDates?: (dates: string[]) => void;
  legacyRange?: boolean;
}) {
  const { service, appearance } = usePreview(),
    element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  const trend = useRead(
    visible
      ? `spark:${metricId}:${query.unitId}:${query.entityId}:${query.date}:${years?.length}:${revision}`
      : null,
    (signal) =>
      service.trend(
        {
          metric_id: metricId,
          ...(query.entityId
            ? { entity_id: query.entityId }
            : { unit_id: query.unitId }),
          date_name: years ? String(new Date().getFullYear()) : query.date,
          freq_count: years?.length ?? 12,
        },
        signal,
      ),
  );
  const option = useMemo(
    () =>
      sparkOption(trend.data ?? { code: 0 }, years, appearance === "dashboard"),
    [trend.data, years, appearance],
  );
  useEffect(() => {
    if (legacyRange) {
      if (trend.data?.date_start && trend.data.date_end)
        onDates?.([trend.data.date_start, trend.data.date_end]);
    } else if (trend.data?.date_list) onDates?.(trend.data.date_list);
  }, [trend.data, onDates, legacyRange]);
  return (
    <div className="mp-spark" ref={element}>
      {trend.error ? (
        <Button
          size="small"
          onClick={() => void trend.reload().catch(() => {})}
        >
          重试
        </Button>
      ) : trend.loading ? (
        <Spin size="small" />
      ) : trend.data ? (
        <Chart label={`指标 ${metricId} 趋势`} height={30} option={option} />
      ) : (
        "-"
      )}
    </div>
  );
}
