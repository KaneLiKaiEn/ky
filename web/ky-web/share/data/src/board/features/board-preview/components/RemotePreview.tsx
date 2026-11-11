import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert, Button, Spin } from "antd";
import type { ArgValueRow } from "../../../types/references.d.ts";
import type { PreviewTarget, RequestRunner } from "../runtime";
export interface MetricBinding {
  metricId: number;
  title?: string;
}
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
        showIcon
        title="预览加载失败"
        description={this.state.error.message}
        action={<Button onClick={this.props.retry}>重试加载预览</Button>}
      />
    ) : (
      this.props.children
    );
  }
}
export default function RemotePreview({
  type,
  id,
  metrics = [],
  args,
  revision,
  runner,
  depth,
  onBusyChange,
  onNavigate,
}: {
  type: "METRIC" | "REPORT";
  id?: number;
  metrics?: MetricBinding[];
  args: ArgValueRow[];
  revision: number;
  runner: RequestRunner;
  depth: number;
  onBusyChange?: (busy: boolean) => void;
  onNavigate: (target: PreviewTarget) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const Metric = useMemo(
    () => lazy(() => import("../../../../metric/preview")),
    [attempt],
  );
  const Report = useMemo(
    () => lazy(() => import("../../../../report/preview")),
    [attempt],
  );
  useEffect(() => () => onBusyChange?.(false), [onBusyChange]);
  const shared = {
    argList: args
      .filter((arg) => !!arg.arg_code)
      .map((arg) => ({
        arg_code: arg.arg_code!,
        arg_type: arg.arg_type || "STR",
        arg_value: String(arg.arg_value ?? ""),
      })),
    refreshKey: revision,
    requestRunner: runner,
    autoRefresh: false,
    depth,
    onBusyChange,
    onNavigate,
  };
  return (
    <Boundary key={attempt} retry={() => setAttempt((n) => n + 1)}>
      <Suspense
        fallback={
          <div className="bp-loading">
            <Spin />
          </div>
        }
      >
        {type === "METRIC" ? (
          <Metric {...shared} metrics={metrics} />
        ) : (
          <Report {...shared} reportId={id!} />
        )}
      </Suspense>
    </Boundary>
  );
}
