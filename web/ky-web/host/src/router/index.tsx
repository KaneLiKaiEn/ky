import React, { useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { NotFound, NotFoundRedirect } from "comm/theme";
import AppLayout from "@/components/AppLayout";
import Home from "@/pages/Home";
import createRemotePage from "@/remote/createRemotePage";
import RemoteModuleLoader from "@/remote/RemoteModuleLoader";
import { loadRemoteModule } from "@/remote/loadRemoteModule";
import type { RemoteAppConfig } from "@/config/remoteApps";
import { getSessionId } from "comm/session";
import RequireModuleAccess from "./RequireModuleAccess";

const RemoteLogin = React.lazy(() => loadRemoteModule("login/Login"));

const Login: React.FC = () => (
  <RemoteModuleLoader>
    <RemoteLogin />
  </RemoteModuleLoader>
);

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const session_id = getSessionId();
  if (!session_id) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const remotePageCache = new Map<string, React.FC>();

interface AppRouterProps {
  remoteApps: RemoteAppConfig[];
  themeColor: string;
}

const AppRouter: React.FC<AppRouterProps> = ({ remoteApps, themeColor }) => {
  const getRemotePage = useCallback((app: RemoteAppConfig): React.FC => {
    const cached = remotePageCache.get(app.moduleId);
    if (cached) return cached;

    const Page = createRemotePage({
      remoteId: app.moduleId,
      displayName: `Remote_${app.name}`,
    });
    remotePageCache.set(app.moduleId, Page);
    return Page;
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppLayout remoteApps={remoteApps} themeColor={themeColor}>
              <Routes>
                <Route path="/" element={<Home />} />
                {remoteApps.map((app) => {
                  const Page = getRemotePage(app);
                  return (
                    <Route
                      key={app.name}
                      path={`${app.routePath}/*`}
                      element={
                        <RequireModuleAccess remoteApps={remoteApps}>
                          <Page />
                        </RequireModuleAccess>
                      }
                    />
                  );
                })}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFoundRedirect />} />
              </Routes>
            </AppLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
};

export default AppRouter;
