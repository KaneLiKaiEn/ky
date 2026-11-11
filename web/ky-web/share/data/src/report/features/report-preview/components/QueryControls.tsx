import {
  Component,
  lazy,
  Suspense,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert, Button, Spin } from "antd";
import type {
  UnitSelectProps,
  DateFieldsProps,
} from "../../../../metric/features/query-controls/index";

import { loadControls } from "../loadQueryControls";

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
        title="选择器加载失败"
        description={this.state.error.message}
        action={<Button onClick={this.props.retry}>重试加载选择器</Button>}
      />
    ) : (
      this.props.children
    );
  }
}
function RemoteControl({
  name,
  props,
}:
  | {
      name: "UnitSelect";
      props: UnitSelectProps;
    }
  | { name: "DateFields"; props: DateFieldsProps }) {
  const [attempt, setAttempt] = useState(0);
  const Unit = useMemo(
    () =>
      lazy(() =>
        loadControls(attempt).then((module) => ({
          default: module.UnitSelect,
        })),
      ),
    [attempt],
  );
  const Dates = useMemo(
    () =>
      lazy(() =>
        loadControls(attempt).then((module) => ({
          default: module.DateFields,
        })),
      ),
    [attempt],
  );
  return (
    <Boundary key={attempt} retry={() => setAttempt((n) => n + 1)}>
      <Suspense
        fallback={
          <span role="status">
            <Spin size="small" /> 正在加载选择器…
          </span>
        }
      >
        {name === "UnitSelect" ? <Unit {...props} /> : <Dates {...props} />}
      </Suspense>
    </Boundary>
  );
}
export function UnitSelect(props: UnitSelectProps) {
  return <RemoteControl name="UnitSelect" props={props} />;
}
export function DateFields(props: DateFieldsProps) {
  return <RemoteControl name="DateFields" props={props} />;
}
