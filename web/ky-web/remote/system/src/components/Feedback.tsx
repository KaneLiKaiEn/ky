import { Alert, Button, Spin } from "antd";

interface FeedbackProps {
  loading: boolean;
  error?: string;
  retry: () => void;
  prefix?: string;
}

export function LoadFeedback({
  loading,
  error,
  retry,
  prefix = "management-page",
}: FeedbackProps) {
  if (loading)
    return (
      <div className={`${prefix}__loading`} role="status" aria-label="正在加载">
        <Spin />
      </div>
    );
  if (error)
    return (
      <Alert
        type="error"
        showIcon
        title="加载失败"
        description={error}
        action={<Button onClick={retry}>重试</Button>}
      />
    );
  return null;
}

export function SaveError({
  error,
  prefix = "management-page",
}: { error?: string; prefix?: string }) {
  return error ? (
    <Alert
      className={`${prefix}__error`}
      type="error"
      showIcon
      title="操作未完成"
      description={error}
    />
  ) : null;
}

/** Background refresh status remains visible while the last successful snapshot is rendered. */
export function RefreshFeedback({
  loading,
  error,
  retry,
  prefix = "management-page",
}: FeedbackProps) {
  if (loading)
    return (
      <div className={`${prefix}__refresh`} role="status" aria-label="正在刷新">
        <Spin size="small" /> 正在刷新
      </div>
    );
  if (error)
    return (
      <Alert
        className={`${prefix}__error`}
        type="warning"
        showIcon
        title="刷新失败"
        description={error}
        action={<Button onClick={retry}>重试</Button>}
      />
    );
  return null;
}
