import { PreviewModal } from "../theme";
import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Alert, Button, Spin, Tabs } from "antd";
import { usePreview } from "../context";
import type { PreviewTarget } from "../types";
import { mergePreviewArguments } from "../model";

class Boundary extends Component<
  { children: ReactNode; retry: () => void },
  { error?: Error }
> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <Alert
        type="error"
        title="预览加载失败"
        description={this.state.error.message}
        action={<Button onClick={this.props.retry}>重试加载预览</Button>}
      />
    ) : (
      this.props.children
    );
  }
}
export default function EmbeddedPreview({
  target,
  active = true,
}: {
  target: PreviewTarget;
  active?: boolean;
}) {
  const { setBusy, open, host } = usePreview();
  const [attempt, setAttempt] = useState(0),
    key = useRef(`preview:${Math.random()}`);
  const busy = useCallback(
    (value: boolean) => setBusy(key.current, value),
    [setBusy],
  );
  useEffect(() => () => busy(false), [busy]);
  const Board = useMemo(
    () => lazy(() => import("../../../../board/preview")),
    [attempt],
  );
  const Report = useMemo(
    () => lazy(() => import("../../../../report/preview")),
    [attempt],
  );
  if (!active) return null;
  if ((host?.depth ?? -1) >= 5)
    return <Alert type="info" title="明细已达到最大嵌套层数" />;
  const embeddedProps = {
    requestRunner: host?.requestRunner,
    refreshKey: host?.refreshKey,
    autoRefresh: host?.autoRefresh,
    depth: target.depth ?? (host?.depth ?? -1) + 1,
    onBusyChange: busy,
    onNavigate: open,
  };
  const args = mergePreviewArguments(host?.argList ?? [], target.argList);
  return (
    <Boundary
      key={`${target.type}:${attempt}`}
      retry={() => setAttempt((value) => value + 1)}
    >
      <Suspense
        fallback={
          <div className="mp-loading">
            <Spin />
          </div>
        }
      >
        {target.type === "BOARD" ? (
          <Board
            {...embeddedProps}
            boardId={target.id}
            argList={args}
            active={active}
            className="mp-embedded-board"
          />
        ) : (
          <Report
            {...embeddedProps}
            reportId={target.id}
            argList={args}
            active={active}
            className="mp-embedded-report"
          />
        )}
      </Suspense>
    </Boundary>
  );
}
type Target = PreviewTarget & { key: string };
export function PreviewDialogs({
  targets,
  setTargets,
}: {
  targets: Target[];
  setTargets: Dispatch<SetStateAction<Target[]>>;
}) {
  const { busy } = usePreview();
  const [selected, setSelected] = useState<string>();
  const last = targets[targets.length - 1]?.key;
  useEffect(() => setSelected(last), [last]);
  const active = targets.some((target) => target.key === selected)
    ? selected
    : last;
  return (
    <PreviewModal
      className="mp-modal mp-preview-modal"
      open={targets.length > 0}
      title={targets.find((target) => target.key === active)?.title || "预览"}
      width="100vw"
      style={{ top: 35, maxWidth: "100vw", paddingBottom: 0 }}
      styles={{ body: { height: "calc(100dvh - 107px)", overflow: "auto" } }}
      footer={null}
      destroyOnHidden
      closable={!busy}
      mask={{ closable: !busy }}
      keyboard={!busy}
      onCancel={() => {
        if (!busy) setTargets([]);
      }}
    >
      <Tabs
        type="editable-card"
        hideAdd
        activeKey={active}
        destroyOnHidden
        onChange={(key) => {
          if (!busy) setSelected(key);
        }}
        onEdit={(key, action) => {
          if (action === "remove" && !busy)
            setTargets((previous) =>
              previous.filter((target) => target.key !== key),
            );
        }}
        items={targets.map((target) => ({
          key: target.key,
          label:
            target.title ||
            `${target.type === "BOARD" ? "看板" : "报表"} ${target.id}`,
          disabled: busy && active !== target.key,
          closable: !busy,
          children: (
            <EmbeddedPreview target={target} active={active === target.key} />
          ),
        }))}
      />
    </PreviewModal>
  );
}
