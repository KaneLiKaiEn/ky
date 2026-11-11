import { useMemo, type CSSProperties, type HTMLAttributes } from "react";
import { theme, type ThemeConfig } from "antd";
import type { GlobalToken } from "antd/es/theme/interface";
import { appThemeVars } from "comm/theme";

/** Shared sizing for metric, board and report management surfaces. */
export const managementTheme: ThemeConfig = {
  token: {
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,
    fontSizeHeading1: 20,
    fontSizeHeading2: 20,
    fontSizeHeading3: 16,
    borderRadius: 8,
    borderRadiusSM: 6,
    borderRadiusLG: 12,
  },
};

/** Existing business namespaces share one mapping from the current AntD scope. */
export function dataThemeVars(token: GlobalToken): CSSProperties {
  return {
    ...appThemeVars(token),
    "--mw-surface": token.colorBgContainer,
    "--mw-border": token.colorBorderSecondary,
    "--mw-muted": token.colorTextSecondary,
    "--mw-text": token.colorText,
    "--mw-primary": token.colorPrimary,
    "--mw-primary-bg": token.colorPrimaryBg,
    "--mw-fill": token.colorFillAlter,
    "--mw-layout": token.colorBgLayout,
    "--mw-warning": token.colorWarning,
    "--mw-error": token.colorError,
    "--mw-success": token.colorSuccess,
    "--mw-font-12": `${token.fontSizeSM}px`,
    "--mw-font-14": `${token.fontSize}px`,
    "--mw-font-16": `${token.fontSizeLG}px`,
    "--mw-font-20": `${token.fontSizeHeading1}px`,
    "--mw-radius-6": `${token.borderRadiusSM}px`,
    "--mw-radius-8": `${token.borderRadius}px`,
    "--mw-radius-12": `${token.borderRadiusLG}px`,
    "--bw-surface": token.colorBgContainer,
    "--bw-layout": token.colorBgLayout,
    "--bw-border": token.colorBorderSecondary,
    "--bw-text": token.colorText,
    "--bw-muted": token.colorTextSecondary,
    "--bw-primary": token.colorPrimary,
    "--bw-primary-bg": token.colorPrimaryBg,
    "--bw-error": token.colorError,
    "--bw-font": `${token.fontSize}px`,
    "--bw-font-sm": `${token.fontSizeSM}px`,
    "--bw-heading-1": `${token.fontSizeHeading1}px`,
    "--bw-heading-2": `${token.fontSizeHeading2}px`,
    "--bw-heading-3": `${token.fontSizeHeading3}px`,
    "--bw-radius": `${token.borderRadius}px`,
    "--bw-radius-sm": `${token.borderRadiusSM}px`,
    "--bw-radius-lg": `${token.borderRadiusLG}px`,
    "--rp-layout": token.colorBgLayout,
    "--rp-text": token.colorText,
    "--rp-bg": token.colorBgContainer,
    "--rp-surface": token.colorBgContainer,
    "--rp-fill": token.colorFillAlter,
    "--rp-border": token.colorBorderSecondary,
    "--rp-muted": token.colorTextSecondary,
    "--rp-primary": token.colorPrimary,
    "--rp-hover": token.colorFillAlter,
    "--rw-bg": token.colorBgLayout,
    "--rw-surface": token.colorBgContainer,
    "--rw-border": token.colorBorderSecondary,
    "--rw-text": token.colorText,
    "--rw-muted": token.colorTextSecondary,
    "--rw-selected": token.controlItemBgActive,
    "--rw-primary": token.colorPrimary,
  } as CSSProperties;
}

export function useDataThemeStyle(): CSSProperties {
  const { token } = theme.useToken();
  return useMemo(() => dataThemeVars(token), [token]);
}

/** Use again at a portal boundary: React context crosses portals, CSS does not. */
export function DataThemeScope({
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const variables = useDataThemeStyle();
  return <div {...props} style={{ ...style, ...variables }} />;
}
