import { useMemo, useState } from "react";
import { Alert, Button, Empty, Table } from "antd";
import { StarFilled, StarOutlined } from "@ant-design/icons";
import type { MetricRow } from "../../../types/metric.d.ts";
import type { FactorRow } from "../../../types/factor.d.ts";
import { Context, usePreview } from "../context";
import {
  detailTarget,
  display,
  hasTag,
  metricName,
  metricRows,
  objectParams,
  previewArgs,
  rateClass,
} from "../model";
import { useRead } from "../hooks/useRead";
import { treemapOption } from "../chartOptions";
import Feedback from "./Feedback";
import EmbeddedPreview from "./EmbeddedPreview";
import Trend from "./Trend";
import Analysis from "./Analysis";
import FactorDialog from "./FactorDialog";
import AiAnalysisPanel from "./AiAnalysisPanel";
import Chart from "./Chart";

export default function MetricDetail({
  resolveLibrary = false,
}: {
  resolveLibrary?: boolean;
}) {
  const context = usePreview();
  const {
    service,
    metricId,
    identity,
    detailQuery: query,
    library,
    entityIds,
  } = context;
  const property = useRead(
    metricId ? `metric:${identity}:${metricId}` : null,
    async (signal) => {
      const result = await service.property({ metric_id: metricId! }, signal);
      if (!result.metric_property) throw new Error("指标不存在或不可访问");
      return result.metric_property;
    },
  );
  const ownLibrary = useRead(
    resolveLibrary && property.data?.lib_id
      ? `detail-library:${property.data.lib_id}`
      : null,
    async (signal) => {
      const result = await service.library(
        { lib_id: property.data!.lib_id! },
        signal,
      );
      if (!result.lib_property) throw new Error("指标库不存在或不可访问");
      return result.lib_property;
    },
  );
  if (!metricId)
    return (
      <div className="mp-detail">
        {!resolveLibrary && (
          <Empty className="mp-empty" description="暂无数据" />
        )}
        {!resolveLibrary && library?.board_id ? (
          <EmbeddedPreview
            target={{
              type: "BOARD",
              id: library?.board_id,
              argList: previewArgs(query, undefined, entityIds),
            }}
          />
        ) : null}
      </div>
    );
  return (
    <div className="mp-detail">
      <Feedback read={property} />
      {resolveLibrary && <Feedback read={ownLibrary} />}
      {property.data &&
        (!resolveLibrary || !property.data.lib_id || ownLibrary.data) && (
          <Context.Provider
            value={{
              ...context,
              library: resolveLibrary ? ownLibrary.data : library,
            }}
          >
            <ReadyDetail
              key={`${identity}:${metricId}`}
              metric={property.data}
            />
          </Context.Provider>
        )}
    </div>
  );
}
function ReadyDetail({ metric }: { metric: MetricRow }) {
  const {
    appearance,
    allowFavorites = true,
    service,
    detailQuery: query,
    library,
    favorites,
    favorite,
    open,
    busy,
    entityIds,
  } = usePreview();
  const [factor, setFactor] = useState<FactorRow>();
  const value = useRead(
    `current:${JSON.stringify([metric.metric_id, query])}`,
    async (signal) => {
      const result = await service.batch(
        {
          metric_id_list: [metric.metric_id!],
          ...objectParams(query),
          date_name: query.date,
          yoy_value: true,
          pop_value: true,
          goal_value: true,
        },
        signal,
      );
      return metricRows([metric], result.value_list ?? [], query)[0];
    },
  );
  const factors = useRead(`variables:${metric.metric_id}`, async (signal) => {
    const list = await service.variables(
      { metric_id: metric.metric_id! },
      signal,
    );
    const ids = [
      ...new Set(
        (list.row_list ?? [])
          .filter((row) => row.data_type === "FACTOR" && row.data_id)
          .map((row) => row.data_id!),
      ),
    ];
    return ids.length
      ? ((await service.factors({ factor_id_list: ids }, signal)).factor_list ??
          [])
      : [];
  });
  const args = previewArgs(query, metric.metric_id, entityIds),
    custom = hasTag(metric.value_tag, "CUSTOM");
  const target = detailTarget(
      metric.detail_type,
      metric.detail_id,
      args,
      metric.detail_name,
    ),
    cause = detailTarget(
      metric.cause_type,
      metric.cause_id,
      args,
      metric.cause_name,
    );
  return (
    <>
      {(!custom || appearance === "dashboard") && (
        <>
          <div className="mp-summary">
            <div className="mp-summary-heading">
              <span>
                {allowFavorites && (
                  <Button
                    className="mp-star"
                    type="text"
                    size="small"
                    aria-label="收藏当前指标"
                    disabled={busy}
                    icon={
                      favorites.some(
                        (row) => row.metric_id === metric.metric_id,
                      ) ? (
                        <StarFilled />
                      ) : (
                        <StarOutlined />
                      )
                    }
                    onClick={() => favorite(metric.metric_id!)}
                  />
                )}
                {metricName(metric)}
              </span>
              <span>
                {display(value.data?.metric_value_fmt)}
                {value.data?.metric_value_abbr}
                {value.data?.metric_value_unit}
                {value.data?.metric_value != null &&
                  value.data?.metric_value_fmt !== value.data.metric_value &&
                  `(${value.data.metric_value})`}
              </span>
            </div>
            <div>{metric.metric_desc || "-"}</div>
            <div>时段：{query.date}</div>
            <div>单元：{query.unitName}</div>
            <div>计算公式：{display(value.data?.metric_value_formula)}</div>
            <div>计算表达式：{display(value.data?.metric_value_express)}</div>
            <div>
              同期值：
              {display(
                appearance === "dashboard"
                  ? value.data?.yoy_rate_fmt
                  : value.data?.yoy_value_fmt,
              )}
            </div>
            <div>
              环期值：
              {display(
                appearance === "dashboard"
                  ? value.data?.pop_rate_fmt
                  : value.data?.pop_value_fmt,
              )}
            </div>
            <div>
              计算因子：
              {factors.data?.map((row) => (
                <button
                  className="mp-inline-link"
                  key={row.factor_id}
                  onClick={() => setFactor(row)}
                >
                  {row.factor_name}
                </button>
              ))}
            </div>
            {appearance === "dashboard" ? (
              <div>监管科室：{display(metric.admin_name)}</div>
            ) : (
              <div>
                分析看板：
                {cause ? (
                  <button
                    className="mp-inline-link"
                    disabled={busy}
                    onClick={() => open(cause)}
                  >
                    {metric.cause_name || "查看"}
                  </button>
                ) : (
                  display(metric.cause_name)
                )}
              </div>
            )}
            {value.error && <Feedback read={value} />}
            {factors.error && <Feedback read={factors} />}
          </div>
        </>
      )}
      {!custom && (
        <>
          <Trend metricId={metric.metric_id!} />
          <Relations
            key={`children:${metric.metric_id}`}
            metric={metric}
            kind="children"
          />
          {!hasTag(library?.lib_tag, "HIDE_CHART") && (
            <Analysis metric={metric} />
          )}
          <Relations
            key={`links:${metric.metric_id}`}
            metric={metric}
            kind="links"
          />
        </>
      )}
      {target ? (
        <EmbeddedPreview
          key={`${target.type}:${target.id}:${JSON.stringify(target.argList)}`}
          target={target}
        />
      ) : custom ? (
        <Empty description="该指标尚未配置自定义详情" />
      ) : null}
      {factor && (
        <FactorDialog
          key={`${factor.factor_id}:${query.unitId}:${query.entityId}:${query.date}`}
          factor={factor}
          close={() => setFactor(undefined)}
        />
      )}
      {(!custom || appearance === "dashboard") && (
        <AiAnalysisPanel metric={metric} />
      )}
    </>
  );
}
function Relations({
  metric,
  kind,
}: {
  metric: MetricRow;
  kind: "children" | "links";
}) {
  const { service, detailQuery: query, selectMetric } = usePreview();
  const read = useRead(
    `${kind}:${JSON.stringify([metric.metric_id, query])}`,
    async (signal) => {
      const list =
        kind === "children"
          ? (
              await service.children({ metric_id: metric.metric_id! }, signal)
            ).row_list?.map((row) => ({
              metric_id: row.child_id,
              metric_name: row.child_name,
              metric_title: row.child_title,
            }))
          : (
              await service.links({ metric_id: metric.metric_id! }, signal)
            ).row_list?.map((row) => ({
              metric_id: row.link_id,
              metric_name: row.link_name,
            }));
      if (!list?.length) return [];
      const result = await service.batch(
        {
          metric_id_list: list.map((row) => row.metric_id!),
          ...objectParams(query),
          date_name: query.date,
          yoy_value: true,
          pop_value: true,
        },
        signal,
      );
      return metricRows(list, result.value_list ?? [], query);
    },
  );
  const treemap = useMemo(() => treemapOption(read.data ?? []), [read.data]);
  if (!read.loading && !read.error && !read.data?.length) return null;
  return (
    <section className="mp-section">
      <div className="mp-section-title">
        {metricName(metric)}-{kind === "children" ? "子项" : "相关"}指标
      </div>
      <Feedback read={read} />
      {read.data && (
        <div className={kind === "children" ? "mp-relation-grid" : ""}>
          {kind === "children" && (
            <Chart label="子项指标矩形树图" option={treemap} height={200} />
          )}
          <Table
            rowKey="key"
            size="small"
            bordered
            pagination={false}
            dataSource={read.data}
            scroll={{ x: "max-content" }}
            columns={[
              {
                title: "指标名称",
                render: (_, row) => (
                  <button
                    className="mp-inline-link"
                    onClick={() => selectMetric(row.metric_id!, query.date)}
                  >
                    {row.metric_title || row.metric_name}
                  </button>
                ),
              },
              {
                title: "指标值",
                align: "right",
                render: (_, row) =>
                  `${display(row.metric_value_fmt)} ${row.metric_value_abbr || ""}${row.metric_value_unit || ""}`,
              },
              {
                title: "同比",
                align: "right",
                render: (_, row) => (
                  <span className={rateClass(row.yoy_rate)}>
                    {display(row.yoy_rate_fmt)}
                  </span>
                ),
              },
              {
                title: "环比",
                align: "right",
                render: (_, row) => (
                  <span className={rateClass(row.pop_rate)}>
                    {display(row.pop_rate_fmt)}
                  </span>
                ),
              },
            ]}
          />
        </div>
      )}
    </section>
  );
}
