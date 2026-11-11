import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined, LogoutOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { getLoginUserInfo, logout } from "@/api/login";
import type { CurrentUserInfo } from "@/types/login";
import type { ModuleMenuMeta } from "@/utils/favoriteModules";
import { sidebarThemeVars } from "@/utils/sidebarTheme";
import { clearSessionId, getSessionId } from "comm/session";
import { getLocationPath } from "comm/moduleContext";
import "./index.scss";

interface AppNavbarProps {
  moduleIndex: Map<number, ModuleMenuMeta>;
  themeColor: string;
}

const NavbarField: React.FC<{ name?: string; code?: string }> = ({
  name,
  code,
}) => {
  if (!name && !code) return null;

  return (
    <span className="app-navbar__field">
      {name ? <span className="app-navbar__name">{name}</span> : null}
      {code ? <span className="app-navbar__code">{code}</span> : null}
    </span>
  );
};

const NavbarDivider: React.FC = () => (
  <span className="app-navbar__divider" aria-hidden />
);

const APP_TITLE = "智慧医院信息系统";

const AppNavbar: React.FC<AppNavbarProps> = ({ moduleIndex, themeColor }) => {
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<CurrentUserInfo>();
  const [loggingOut, setLoggingOut] = useState(false);

  const navbarStyle = useMemo(
    () => ({
      ...sidebarThemeVars(themeColor),
      background: themeColor,
    }),
    [themeColor],
  );

  useEffect(() => {
    const token = getSessionId();
    if (!token) return;
    let cancelled = false;
    getLoginUserInfo()
      .then((res) => {
        if (!cancelled && getSessionId() === token) setUserInfo(res?.userInfo);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = userInfo?.nickname || userInfo?.username;

  useEffect(() => {
    document.title = displayName ? `${APP_TITLE} - ${displayName}` : APP_TITLE;
  }, [displayName]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout().catch(() => undefined);
    } finally {
      clearSessionId();
      window.location.replace("/login");
    }
  }, [loggingOut]);

  const userMenuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "version",
        label: `版本 ${__APP_VERSION__}`,
        disabled: true,
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: loggingOut ? "退出中..." : "退出登录",
        disabled: loggingOut,
        onClick: () => {
          void handleLogout();
        },
      },
    ],
    [handleLogout, loggingOut],
  );

  const currentModuleLabel = useMemo(() => {
    if (location.pathname === "/") return "首页";

    const activePath = getLocationPath(location);
    for (const meta of moduleIndex.values()) {
      if (meta.path === activePath) return meta.label;
    }

    return undefined;
  }, [location, moduleIndex]);

  return (
    <header className="app-navbar" style={navbarStyle}>
      <div className="app-navbar__inner">
        <div className="app-navbar__left">
          {currentModuleLabel ? (
            <span className="app-navbar__module">{currentModuleLabel}</span>
          ) : null}
        </div>

        <div id="app-navbar-slot" className="app-navbar__slot" />

        {displayName ? (
          <div className="app-navbar__right">
            {userInfo?.deptName ? (
              <>
                <NavbarField name={userInfo.deptName} />
                <NavbarDivider />
              </>
            ) : null}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
              disabled={loggingOut}
            >
              <button
                type="button"
                className="app-navbar__user-trigger"
                aria-busy={loggingOut}
              >
                <NavbarField name={displayName} code={userInfo?.roleName} />
                <DownOutlined className="app-navbar__dept-arrow" />
              </button>
            </Dropdown>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default AppNavbar;
