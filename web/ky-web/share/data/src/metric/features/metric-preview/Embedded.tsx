import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Empty } from "antd";
import { useManagementSession, type ManagementSession } from "comm/management";
import type { MetricRow } from "../../types/metric.d.ts";
import { Context, type PreviewContext } from "./context";
import { createRuntime, type RequestRunner } from "./runtime";
import { createService } from "./service";
import { embeddedQuery } from "./embeddedQuery";
import { mergePreviewArguments } from "./model";
import { useRead } from "./hooks/useRead";
import { PreviewModal, usePreviewStyle } from "./theme";
import type { PreviewArgument, PreviewTarget } from "./types";
import { CardGroup } from "./components/Cards";
import MetricDetail from "./components/MetricDetail";
import Feedback from "./components/Feedback";
import EmbeddedPreview from "./components/EmbeddedPreview";
import "./style.scss";

export interface EmbeddedMetricProps {
  metrics: { metricId: number; title?: string }[];
  argList?: PreviewArgument[];
  active?: boolean;
  className?: string;
  refreshKey?: number;
  autoRefresh?: boolean;
  requestRunner?: RequestRunner;
  depth?: number;
  onBusyChange?: (busy: boolean) => void;
  onNavigate?: (target: PreviewTarget) => void;
}
export default function EmbeddedMetric(props: EmbeddedMetricProps) {
  const session = useManagementSession(true);
  return session.data ? (
    <Workspace
      key={`${session.data.sessionId}:${session.data.orgId}:${session.data.userId}`}
      {...props}
      session={session.data}
    />
  ) : (
    <Feedback read={session} />
  );
}
function Workspace({
  session,
  metrics,
  argList = [],
  refreshKey = 0,
  requestRunner,
  depth = 0,
  onBusyChange,
  onNavigate,
  className,
}: EmbeddedMetricProps & { session: ManagementSession }) {
  const runtime = useMemo(
    () => createRuntime(2, requestRunner),
    [requestRunner],
  );
  const service = useMemo(() => createService(runtime), [runtime]);
  const sharedRunner = useMemo<RequestRunner>(
    () =>
      requestRunner ||
      ((signal, task) =>
        runtime.read(`embedded:${++requestSequence}`, () => task(), signal)),
    [requestRunner, runtime],
  );
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const busy = Object.values(locks).some(Boolean);
  const setBusy = useCallback(
    (key: string, value: boolean) =>
      setLocks((old) => (old[key] === value ? old : { ...old, [key]: value })),
    [],
  );
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  const desired = JSON.stringify({ metrics, argList, refreshKey });
  const [accepted, setAccepted] = useState(desired);
  const [reading, setReading] = useState(false);
  // A nested report may be editing or exporting; do not unmount it on a host tick.
  useEffect(() => {
    const previous = JSON.parse(accepted);
    if (
      !busy &&
      (!reading ||
        JSON.stringify(previous.argList) !== JSON.stringify(argList) ||
        JSON.stringify(previous.metrics) !== JSON.stringify(metrics))
    )
      setAccepted(desired);
  }, [busy, reading, desired, accepted]);
  const input = useMemo(
    () =>
      JSON.parse(accepted) as {
        metrics: EmbeddedMetricProps["metrics"];
        argList: PreviewArgument[];
        refreshKey: number;
      },
    [accepted],
  );
  const query = useRead(`query:${JSON.stringify(input.argList)}`, (signal) =>
    embeddedQuery(service, session.userId, input.argList, signal),
  );
  const definitions = useRead(
    `definitions:${JSON.stringify(input.metrics)}`,
    async (signal) => {
      const rows: MetricRow[] = [];
      for (const item of input.metrics) {
        const result = await service.property(
          { metric_id: item.metricId },
          signal,
        );
        if (!result.metric_property)
          throw new Error(`指标 ${item.metricId} 不存在或无权访问`);
        rows.push({
          ...result.metric_property,
          metric_name: item.title || result.metric_property.metric_name,
        });
      }
      return rows;
    },
  );
  const [selected, setSelected] = useState<number>();
  const [detailDate, setDetailDate] = useState<string>();
  const [target, setTarget] = useState<PreviewTarget>();
  const style = usePreviewStyle();
  const open = (next: PreviewTarget) => {
    if ((next.depth ?? depth + (selected ? 2 : 1)) > 5 || busy) return;
    next = {
      ...next,
      argList: mergePreviewArguments(input.argList, next.argList),
      depth: next.depth ?? depth + (selected ? 2 : 1),
    };
    if (onNavigate) onNavigate(next);
    else setTarget(next);
  };
  const entities = useRead(
    selected && query.data ? `entities:${query.data.unitId}` : null,
    (signal) => service.entities({ unit_id: query.data!.unitId }, signal),
  );
  if (!query.data || !definitions.data)
    return (
      <div className="mp-embedded">
        <Feedback read={query} />
        <Feedback read={definitions} />
      </div>
    );
  const identity = `${session.sessionId}:${session.orgId}:${accepted}`;
  const context: PreviewContext = {
    identity,
    session,
    service,
    query: query.data,
    detailQuery: { ...query.data, date: detailDate || query.data.date },
    entityIds: (entities.data?.row_list ?? [])
      .map((row) => row.entity_id!)
      .filter(Boolean),
    catalogs: [],
    dynamic: false,
    busy,
    style,
    favorites: [],
    allowFavorites: false,
    metricId: selected,
    host: {
      argList: input.argList,
      requestRunner: sharedRunner,
      depth: depth + (selected ? 1 : 0),
      refreshKey: input.refreshKey,
      autoRefresh: false,
    },
    setBusy,
    open,
    setQuery: () => {},
    selectCatalog: () => {},
    selectMetric: (id, date) => {
      if (!busy && depth < 5) {
        setSelected(id);
        setDetailDate(date);
      }
    },
    favorite: () => {},
    reloadFavorites: async () => {},
  };
  return (
    <Context.Provider value={context}>
      <div
        className={`mp-workspace mp-embedded ${className || ""}`}
        style={style}
      >
        {input.metrics.length ? (
          <CardGroup
            catalog={{ catalog_id: 0, catalog_name: "" }}
            day={query.data.date}
            metrics={definitions.data}
            revision={input.refreshKey}
            embedded
            onLoadingChange={setReading}
          />
        ) : (
          <Empty description="尚未绑定指标" />
        )}
        {depth >= 5 && <Alert type="info" title="明细已达到最大嵌套层数" />}
      </div>
      <PreviewModal
        open={!!selected}
        title="指标详情"
        className="mp-modal"
        width="94vw"
        zIndex={1500 + (depth + 1) * 100}
        style={{ top: 24 }}
        styles={{ body: { height: "78vh", overflow: "auto" } }}
        footer={null}
        destroyOnHidden
        closable={!busy}
        mask={{ closable: !busy }}
        keyboard={!busy}
        onCancel={() => {
          if (!busy) setSelected(undefined);
        }}
      >
        {selected && <MetricDetail resolveLibrary />}
      </PreviewModal>
      <PreviewModal
        open={!!target}
        title={target?.title || "明细"}
        className="mp-modal"
        width="94vw"
        zIndex={1500 + (target?.depth ?? depth + 1) * 100}
        style={{ top: 24 }}
        footer={null}
        destroyOnHidden
        closable={!busy}
        mask={{ closable: !busy }}
        keyboard={!busy}
        onCancel={() => {
          if (!busy) setTarget(undefined);
        }}
      >
        {target && <EmbeddedPreview target={target} />}
      </PreviewModal>
    </Context.Provider>
  );
}
let requestSequence = 0;
