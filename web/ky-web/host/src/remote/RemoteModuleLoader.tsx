import React, { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Button, Result, Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

interface RemoteModuleLoaderProps {
  children: React.ReactNode;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  resetKey: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RemoteModuleErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  private isChunkLoadError(error: Error | null): boolean {
    if (!error) return false;
    const msg = error.message.toLowerCase();
    return (
      msg.includes("loading chunk") ||
      msg.includes("failed to fetch") ||
      msg.includes("load failed") ||
      msg.includes("dynamically imported module") ||
      msg.includes("importing a module script failed") ||
      msg.includes("runtime-008") ||
      error.name === "ChunkLoadError"
    );
  }

  render() {
    if (this.state.hasError) {
      const isLoadError = this.isChunkLoadError(this.state.error);

      return (
        <Result
          status={isLoadError ? "warning" : "error"}
          title={isLoadError ? "子应用加载失败" : "子应用运行异常"}
          subTitle={
            isLoadError
              ? "系统可能已更新或网络异常，请刷新页面后重试"
              : "子应用渲染时发生错误，请稍后重试"
          }
          extra={
            isLoadError ? (
              <Button type="primary" onClick={() => window.location.reload()}>
                刷新页面
              </Button>
            ) : null
          }
        />
      );
    }

    return this.props.children;
  }
}

const RemoteModuleLoader: React.FC<RemoteModuleLoaderProps> = ({
  children,
}) => {
  const location = useLocation();

  return (
    <RemoteModuleErrorBoundary resetKey={location.pathname}>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} />} />
            <Typography.Paragraph className="mt-4">
              正在加载子应用...
            </Typography.Paragraph>
          </div>
        }
      >
        {children}
      </Suspense>
    </RemoteModuleErrorBoundary>
  );
};

export default RemoteModuleLoader;
