import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Input } from "antd";
import SubmenuItem, { type SubmenuItemData } from "./SubmenuItem";
import type { ActiveMenuItem } from "@/utils/favoriteModules";
import { matchByPinyin } from "@/utils/moduleSearch";
import { renderMenuIcon } from "@/utils/renderMenuIcon";


export interface SubmenuGroup {
  name: string;
  appName: string;
  menuItems: SubmenuItemData[];
}

interface SubmenuPanelProps {
  isPortrait: boolean;
  activePath: string;
  activeItems: ActiveMenuItem[];
  /** 是否展示「常用模块」分组 */
  showPinned?: boolean;
  groups: SubmenuGroup[];
  initialScrollTop: number;
  onScrollTopChange: (scrollTop: number) => void;
  onItemClick: (moduleId: number, path: string) => void;
  style?: React.CSSProperties;
}

const SubmenuPanel = forwardRef<HTMLDivElement, SubmenuPanelProps>(
  (
    {
      isPortrait,
      activePath,
      activeItems,
      showPinned = true,
      groups,
      initialScrollTop,
      onScrollTopChange,
      onItemClick,
      style,
    },
    ref,
  ) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const initialScrollTopRef = useRef(initialScrollTop);
    const [keyword, setKeyword] = useState("");
    const trimmedKeyword = keyword.trim();
    const isSearching = trimmedKeyword.length > 0;

    useImperativeHandle(ref, () => panelRef.current!, []);

    useLayoutEffect(() => {
      const panel = panelRef.current;
      if (!panel) return;

      panel.scrollTop = initialScrollTopRef.current;
      onScrollTopChange(panel.scrollTop);

      return () => {
        onScrollTopChange(panel.scrollTop);
      };
    }, [onScrollTopChange]);

    const filteredGroups = useMemo(() => {
      if (!isSearching) return groups;
      return groups
        .map((group) => ({
          ...group,
          menuItems: group.menuItems.filter((item) =>
            matchByPinyin(item.label, trimmedKeyword),
          ),
        }))
        .filter((group) => group.menuItems.length > 0);
    }, [groups, isSearching, trimmedKeyword]);

    const hasResults = isSearching
      ? filteredGroups.length > 0
      : (showPinned && activeItems.length > 0) || groups.length > 0;

    return (
      <div
        ref={panelRef}
        className={`app-layout__submenu${isPortrait ? " app-layout__submenu--portrait" : ""}`}
        style={style}
        onScroll={(event) => onScrollTopChange(event.currentTarget.scrollTop)}
      >
        <div className="app-layout__submenu-search">
          <Input
            placeholder="搜索模块"
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            prefix={renderMenuIcon("search")}
          />
        </div>

        {isSearching && !hasResults ? (
          <p className="app-layout__submenu-empty">无匹配模块</p>
        ) : (
          <>
            {!isSearching && showPinned && (
              <section className="app-layout__submenu-group app-layout__submenu-group--pinned">
                <h4 className="app-layout__submenu-group-title">常用模块</h4>
                {activeItems.length > 0 ? (
                  <div className="app-layout__submenu-grid">
                    {activeItems.map((item) => (
                      <SubmenuItem
                        key={item.moduleId}
                        item={item}
                        active={activePath === item.path}
                        onClick={onItemClick}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="app-layout__submenu-empty">暂无常用模块！</p>
                )}
              </section>
            )}
            {filteredGroups.map((group) => (
              <section key={group.name} className="app-layout__submenu-group">
                <h4 className="app-layout__submenu-group-title">
                  {group.appName}
                </h4>
                <div className="app-layout__submenu-grid">
                  {group.menuItems.map((item) => (
                    <SubmenuItem
                      key={item.moduleId}
                      item={item}
                      active={activePath === item.path}
                      onClick={onItemClick}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    );
  },
);

SubmenuPanel.displayName = "SubmenuPanel";

export default React.memo(SubmenuPanel);
