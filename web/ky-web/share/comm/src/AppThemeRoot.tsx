import React, { useEffect, useLayoutEffect } from "react";
import { theme } from "antd";
import { appThemeVars } from "./themeVars";
import { useAppTheme } from "./AppThemeProvider";

const useRootEffect =
  typeof document === "undefined" ? useEffect : useLayoutEffect;

/** 将 appThemeVars 同步到 documentElement，供全局 CSS / SCSS 使用 */
export const AppThemeRoot: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { token } = theme.useToken();
  const { resolvedMode } = useAppTheme();

  useRootEffect(() => {
    const vars = appThemeVars(token);
    const root = document.documentElement;
    const previous = Object.keys(vars).map((key) => [
      key,
      root.style.getPropertyValue(key),
    ]);
    const previousMode = root.getAttribute("data-theme");
    const previousScheme = root.style.colorScheme;

    for (const [key, value] of Object.entries(vars)) {
      if (value != null) {
        root.style.setProperty(key, String(value));
      }
    }
    root.setAttribute("data-theme", resolvedMode);
    root.style.colorScheme = resolvedMode;
    return () => {
      for (const [key, value] of previous) {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      }
      if (previousMode === null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", previousMode);
      root.style.colorScheme = previousScheme;
    };
  }, [token, resolvedMode]);

  return <>{children}</>;
};
