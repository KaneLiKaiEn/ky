import React from "react";
import { renderMenuIcon } from "@/utils/renderMenuIcon";
import IconButton from "./IconButton";
import type { FavoriteMenuItem } from "@/utils/favoriteModules";

export type RailKey = "home" | "menu" | "favorites" | "messages" | "ai";

export interface RailItem {
  key: RailKey;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

interface SideRailProps {
  topItems: RailItem[];
  bottomItems: RailItem[];
  favorites: FavoriteMenuItem[];
  activePath: string;
  highlightedKeys: ReadonlySet<RailKey>;
  isPortrait: boolean;
  onRailClick: (key: RailKey) => void;
  onFavoriteClick: (moduleId: number, path: string) => void;
  style?: React.CSSProperties;
  railRef?: React.Ref<HTMLDivElement>;
}

const SideRail: React.FC<SideRailProps> = ({
  topItems,
  bottomItems,
  favorites,
  activePath,
  highlightedKeys,
  isPortrait,
  onRailClick,
  onFavoriteClick,
  style,
  railRef,
}) => {
  const renderRailButton = (item: RailItem) => (
    <IconButton
      key={item.key}
      variant="rail"
      title={item.label}
      active={highlightedKeys.has(item.key)}
      onClick={item.disabled ? undefined : () => onRailClick(item.key)}
    >
      {item.icon}
    </IconButton>
  );

  return (
    <div
      ref={railRef}
      className={`app-layout__rail${isPortrait ? " app-layout__rail--portrait" : ""}`}
      style={style}
    >
      <div className="app-layout__rail-group">
        {topItems.map((item) => {
          if (item.key !== "favorites") {
            return renderRailButton(item);
          }

          return (
            <React.Fragment key={item.key}>
              {renderRailButton(item)}
              {favorites.length > 0 && (
                <>
                  <div className="app-layout__rail-divider" aria-hidden />
                  <div className="app-layout__favorite-shortcuts">
                    {favorites.map((fav) => (
                      <IconButton
                        key={fav.moduleId}
                        variant="favorite"
                        title={fav.label}
                        active={activePath === fav.path}
                        onClick={() => onFavoriteClick(fav.moduleId, fav.path)}
                      >
                        {renderMenuIcon(fav.icon)}
                      </IconButton>
                    ))}
                  </div>
                  <div className="app-layout__rail-divider" aria-hidden />
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="app-layout__rail-group app-layout__rail-group--end">
        {bottomItems.map(renderRailButton)}
      </div>
    </div>
  );
};

export default React.memo(SideRail);
