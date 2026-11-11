import React from "react";
import { Button, Result } from "antd";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

export interface NotFoundProps {
  /** 自定义展示的来源路径，默认从 location.state.from 读取 */
  from?: string;
  /** 返回首页路径，默认 "/" */
  homePath?: string;
}

export const NotFound: React.FC<NotFoundProps> = ({
  from,
  homePath = "/",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const sourcePath =
    from ?? (location.state as { from?: string } | null)?.from;

  const subTitle =
    sourcePath && sourcePath !== "/404"
      ? `您访问的路径「${sourcePath}」不存在`
      : "您访问的页面不存在";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 320,
        height: "100%",
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle={subTitle}
        extra={
          <Button type="primary" onClick={() => navigate(homePath)}>
            返回首页
          </Button>
        }
      />
    </div>
  );
};

/** 携带当前路径跳转到全局 /404 */
export const NotFoundRedirect: React.FC = () => {
  const location = useLocation();
  return (
    <Navigate to="/404" replace state={{ from: location.pathname }} />
  );
};
