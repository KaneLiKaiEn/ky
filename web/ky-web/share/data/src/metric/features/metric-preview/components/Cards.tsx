import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Empty } from "antd";
import { LeftOutlined, ReloadOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { MetricRow } from "../../../types/metric.d.ts";
import type { CatalogRow } from "../../../types/sys.d.ts";
import { usePreview } from "../context";
import { groupDate, groupLabel } from "../dates";
import { display, hasTag, metricRows, objectParams, rateClass } from "../model";
import { useRead } from "../hooks/useRead";
import { useRetainedData } from "../hooks/useRetainedData";
import { useBackground } from "../hooks/useBackground";
import { useMetricRows } from "../hooks/useMetricRows";
import { autoRefresh } from "../runtime";
import Feedback from "./Feedback";
import ValueSkeleton from "./ValueSkeleton";

export default function Cards() {
  const {
    service,
    query,
    library,
    catalogs,
    dynamic: configuredDynamic,
  } = usePreview();
  const [revision, setRevision] = useState(0);
  const [day, setDay] = useState(() => dayjs().format("YYYY-MM-DD"));
  const dynamic = configuredDynamic || hasTag(library?.lib_tag, "DYNAMIC");
  useEffect(
    () =>
      autoRefresh(async () => {
        setDay(dayjs().format("YYYY-MM-DD"));
        if (dynamic) setRevision((value) => value + 1);
      }, 60000),
    [dynamic],
  );
  const background = useBackground();
  return (
    <div className="mp-cards" style={{ backgroundImage: background.image }}>
      <div className="mp-cards-blur" />
      <div className="mp-card-groups">
        {background.error && <Feedback read={background} />}
        {catalogs.map((catalog) => (
          <CardGroup
            key={catalog.catalog_id}
            catalog={catalog}
            revision={revision}
            day={day}
          />
        ))}
        {!catalogs.length && <Empty description="暂无指标" />}
      </div>
    </div>
  );
}
export function CardGroup({
  catalog,
  revision = 0,
  day,
  metrics: supplied,
  extra,
  refreshAutomatically = false,
  variant = "preview",
  embedded = false,
  onLoadingChange,
}: {
  catalog: CatalogRow;
  revision?: number;
  day: string;
  metrics?: MetricRow[];
  extra?: ReactNode;
  refreshAutomatically?: boolean;
  variant?: "preview" | "favorites";
  embedded?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const { service, libId, query, selectMetric, identity, busy } = usePreview();
  const favorites = variant === "favorites";
  const [localRevision, setRevision] = useState(0),
    scroll = useRef<HTMLDivElement>(null);
  const date = embedded
      ? query.date
      : groupDate(catalog.catalog_name || "", query.date, dayjs(day)),
    cardQuery = { ...query, date };
  const list = useRead(
    supplied
      ? null
      : `cards:${libId}:${catalog.catalog_id}:${revision}:${localRevision}`,
    (signal) =>
      service.metrics(
        {
          lib_id: libId!,
          catalog_id: catalog.catalog_id!,
          include_shortcut: true,
        },
        signal,
      ),
  );
  const retainedList = useRetainedData(
    favorites ? JSON.stringify([identity, libId, catalog.catalog_id]) : null,
    list.data,
  );
  const metrics = supplied ?? retainedList?.row_list ?? [];
  const values = useMetricRows(metrics, cardQuery, revision + localRevision);
  const pending = favorites && values.loading && !values.rows.length;
  const rows =
    favorites && !values.rows.length
      ? metricRows(metrics, [], cardQuery)
      : values.rows;
  const childIds = metrics
    .filter((row) => row.child_count)
    .map((row) => row.metric_id!);
  const children = useRead(
    childIds.length
      ? `card-children:${JSON.stringify(childIds)}:${revision}`
      : null,
    (signal) => service.childrenBatch({ metric_id_list: childIds }, signal),
  );
  const retainedChildren = useRetainedData(
    favorites
      ? JSON.stringify([identity, libId, catalog.catalog_id, childIds])
      : null,
    children.data,
  );
  const childValues = useRead(
    retainedChildren?.row_list?.length
      ? `card-child-values:${JSON.stringify([retainedChildren.row_list, cardQuery, revision, localRevision])}`
      : null,
    (signal) =>
      service.batch(
        {
          metric_id_list: [
            ...new Set(retainedChildren!.row_list!.map((row) => row.child_id!)),
          ],
          ...objectParams(cardQuery),
          date_name: date,
          yoy_value: true,
        },
        signal,
      ),
  );
  const retainedChildValues = useRetainedData(
    favorites
      ? JSON.stringify([
          identity,
          libId,
          catalog.catalog_id,
          retainedChildren?.row_list,
          cardQuery,
        ])
      : null,
    childValues.data,
  );
  const childrenPending =
    favorites && childValues.loading && !retainedChildValues;
  const listPending = favorites && list.loading && !retainedList;
  const reading = useRef(false);
  reading.current =
    list.loading || values.loading || children.loading || childValues.loading;
  const loading = reading.current;
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);
  useEffect(() => () => onLoadingChange?.(false), [onLoadingChange]);
  useEffect(
    () =>
      refreshAutomatically
        ? autoRefresh(async () => {
            if (!reading.current) setRevision((value) => value + 1);
          }, 60000)
        : undefined,
    [refreshAutomatically],
  );
  const today = catalog.catalog_name === "今天";
  const showYoy =
    !today && (variant !== "favorites" || catalog.catalog_name !== "昨天");
  return (
    <section
      className={`mp-card-group ${today ? "mp-card-today" : ""} ${showYoy ? "" : "mp-card-no-yoy"}`}
    >
      {!embedded && (
        <header>
          <span>
            {today ? (
              <Clock date={date} />
            ) : (
              groupLabel(catalog.catalog_name || "", date)
            )}
          </span>
          <div className="mp-card-actions">
            {extra}
            <Button
              aria-label={`刷新${catalog.catalog_name}`}
              size="small"
              type="primary"
              ghost
              icon={<ReloadOutlined />}
              loading={list.loading || values.loading}
              disabled={busy}
              onClick={() => setRevision((value) => value + 1)}
            />
          </div>
        </header>
      )}
      {(!favorites || list.error) && <Feedback read={list} />}
      {values.error && <Feedback read={values} />}
      {children.error && <Feedback read={children} />}
      {childValues.error && <Feedback read={childValues} />}
      <div className="mp-card-scroll-wrap">
        <Button
          className="mp-scroll-left"
          type="text"
          aria-label="向左滚动指标卡片"
          icon={<LeftOutlined />}
          onClick={() =>
            scroll.current?.scrollBy({ left: -128, behavior: "smooth" })
          }
        />
        <div className="mp-card-scroll" ref={scroll}>
          {listPending &&
            Array.from({ length: 3 }, (_, index) => (
              <div className="mp-dynamic-card" key={index}>
                <div className="mp-dynamic-main">
                  <ValueSkeleton kind="card" contrast />
                  <ValueSkeleton contrast />
                </div>
              </div>
            ))}
          {rows.map((row) => {
            const metrics = (retainedChildren?.row_list ?? [])
              .filter((child) => child.metric_id === row.metric_id)
              .map((child) => ({
                metric_id: child.child_id,
                metric_name: child.child_title || child.child_name,
              }));
            const childRows = metricRows(
              metrics,
              retainedChildValues?.value_list ?? [],
              cardQuery,
            );
            return (
              <button
                key={row.key}
                className="mp-dynamic-card"
                disabled={pending || busy}
                onClick={() =>
                  selectMetric(row.metric_id!, date, catalog.catalog_id)
                }
              >
                <div className="mp-dynamic-main">
                  <span className="mp-dynamic-number">
                    {pending ? (
                      <ValueSkeleton kind="card" contrast />
                    ) : today ? (
                      <AnimatedNumber
                        value={
                          variant === "favorites" &&
                          row.metric_value_fmt &&
                          /^-?[\d,]+(?:\.\d+)?$/.test(row.metric_value_fmt)
                            ? Number(
                                row.metric_value_fmt.replace(/,/g, ""),
                              ).toLocaleString("zh-CN", {
                                maximumFractionDigits: 2,
                              })
                            : row.metric_value_fmt
                        }
                      />
                    ) : (
                      display(row.metric_value_fmt ?? row.metric_value)
                    )}
                  </span>
                  {showYoy && (pending || row.yoy_rate_fmt) && (
                    <span
                      className={`mp-rate-badge ${pending ? "" : rateClass(row.yoy_rate)}`}
                    >
                      {pending ? (
                        <ValueSkeleton kind="rate" contrast />
                      ) : (
                        row.yoy_rate_fmt
                      )}
                    </span>
                  )}
                  <span className="mp-dynamic-name">
                    {row.metric_title || row.metric_name}
                    {(row.metric_value_abbr || row.metric_value_unit) &&
                      `(${row.metric_value_abbr || ""}${row.metric_value_unit || ""})`}
                  </span>
                </div>
                {!!childRows.length && (
                  <div className="mp-card-child-list">
                    <table>
                      <tbody>
                        {childRows.map((child) => (
                          <tr key={child.key}>
                            <td>{child.metric_name}</td>
                            <td>
                              {childrenPending ? (
                                <ValueSkeleton contrast />
                              ) : (
                                <>
                                  {display(
                                    child.metric_value_fmt ??
                                      child.metric_value,
                                  )}{" "}
                                  {variant === "favorites"
                                    ? child.metric_value_abbr ||
                                      child.metric_value_unit
                                      ? `(${child.metric_value_abbr || ""}${child.metric_value_unit || ""})`
                                      : ""
                                    : `${child.metric_value_abbr || ""}${child.metric_value_unit || ""}`}
                                </>
                              )}
                            </td>
                            {showYoy && (
                              <td
                                className={
                                  childrenPending
                                    ? undefined
                                    : rateClass(child.yoy_rate)
                                }
                              >
                                {childrenPending ? (
                                  <ValueSkeleton kind="rate" contrast />
                                ) : (
                                  display(child.yoy_rate_fmt)
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <Button
          className="mp-scroll-right"
          type="text"
          aria-label="向右滚动指标卡片"
          icon={<RightOutlined />}
          onClick={() =>
            scroll.current?.scrollBy({ left: 128, behavior: "smooth" })
          }
        />
      </div>
    </section>
  );
}
function Clock({ date }: { date: string }) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("zh-CN", { hour12: false }),
  );
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden)
        setTime(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="mp-card-clock">
      {date} {time}
    </span>
  );
}
function AnimatedNumber({ value }: { value?: string }) {
  const [shown, setShown] = useState(value ?? "-"),
    previous = useRef(0);
  useEffect(() => {
    if (!value || !/^-?[\d,]+(?:\.\d+)?$/.test(value)) {
      setShown(display(value));
      return;
    }
    const target = Number(value.replace(/,/g, "")),
      from = previous.current,
      start = performance.now();
    let frame: number;
    const draw = (now: number) => {
      const progress = Math.min(1, (now - start) / 500),
        current = from + (target - from) * progress;
      previous.current = current;
      setShown(
        progress === 1
          ? value
          : current.toLocaleString("zh-CN", {
              maximumFractionDigits: value.includes(".") ? 2 : 0,
            }),
      );
      if (progress < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{shown}</>;
}
