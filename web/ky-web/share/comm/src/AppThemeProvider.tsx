import {
  createContext,
  useContext,
  useMemo,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ConfigProvider, theme as antdTheme, type ThemeConfig } from "antd";
import type { ConfigProviderProps } from "antd/es/config-provider";
import { appThemeVars } from "./themeVars";
import { useSystemDarkMode } from "./usePrefersDarkMode";

export type ResolvedThemeMode = "light" | "dark";
export type AppThemeMode = "system" | ResolvedThemeMode;
export const DEFAULT_PRIMARY_COLOR = "#1677ff";

const ModeContext = createContext<ResolvedThemeMode | undefined>(undefined);

/** For adapters that already own an AntD ConfigProvider (including portal restoration). */
export function AppThemeModeProvider({
  mode,
  children,
}: {
  mode: ResolvedThemeMode;
  children?: ReactNode;
}) {
  return <ModeContext.Provider value={mode}>{children}</ModeContext.Provider>;
}

export function useAppTheme() {
  const inherited = useContext(ModeContext);
  const systemDark = useSystemDarkMode(inherited === undefined);
  // Legacy hosts only supported system mode. No color-string inference is used.
  const resolvedMode = inherited ?? (systemDark ? "dark" : "light");
  return useMemo(() => ({ resolvedMode }), [resolvedMode]);
}

export interface AppThemeProviderProps extends Omit<
  ConfigProviderProps,
  "theme"
> {
  mode?: AppThemeMode;
  primaryColor?: string;
  /** Set the algorithm through mode so the explicit mode and AntD cannot diverge. */
  theme?: Omit<ThemeConfig, "algorithm">;
}

/** Shared whole-application defaults. AppThemeRoot remains the explicit document writer. */
export function AppThemeProvider({
  mode = "system",
  primaryColor,
  theme,
  children,
  ...props
}: AppThemeProviderProps) {
  const systemDark = useSystemDarkMode(mode === "system");
  const resolvedMode =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;
  const config = useMemo<ThemeConfig>(
    () => ({
      ...theme,
      algorithm:
        resolvedMode === "dark"
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      token: {
        borderRadius: 6,
        ...theme?.token,
        colorPrimary:
          primaryColor ?? theme?.token?.colorPrimary ?? DEFAULT_PRIMARY_COLOR,
      },
    }),
    [theme, primaryColor, resolvedMode],
  );
  return (
    <AppThemeModeProvider mode={resolvedMode}>
      <ConfigProvider {...props} theme={config}>
        {children}
      </ConfigProvider>
    </AppThemeModeProvider>
  );
}

export function useAppThemeStyle() {
  const { token } = antdTheme.useToken();
  return useMemo(() => appThemeVars(token), [token]);
}

export interface AppThemeScopeProps extends HTMLAttributes<HTMLDivElement> {
  mode?: ResolvedThemeMode;
  theme?: Omit<ThemeConfig, "algorithm">;
}

function ScopeSurface({ style, ...props }: HTMLAttributes<HTMLDivElement>) {
  const variables = useAppThemeStyle();
  const { resolvedMode } = useAppTheme();
  return (
    <div
      {...props}
      data-theme={resolvedMode}
      style={{ ...style, ...variables, colorScheme: resolvedMode }}
    />
  );
}

/** A local DOM surface; it never changes document-level variables or popup placement. */
export function AppThemeScope({ mode, theme, ...props }: AppThemeScopeProps) {
  const { resolvedMode: inherited } = useAppTheme();
  const resolvedMode = mode ?? inherited;
  const config = useMemo<ThemeConfig>(
    () => ({
      ...theme,
      ...(mode
        ? {
            algorithm:
              mode === "dark"
                ? antdTheme.darkAlgorithm
                : antdTheme.defaultAlgorithm,
          }
        : {}),
    }),
    [mode, theme],
  );
  return (
    <AppThemeModeProvider mode={resolvedMode}>
      <ConfigProvider theme={config}>
        <ScopeSurface {...props} />
      </ConfigProvider>
    </AppThemeModeProvider>
  );
}
