import {
  AppThemeModeProvider,
  useAppTheme,
  useAppThemeStyle,
} from "comm/theme";
import { useDataThemeStyle } from "../../../theme";
import {
  createContext,
  useContext,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ConfigProvider,
  Modal,
  theme,
  type ModalProps,
  type ThemeConfig,
} from "antd";

export type PreviewAppearance = "default" | "dashboard";

/** Surfaces drawn over a fixed dark image, including dynamic personal cards. */
export const previewContrast = {
  text: "#fff",
  muted: "rgba(255,255,255,0.8)",
  panel: "rgba(0,0,0,0.5)",
  tag: "rgba(0,0,0,0.35)",
  border: "rgba(255,255,255,0.2)",
  divider: "rgba(255,255,255,0.1)",
  strongDivider: "rgba(255,255,255,0.3)",
  glass: "rgba(255,255,255,0.1)",
  skeleton: {
    gradientFromColor: "rgba(255,255,255,0.12)",
    gradientToColor: "rgba(255,255,255,0.24)",
  },
};

export const previewChartPalette = [
  "#00bcd4",
  "#ff9800",
  "#4caf50",
  "#f44336",
  "#9c27b0",
  "#3f51b5",
  "#2196f3",
  "#ff5722",
];

interface ThemeScope {
  appearance: PreviewAppearance;
  hostTheme?: ThemeConfig;
  hostMode: "light" | "dark";
}
const Scope = createContext<ThemeScope | undefined>(undefined);

const dashboardTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: { colorBgBase: "#000", colorTextBase: "#fff" },
  components: {
    Table: {
      colorBgContainer: previewContrast.panel,
      headerBg: "transparent",
      headerColor: previewContrast.text,
      borderColor: previewContrast.divider,
      headerSplitColor: previewContrast.border,
    },
    Skeleton: previewContrast.skeleton,
  },
};

/** Capture the host before applying the canvas theme; nested scopes retain it. */
export function PreviewThemeProvider({
  appearance = "default",
  children,
}: {
  appearance?: PreviewAppearance;
  children: ReactNode;
}) {
  const inherited = useContext(ConfigProvider.ConfigContext).theme;
  const parent = useContext(Scope);
  const { resolvedMode } = useAppTheme();
  const hostTheme = parent ? parent.hostTheme : inherited;
  const hostMode = parent?.hostMode ?? resolvedMode;
  const scope = useMemo(
    () => ({ appearance, hostTheme, hostMode }),
    [appearance, hostTheme, hostMode],
  );
  const localTheme = useMemo<ThemeConfig>(
    () => ({
      ...(appearance === "dashboard" ? dashboardTheme : {}),
      token: {
        ...(appearance === "dashboard" ? dashboardTheme.token : {}),
        colorLink:
          hostTheme?.token?.colorPrimary ?? theme.defaultSeed.colorPrimary,
      },
    }),
    [appearance, hostTheme?.token?.colorPrimary],
  );
  return (
    <Scope.Provider value={scope}>
      <AppThemeModeProvider
        mode={appearance === "dashboard" ? "dark" : resolvedMode}
      >
        <ConfigProvider theme={localTheme}>{children}</ConfigProvider>
      </AppThemeModeProvider>
    </Scope.Provider>
  );
}

