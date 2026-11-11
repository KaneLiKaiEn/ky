import React, { useMemo, useState, useRef, useCallback } from "react";
import { Layout, theme } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import type { RemoteAppConfig } from "@/config/remoteApps";
import type { ModuleMenuMeta } from "@/utils/favoriteModules";
import { useIsPortrait } from "@/hooks/useIsPortrait";
import { useClickOutside } from "@/hooks/useClickOutside";
import { renderMenuIcon } from "@/utils/renderMenuIcon";
import { appThemeVars } from "comm/theme";
import { getLocationPath } from "comm/moduleContext";
import { clearActiveId } from "comm/session";
import { sidebarThemeVars } from "@/utils/sidebarTheme";
import AppNavbar from "@/components/AppNavbar";
import SideRail, { type RailItem, type RailKey } from "./SideRail";
import SubmenuPanel, { type SubmenuGroup } from "./SubmenuPanel";
import "./index.scss";

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
  remoteApps: RemoteAppConfig[];
  themeColor: string;
}

const TOP_RAIL_ITEMS: RailItem[] = [
  { key: "home", icon: renderMenuIcon("house"), label: "首页" },
  { key: "menu", icon: renderMenuIcon("grid"), label: "菜单" },
];

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  remoteApps,
  themeColor,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPortrait = useIsPortrait();
  const { token } = theme.useToken();

  const [submenuOpen, setSubmenuOpen] = useState(false);
  const submenuRef = useRef<HTMLDivElement>(null);
  const submenuScrollTopRef = useRef(0);
  const railRef = useRef<HTMLDivElement>(null);

  const { submenuGroups, moduleIndex } = useMemo(() => {
    const index = new Map<number, ModuleMenuMeta>();
    const groups: SubmenuGroup[] = [];

    for (const app of remoteApps) {
      const items = app.menuItems ?? [];
      for (const item of items) {
        index.set(item.moduleId, {
          path: item.path,
          label: item.label,
          icon: item.icon,
        });
      }
      if (items.length > 0) {
        groups.push({
          name: app.name,
          appName: app.appName,
          menuItems: items.map((item) => ({
            moduleId: item.moduleId,
            path: item.path,
            label: item.label,
            icon: item.icon,
          })),
        });
      }
    }

    return { submenuGroups: groups, moduleIndex: index };
  }, [remoteApps]);

  const closeSubmenu = useCallback(() => setSubmenuOpen(false), []);

  const handleSubmenuScrollTopChange = useCallback((scrollTop: number) => {
    submenuScrollTopRef.current = scrollTop;
  }, []);

  useClickOutside(
    useMemo(() => [submenuRef, railRef], []),
    closeSubmenu,
    submenuOpen,
  );

  const activePath = getLocationPath(location);
  const isOnHome = location.pathname === "/";

  const highlightedKeys = useMemo<ReadonlySet<RailKey>>(() => {
    const set = new Set<RailKey>();
    if (isOnHome) set.add("home");
    if (submenuOpen) set.add("menu");
    return set;
  }, [isOnHome, submenuOpen]);

  const handleRailClick = useCallback(
    (key: RailKey) => {
      if (key === "home") {
        setSubmenuOpen(false);
        clearActiveId();
        navigate("/");
      } else if (key === "menu") {
        setSubmenuOpen((prev) => !prev);
      }
    },
    [navigate],
  );

  const handleSubmenuItemClick = useCallback(
    (_moduleId: number, path: string) => {
      clearActiveId();
      navigate(path);
      setSubmenuOpen(false);
    },
    [navigate],
  );

  const themeVars = useMemo(() => appThemeVars(token), [token]);

  const railStyle = useMemo<React.CSSProperties>(
    () => ({
      ...sidebarThemeVars(themeColor),
      background: themeColor,
    }),
    [themeColor],
  );

  const rail = (
    <SideRail
      topItems={TOP_RAIL_ITEMS}
      bottomItems={[]}
      favorites={[]}
      activePath={activePath}
      highlightedKeys={highlightedKeys}
      isPortrait={isPortrait}
      onRailClick={handleRailClick}
      onFavoriteClick={handleSubmenuItemClick}
      style={railStyle}
      railRef={railRef}
    />
  );

  return (
    <Layout
      className={`app-layout${isPortrait ? " app-layout--portrait" : ""}`}
      style={{
        overflow: "hidden",
        flexDirection: isPortrait ? "column" : "row",
      }}
    >
      {!isPortrait && rail}

      {submenuOpen && (
        <SubmenuPanel
          ref={submenuRef}
          isPortrait={isPortrait}
          activePath={activePath}
          activeItems={[]}
          showPinned={false}
          groups={submenuGroups}
          initialScrollTop={submenuScrollTopRef.current}
          onScrollTopChange={handleSubmenuScrollTopChange}
          onItemClick={handleSubmenuItemClick}
          style={themeVars}
        />
      )}

      <div className="app-layout__main min-h-0 min-w-0 flex flex-1 flex-col">
        <AppNavbar moduleIndex={moduleIndex} themeColor={themeColor} />

        <Content
          className="app-layout__content min-h-0 min-w-0 flex-1 overflow-y-auto"
          style={{ margin: 0 }}
        >
          <div className="app-layout__content-inner mx-auto w-full h-full">
            {children}
          </div>
        </Content>
      </div>

      {isPortrait && rail}
    </Layout>
  );
};

export default AppLayout;
