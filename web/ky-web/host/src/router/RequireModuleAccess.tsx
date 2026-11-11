import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { NotFoundRedirect } from "comm/theme";
import type { RemoteAppConfig } from "@/config/remoteApps";
import {
  buildModuleAccessIndex,
  isModuleAccessAllowed,
} from "@/utils/moduleAccess";

interface RequireModuleAccessProps {
  remoteApps: RemoteAppConfig[];
  children: React.ReactElement;
}

/** 校验当前路由是否在 GetMyModuleList 返回的模块白名单内 */
const RequireModuleAccess: React.FC<RequireModuleAccessProps> = ({
  remoteApps,
  children,
}) => {
  const location = useLocation();
  const accessIndex = useMemo(
    () => buildModuleAccessIndex(remoteApps),
    [remoteApps],
  );

  const allowed = isModuleAccessAllowed(
    location.pathname,
    location.search,
    accessIndex,
  );

  if (!allowed) {
    return <NotFoundRedirect />;
  }

  return children;
};

export default RequireModuleAccess;
