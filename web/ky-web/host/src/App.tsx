import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { App as AntdApp, Button, Spin } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
import { setMessageApi } from "comm/request";
import { getSessionId, onSessionIdChange } from "comm/session";
import { AppThemeProvider, AppThemeRoot } from "comm/theme";
import { fetchRemoteApps, type RemoteAppConfig } from "@/config/remoteApps";
import { buildRemoteConfigs } from "@/config/remotes";
import AppRouter from "@/router";
import UpdateNotice from "@/components/UpdateNotice";
import { eventBus } from "@/utils/eventBus";
import { DEFAULT_THEME_COLOR } from "@/utils/sidebarTheme";

const MessageApiSetter: React.FC = () => {
  const { message } = AntdApp.useApp();
  useEffect(() => {
    setMessageApi(message);
  }, [message]);
  return null;
};

/** 仅在登录态变化时全屏引导；角色权限变更后静默刷新菜单 */
interface AppBootstrapProps {
  themeColor: string;
}

const applyRemoteApps = (apps: RemoteAppConfig[]) => {
  buildRemoteConfigs(apps);
  return apps;
};

const REMOTE_APPS_REFRESH_NOTICE = "system-role-menu-refresh";

const AppBootstrap: React.FC<AppBootstrapProps> = ({ themeColor }) => {
  const location = useLocation();
  const { notification } = AntdApp.useApp();
  const isLoginPage = location.pathname === "/login";
  const [sessionId, setSessionIdState] = useState(getSessionId);
  const [sessionRevision, setSessionRevision] = useState(0);
  const [remoteApps, setRemoteApps] = useState<RemoteAppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const requestVersionRef = useRef(0);
  const activeBootstrapRef = useRef(false);
  const contextRef = useRef({ sessionId, isLoginPage });
  contextRef.current = { sessionId, isLoginPage };

  // All loads share one version, including login, session changes and role writes.
  const refreshRemoteApps = useCallback(
    async (requestSessionId: string, showLoading = false): Promise<void> => {
      const context = contextRef.current;
      if (
        context.isLoginPage ||
        context.sessionId !== requestSessionId ||
        getSessionId() !== requestSessionId
      ) {
        return;
      }

      const version = ++requestVersionRef.current;
      const isCurrentRequest = () =>
        requestVersionRef.current === version &&
        !contextRef.current.isLoginPage &&
        contextRef.current.sessionId === requestSessionId &&
        getSessionId() === requestSessionId;

      notification.destroy(REMOTE_APPS_REFRESH_NOTICE);
      if (showLoading) setLoading(true);

      try {
        const apps = await fetchRemoteApps();
        if (isCurrentRequest()) setRemoteApps(applyRemoteApps(apps));
      } catch {
        if (!isCurrentRequest()) return;
        notification.error({
          key: REMOTE_APPS_REFRESH_NOTICE,
          title: "菜单与访问权限刷新失败",
          description: "已保留当前菜单，请重试刷新。",
          duration: 0,
          actions: (
            <Button
              size="small"
              onClick={() => void refreshRemoteApps(requestSessionId)}
            >
              重试刷新
            </Button>
          ),
        });
      } finally {
        if (isCurrentRequest()) setLoading(false);
      }
    },
    [notification],
  );

  useEffect(
    () =>
      onSessionIdChange((payload) => {
        // Invalidate immediately, before React commits a session change.
        requestVersionRef.current += 1;
        notification.destroy(REMOTE_APPS_REFRESH_NOTICE);
        setSessionIdState(payload.sessionId);
        setSessionRevision((revision) => revision + 1);
      }),
    [notification],
  );

  useEffect(() => {
    if (isLoginPage || !sessionId) {
      activeBootstrapRef.current = false;
      requestVersionRef.current += 1;
      notification.destroy(REMOTE_APPS_REFRESH_NOTICE);
      setRemoteApps([]);
      buildRemoteConfigs([]);
      setLoading(false);
      return;
    }

    const showLoading = !activeBootstrapRef.current;
    activeBootstrapRef.current = true;
    void refreshRemoteApps(sessionId, showLoading);

    return () => {
      requestVersionRef.current += 1;
      notification.destroy(REMOTE_APPS_REFRESH_NOTICE);
    };
  }, [
    isLoginPage,
    sessionId,
    sessionRevision,
    notification,
    refreshRemoteApps,
  ]);

  useEffect(
    () =>
      eventBus.on("system:roles-changed", (payload) => {
        if (typeof payload !== "object" || payload === null) return;
        const eventSessionId = (payload as { sessionId?: unknown }).sessionId;
        if (
          typeof eventSessionId !== "string" ||
          eventSessionId !== getSessionId() ||
          eventSessionId !== contextRef.current.sessionId ||
          contextRef.current.isLoginPage
        ) {
          return;
        }
        // Keep the current remote mounted while its menus and access refresh.
        void refreshRemoteApps(eventSessionId);
      }),
    [refreshRemoteApps],
  );

  return (
    <>
      {loading ? (
        <div className="flex h-screen items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <AppRouter remoteApps={remoteApps} themeColor={themeColor} />
      )}
    </>
  );
};

const App: React.FC = () => {
  const themeColor = DEFAULT_THEME_COLOR;

  return (
    <AppThemeProvider
      locale={zhCN}
      button={{ autoInsertSpace: false }}
      primaryColor={themeColor}
    >
      <AntdApp>
        <AppThemeRoot>
          <MessageApiSetter />
          <UpdateNotice />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppBootstrap themeColor={themeColor} />
          </BrowserRouter>
        </AppThemeRoot>
      </AntdApp>
    </AppThemeProvider>
  );
};

export default App;
