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
      {loading && <Skeleton active paragraph={{ rows: 3 }} />}
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          action={
            retry && (
              <Button size="small" onClick={retry}>
                重试读取
              </Button>
            )
          }
        />
      )}
    </>
  );
}
