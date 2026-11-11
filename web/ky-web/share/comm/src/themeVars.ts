import type { CSSProperties } from "react";
import type { GlobalToken } from "antd/es/theme/interface";

/** 全应用统一的 CSS 主题变量（映射 Ant Design token） */
export const appThemeVars = (token: GlobalToken): CSSProperties => {
  return {
    "--app-theme-text": token.colorText,
    "--app-theme-text-secondary": token.colorTextSecondary,
    "--app-theme-text-tertiary": token.colorTextTertiary,
    "--app-theme-text-quaternary": token.colorTextQuaternary,
    "--app-theme-text-disabled": token.colorTextDisabled,
    "--app-theme-text-white": token.colorWhite, // 始终为 #FFFFFF，用于设置文字颜色为白色
    "--app-theme-text-info": "#0dcaf0", // 始终为 #0dcae7，用于设置文字颜色为浅蓝色
    "--app-theme-text-purple": "#c084fc", // 始终为 #6610f2，用于设置文字颜色为浅紫色
    // 绿色成功色
    "--app-theme-text-success": token.colorSuccess,
    "--app-theme-border": token.colorBorderSecondary,
    "--app-theme-primary": token.colorPrimary,
    "--app-theme-primary-bg": token.colorPrimaryBg,
    // 比 colorPrimaryBg 更深的颜色，用于 患者列表 选中的背景色
    "--app-theme-primary-bg-hover": token.colorPrimaryBgHover,
    "--app-theme-error": token.colorError,
    "--app-theme-error-bg": token.colorErrorBg,
    "--app-theme-success": token.colorSuccess,
    "--app-theme-success-bg": token.colorSuccessBg,
    "--app-theme-success-bg-hover": token.colorSuccessBgHover,
    "--app-theme-info": token.colorInfo,
    "--app-theme-info-bg": token.colorInfoBg,
    "--app-theme-warning": token.colorWarning,
    "--app-theme-warning-bg": token.colorWarningBg,
    /** 与 Tag color="purple" 浅色底一致，随明暗主题变化 */
    "--app-theme-purple-bg": token.purple1,
    "--app-theme-bg-container": token.colorBgContainer,
    "--app-theme-bg-elevated": token.colorBgElevated,
    "--app-theme-bg-fill-alter": token.colorFillAlter,
    "--app-theme-bg-layout": token.colorBgLayout,
    /** 与 antd Input :focus 描边一致，供非聚焦态模拟选中高亮 */
    "--app-theme-control-outline": token.controlOutline,
    "--app-theme-control-outline-width": `${token.controlOutlineWidth}px`,
    // 网站超小号字体大小，注意 px 单位
    "--app-theme-font-xs": "9px",
    // 网站小号字体大小
    "--app-theme-font-sm": "11px",
    // 网站中号字体大小
    "--app-theme-font-md": "12px",
    // 网站默认字体大小
    "--app-theme-font-default": "14px",
    // 网站大号字体大小
    "--app-theme-font-lg": "16px",
    // 网站超大号字体大小
    "--app-theme-font-xl": "18px",
    // 网站特大号字体大小
    "--app-theme-font-xxl": "20px",
  } as CSSProperties;
};