export function previewStyle(
  token: ReturnType<typeof theme.useToken>["token"],
  appearance: PreviewAppearance = "default",
): CSSProperties {
  return {
    "--mp-bg":
      appearance === "dashboard" ? "transparent" : token.colorBgContainer,
    "--mp-query": token.colorBgContainer,
    "--mp-my-toolbar":
      appearance === "dashboard" ? previewContrast.panel : token.colorFillAlter,
    "--mp-toolbar":
      appearance === "dashboard"
        ? previewContrast.panel
        : token.colorFillSecondary,
    "--mp-text":
      appearance === "dashboard" ? previewContrast.text : token.colorText,
    "--mp-muted":
      appearance === "dashboard"
        ? previewContrast.muted
        : token.colorTextSecondary,
    "--mp-border":
      appearance === "dashboard"
        ? previewContrast.border
        : token.colorBorderSecondary,
    "--mp-value":
      appearance === "dashboard"
        ? previewContrast.text
        : token.colorPrimaryText,
    "--mp-primary": token.colorPrimary,
    "--mp-primary-hover": token.colorPrimaryHover,
    "--mp-on-primary": token.colorTextLightSolid,
    "--mp-link": token.colorPrimaryText,
    "--mp-link-hover": token.colorPrimaryTextHover,
    "--mp-selected": token.controlItemBgActive,
    "--mp-warning-border": token.colorWarningBorder,
    "--mp-warning-bg":
      appearance === "dashboard" ? "transparent" : token.colorWarningBg,
    "--mp-warning-text":
      appearance === "dashboard" ? previewContrast.text : token.colorText,
    "--mp-contrast-text": previewContrast.text,
    "--mp-contrast-muted": previewContrast.muted,
    "--mp-contrast-panel": previewContrast.panel,
    "--mp-contrast-tag": previewContrast.tag,
    "--mp-contrast-border": previewContrast.border,
    "--mp-contrast-divider": previewContrast.divider,
    "--mp-contrast-strong-divider": previewContrast.strongDivider,
    "--mp-glass": previewContrast.glass,
    "--mp-positive": "#dc3545",
    "--mp-negative": "#198754",
    "--mp-neutral": "#0dcaf0",
    "--mp-star": "#ffa940",
    "--mp-goal-met": "#52c41a",
    "--mp-goal-missed": "#ff4d4f",
  } as CSSProperties;
}

/** Presentation scope is independent of the query/favorites business context. */
export function usePreviewTheme() {
  const scope = useContext(Scope);
  const { token } = theme.useToken();
  const appearance = scope?.appearance ?? "default";
  return useMemo(
    () => ({
      appearance,
      token,
      style: previewStyle(token, appearance),
      chart: {
        text:
          appearance === "dashboard" ? previewContrast.text : token.colorText,
        axis: token.colorBorder,
        grid: token.colorBorderSecondary,
        background: token.colorBgContainer,
        tooltipBackground: token.colorBgElevated,
        palette: appearance === "dashboard" ? previewChartPalette : undefined,
      },
    }),
    [token, appearance],
  );
}

export function usePreviewStyle(appearance?: PreviewAppearance) {
  const current = usePreviewTheme();
  return appearance === undefined || appearance === current.appearance
    ? current.style
    : previewStyle(current.token, appearance);
}

/** Restore the original host theme even when this modal opens inside another modal. */
export function PreviewModal(props: ModalProps) {
  const parent = useContext(Scope);
  const inherited = useContext(ConfigProvider.ConfigContext).theme;
  const { resolvedMode } = useAppTheme();
  const hostTheme = parent ? parent.hostTheme : inherited;
  const hostMode = parent?.hostMode ?? resolvedMode;
  const restored = useMemo<ThemeConfig>(
    () => ({
      ...hostTheme,
      inherit: false,
      token: {
        ...hostTheme?.token,
        colorLink:
          hostTheme?.token?.colorPrimary ?? theme.defaultSeed.colorPrimary,
      },
    }),
    [hostTheme],
  );
  const scope = useMemo<ThemeScope>(
    () => ({ appearance: "default", hostTheme, hostMode }),
    [hostTheme, hostMode],
  );
  return (
    <ConfigProvider theme={restored}>
      <AppThemeModeProvider mode={hostMode}>
        <Scope.Provider value={scope}>
          <ThemedModal {...props} />
        </Scope.Provider>
      </AppThemeModeProvider>
    </ConfigProvider>
  );
}

function ThemedModal({ style, className, ...props }: ModalProps) {
  const surface = usePreviewStyle();
  const appStyle = useAppThemeStyle();
  const dataStyle = useDataThemeStyle();
  return (
    <Modal
      {...props}
      className={`mp-modal ${className ?? ""}`}
      style={{ ...style, ...appStyle, ...dataStyle, ...surface }}
    />
  );
}
