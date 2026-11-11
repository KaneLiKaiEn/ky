import type { MetricRow, MetricValue } from "../../types/metric.d.ts";

export interface Query {
  unitId: number;
  unitName: string;
  entityId?: number;
  date: string;
}
export interface PreviewArgument {
  arg_code: string;
  arg_type: string;
  arg_value: string;
}
export interface PreviewTarget {
  depth?: number;
  type: "BOARD" | "REPORT";
  id: number;
  title?: string;
  argList: PreviewArgument[];
}
export interface ValueRow extends MetricValue {
  key: string;
  metric_title?: string;
  child_count?: number;
  entity_count?: number;
  kind?: "unit" | "entity" | "group";
  group_no?: number;
  group_code?: string;
  source?: MetricRow;
  children?: ValueRow[];
}
export interface Filters {
  showNull: boolean;
  sort: string;
  top: number;
  finish: string;
  yoy: string;
}
export const defaultFilters: Filters = {
  showNull: false,
  sort: "value_desc",
  top: 0,
  finish: "",
  yoy: "",
};
