import { Alert, Button, Spin } from "antd";
export default function Feedback({
  read,
}: {
  read: { error?: string; loading: boolean; reload: () => Promise<unknown> };
}) {
  return read.error ? (
    <Alert
      type="error"
      showIcon
      title={read.error}
      action={
        <Button onClick={() => void read.reload().catch(() => {})}>
          重试读取
        </Button>
      }
    />
  ) : read.loading ? (
    <div className="mp-loading">
      <Spin />
    </div>
  ) : null;
}
