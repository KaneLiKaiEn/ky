import { useAppTheme } from "comm/theme";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Descriptions, Empty, Space, Spin } from "antd";
import {
  DatabaseOutlined,
  ReloadOutlined,
  SelectOutlined,
} from "@ant-design/icons";
import type { BoardComponentRow } from "../../../types/board.d.ts";
import type { ArgValueRow } from "../../../types/references.d.ts";
import { displayValue, supportedType, nativeType } from "../model";
import { loadComponent, loadBindings } from "../service";
import { useRead } from "../hooks/useRead";
import type { LoadQueue } from "../runtime";
import ChartFrame, { type BoardActions } from "./ChartFrame";
import DataTable from "./DataTable";
import RawData from "./RawData";
import RemotePreview from "./RemotePreview";
import type { PreviewTarget } from "../runtime";
export interface ComponentRun {
  args: ArgValueRow[];
  revision: number;
}
export default function ComponentCard({
  component,
  run,
  screen,
  queue,
  actions,
  refresh,
}: {
  component: BoardComponentRow;
  run: ComponentRun;
  screen: boolean;
  queue: LoadQueue;
  actions: BoardActions;
  refresh: () => void;
}) {
  const [raw, setRaw] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { resolvedMode } = useAppTheme();
  const supported = supportedType(component.component_type);
  const native = nativeType(component.component_type);
  const external =
    component.component_type === "METRIC" ||
    component.component_type === "REPORT";
  const bindings = useRead(
    `bindings:${component.board_component_id}:${component.component_type}`,
    async (signal) =>
      external
        ? queue.run(signal, () => loadBindings(component, signal))
        : undefined,
  );
  const onBusyChange = useCallback(
    (busy: boolean) =>
      actions.setBusy?.(`component:${component.board_component_id}`, busy),
    [actions.setBusy, component.board_component_id],
  );
  const onNavigate = (target: PreviewTarget) =>
    actions.openTarget
      ? actions.openTarget(target)
      : target.type === "BOARD"
        ? actions.openBoard(target.id, target.argList)
        : actions.openReport?.(target.id, target.argList);
  useEffect(() => {
    if (!content.current || !native) return;
    let timer: ReturnType<typeof setTimeout>;
    const node = content.current;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(
        () => setSize({ width: node.clientWidth, height: node.clientHeight }),
        160,
      );
    });
    observer.observe(node);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [native]);
  const key = `${component.board_component_id}:${JSON.stringify(run.args)}:${screen}:${resolvedMode}:${size.width}:${size.height}`;
  const read = useRead(
    key,
    async (signal) => {
      if (!native || size.width <= 0 || size.height <= 0) return undefined;
      return queue.run(signal, () =>
        loadComponent(
          component,
          run.args,
          size.width,
          size.height,
          resolvedMode,
          screen,
          signal,
        ),
      );
    },
    run.revision,
  );
  const title =
    component.component_title ||
    component.component_name ||
    `组件 ${component.board_component_id}`;
  return (
    <section
      className="bp-component"
      aria-label={title}
      data-component-id={component.board_component_id}
    >
      <header className="bp-component-header">
        <strong>{title}</strong>
        {supported && (
          <Space size={0}>
            {read.loading && !!read.data && <Spin size="small" />}
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              aria-label={`刷新 ${title}`}
              disabled={actions.busy}
              onClick={refresh}
            />
            {native && (
              <Button
                type="text"
                size="small"
                icon={<DatabaseOutlined />}
                aria-label={`原始数据 ${title}`}
                onClick={() => setRaw(true)}
              />
            )}
            {!!component.detail_id && (
              <Button
                type="text"
                size="small"
                icon={<SelectOutlined />}
                disabled={actions.busy}
                aria-label={`查看明细 ${title}`}
                onClick={() =>
                  component.detail_type === "REPORT"
                    ? actions.openReport?.(component.detail_id!, run.args)
                    : actions.openBoard(component.detail_id!, run.args)
                }
              />
            )}
          </Space>
        )}
      </header>
      <div ref={content} className="bp-component-body">
        {!supported ? (
          <div className="bp-deferred">
            {`暂不支持组件类型 ${component.component_type || "未知"}`}
          </div>
        ) : external ? (
          bindings.error ? (
            <Alert
              type="error"
              title={bindings.error}
              action={<Button onClick={bindings.reload}>重试绑定</Button>}
            />
          ) : !bindings.data ? (
            <div className="bp-loading">
              <Spin />
            </div>
          ) : !bindings.data.length ? (
            <Empty
              description={
                component.component_type === "METRIC"
                  ? "尚未绑定指标"
                  : "尚未绑定报表"
              }
            />
          ) : (
            <RemotePreview
              type={component.component_type as "METRIC" | "REPORT"}
              id={bindings.data[0].id}
              metrics={bindings.data.map((row) => ({
                metricId: row.id,
                title: row.title,
              }))}
              args={run.args}
              revision={run.revision}
              runner={queue.run}
              depth={actions.depth ?? 0}
              onBusyChange={onBusyChange}
              onNavigate={onNavigate}
            />
          )
        ) : read.error ? (
          <Alert
            type="error"
            showIcon
            title={read.error}
            action={
              <Button size="small" onClick={read.reload}>
                重试
              </Button>
            }
          />
        ) : !read.data ? (
          <div className="bp-loading">
            <Spin />
          </div>
        ) : component.component_type === "CHART" ? (
          <ChartFrame
            result={read.data.result}
            title={title}
            actions={actions}
            source={component.board_component_id}
          />
        ) : component.component_type === "TABLE" ? (
          <DataTable
            rows={read.data.rows ?? []}
            columns={read.data.columns ?? []}
            thresholds={read.data.thresholds ?? {}}
            actions={actions}
            componentId={component.board_component_id!}
            args={run.args}
            style={read.data.result.style_content}
          />
        ) : (
          <Descriptions
            column={1}
            size="small"
            bordered
            items={read.data.fields?.map((field) => ({
              key: field.column.col_code,
              label: field.column.col_name || field.column.col_code,
              children: Array.isArray(field.value)
                ? field.value
                    .map((row) => displayValue(row?.[field.column.col_code!]))
                    .join("、")
                : displayValue(field.value),
            }))}
          />
        )}
      </div>
      {raw && (
        <RawData
          componentId={component.board_component_id!}
          args={run.args}
          queue={queue}
          depth={actions.depth}
          close={() => setRaw(false)}
        />
      )}
    </section>
  );
}
