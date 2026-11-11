import React, { useEffect } from "react";
import { App as AntdApp, Button } from "antd";
import { hasNewVersion } from "@/utils/versionCheck";

const CHECK_INTERVAL = 60_000;

/** 轮询线上版本，发版后提示用户刷新；不强制刷新，避免丢失未保存的内容 */
const UpdateNotice: React.FC = () => {
  const { notification } = AntdApp.useApp();

  useEffect(() => {
    let notified = false;

    const check = async () => {
      if (notified || document.hidden) return;
      if (!(await hasNewVersion()) || notified) return;
      notified = true;
      notification.info({
        key: "app-update",
        title: "系统已更新",
        description: "刷新页面后即可使用新版本，请先保存正在编辑的内容。",
        duration: 0,
        placement: "bottomRight",
        actions: (
          <Button
            type="primary"
            size="small"
            onClick={() => window.location.reload()}
          >
            立即刷新
          </Button>
        ),
      });
    };

    const onVisibilityChange = () => {
      if (!document.hidden) void check();
    };

    const timer = window.setInterval(() => void check(), CHECK_INTERVAL);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [notification]);

  return null;
};

export default UpdateNotice;
