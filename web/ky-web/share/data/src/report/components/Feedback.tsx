import { Alert, Button, Skeleton } from "antd";

export default function Feedback({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: string;
  retry?: () => void;
}) {
  return (
    <>
      {error && (
        <Alert
          type="error"
          showIcon
          title="读取失败"
          description={error}
          action={retry && <Button onClick={retry}>重试读取</Button>}
        />
      )}
      {loading && <Skeleton active paragraph={{ rows: 3 }} />}
    </>
  );
}
