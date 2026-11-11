import type { CSSProperties } from "react";
import { DEFAULT_PRIMARY_COLOR } from "comm/theme";

/** 侧栏/顶栏 theme_color 未配置时的默认背景色 */
export const DEFAULT_THEME_COLOR = DEFAULT_PRIMARY_COLOR;

/** 将后端主题配置规范化为 Ant Design 可用的纯色 */
export const normalizeThemeColor = (value?: string | null): string => {
  const color = value?.trim();

  if (
    !color ||
    /gradient/i.test(color) ||
    /^var\(/i.test(color) ||
    /^currentcolor$/i.test(color) ||
    typeof CSS === "undefined" ||
    !CSS.supports("color", color)
  ) {
    return DEFAULT_THEME_COLOR;
  }

  return color;
};

/**
 * 侧边栏交互态 CSS 变量（图标、悬停、选中等），图标统一使用白色。
 * bgColor 应为经过 normalizeThemeColor 规范化的纯色。
 */
export const sidebarThemeVars = (bgColor: string): CSSProperties => {
  const color = bgColor.trim() || DEFAULT_THEME_COLOR;

  return {
    "--app-theme-text": "rgba(255, 255, 255, 0.95)",
    "--app-theme-text-secondary": "rgba(255, 255, 255, 0.75)",
    "--app-theme-border": "rgba(255, 255, 255, 0.15)",
    "--app-theme-primary": "#ffffff",
    "--app-theme-primary-bg": "rgba(255, 255, 255, 0.15)",
    "--app-theme-bg-fill-alter": "rgba(255, 255, 255, 0.15)",
    "--app-theme-active-bg": "rgba(255, 255, 255, 0.6)",
    "--app-theme-active-color": color,
  } as CSSProperties;
};
