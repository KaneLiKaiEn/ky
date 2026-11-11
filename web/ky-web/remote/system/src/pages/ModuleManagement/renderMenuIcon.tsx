import React from "react";

const DEFAULT_ICON = "grid";
const ICON_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const renderMenuIcon = (iconName: string): React.ReactNode => {
  const name =
    iconName && ICON_NAME_RE.test(iconName) ? iconName : DEFAULT_ICON;
  return <i className={`bi bi-${name} app-menu-icon`} aria-hidden />;
};
