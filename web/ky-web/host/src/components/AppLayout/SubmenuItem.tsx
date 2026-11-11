import React from "react";
import { renderMenuIcon } from "@/utils/renderMenuIcon";

export interface SubmenuItemData {
  moduleId: number;
  path: string;
  label: string;
  icon: string;
}

interface SubmenuItemProps {
  item: SubmenuItemData;
  active: boolean;
  onClick: (moduleId: number, path: string) => void;
}

const SubmenuItem: React.FC<SubmenuItemProps> = ({ item, active, onClick }) => {
  const className = `app-layout__submenu-item${
    active ? " app-layout__submenu-item--active" : ""
  }`;

  return (
    <button
      type="button"
      className={className}
      onClick={() => onClick(item.moduleId, item.path)}
    >
      <span className="app-layout__submenu-icon">
        {renderMenuIcon(item.icon)}
      </span>
      <span className="app-layout__submenu-label">{item.label}</span>
    </button>
  );
};

export default React.memo(SubmenuItem);
