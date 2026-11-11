import type { ReactNode } from "react";
import { Button, Spin } from "antd";

export const OptionsStatus = ({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  children: ReactNode;
}) => {
  if (!loading && !error) return children;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {children}
      {loading ? <Spin size="small" aria-label="加载选项" /> : null}
      {error ? (
        <Button type="link" size="small" className="shrink-0" onClick={onRetry}>
          选项加载失败，重试
        </Button>
      ) : null}
    </div>
  );
};
