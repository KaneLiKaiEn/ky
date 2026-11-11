import type { ComponentType } from "react";
import MyPatientWidget from "./MyPatientWidget";
import Test from "./Test";
import DeptPatientWidget from "./DeptPatientWidget";
import ToVerifyOrderList from "./ToVerifyOrderList";
import ToEndOrderList from "./ToEndOrderList";
import ToExecOrderList from "./ToExecOrderList";
import ToTerminateOrderList from "./ToTerminateOrderList";
import BedsideCard from "./BedsideCard";
import EmrToSignList from "./EmrToSignList";
import FavoriteVital from "./FavoriteVital";
import BillCategoryDistributionPieChart from "./BillCategoryDistributionPieChart";

export interface WidgetLayoutDefaults {
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

export interface WidgetDefinition {
  code: string;
  name: string;
  defaultLayout: WidgetLayoutDefaults;
}

export const GRID_COLS = 24;

export const BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
} as const;

export const COLS = {
  lg: 24,
  md: 16,
  sm: 12,
  xs: 8,
  xxs: 4,
} as const;

/** widget_code → 本地组件。尚未实现的 code 在 Grid 中显示空卡片。 */
export const widgetComponents: Record<string, ComponentType<any>> = {
  "my-patient": MyPatientWidget,
  test: Test,
  "dept-patient": DeptPatientWidget,
  "to-verify-order-list": ToVerifyOrderList,
  "to-end-order-list": ToEndOrderList,
  "to-exec-order-list": ToExecOrderList,
  "to-terminate-order-list": ToTerminateOrderList,
  "bedside-card": BedsideCard,
  "emr-to-sign-list": EmrToSignList,
  "favorite-vital": FavoriteVital,
  "bill-category-distribution-pipe-chart": BillCategoryDistributionPieChart,
};

export const DEFAULT_WIDGETS: WidgetDefinition[] = [];

export const toLayoutItems = (widgets: WidgetDefinition[]) =>
  widgets.map((widget) => ({ i: widget.code, ...widget.defaultLayout }));

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const parseWidgetSnapshot = (
  raw: string | undefined,
): WidgetDefinition[] | null => {
  if (!raw?.trim()) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return null;

    const widgets: WidgetDefinition[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      if (typeof row.code !== "string" || !row.code) continue;
      const layout =
        row.defaultLayout && typeof row.defaultLayout === "object"
          ? (row.defaultLayout as Record<string, unknown>)
          : {};
      widgets.push({
        code: row.code,
        name: typeof row.name === "string" ? row.name : row.code,
        defaultLayout: {
          x: toFiniteNumber(layout.x, 0),
          y: toFiniteNumber(layout.y, 0),
          w: toFiniteNumber(layout.w, 12),
          h: toFiniteNumber(layout.h, 4),
          minW: toFiniteNumber(layout.minW, 3),
          minH: toFiniteNumber(layout.minH, 2),
        },
      });
    }
    return widgets;
  } catch {
    return null;
  }
};
