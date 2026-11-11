import { Alert, Button, Skeleton } from "antd";
export interface FeedbackProps {
  loading?: boolean;
  error?: string;
  retry: () => void;
  title?: string;
}
export default function Feedback({
  loading,
  error,
  retry,
  title = "加载失败",
}: FeedbackProps) {
  return error ? (
    <Alert
      type="error"
      showIcon
      title={title}
      description={error}
      action={<Button onClick={retry}>重试读取</Button>}
    />
  ) : loading ? (
    <Skeleton active />
  ) : null;
}
