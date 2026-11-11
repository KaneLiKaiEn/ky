import type { CSSProperties } from "react";

export interface UnitNode {
  unit_id?: number;
  parent_id?: number;
  unit_name?: string;
  unit_type?: string;
  child_count?: number;
}

/** Loaders own transport and queueing; each call is one cancellable request. */
export interface UnitSource {
  roots: (signal: AbortSignal) => Promise<UnitNode[]>;
  children: (parentId: number, signal: AbortSignal) => Promise<UnitNode[]>;
  search: (keyword: string, signal: AbortSignal) => Promise<UnitNode[]>;
  detail: (id: number, signal: AbortSignal) => Promise<UnitNode | undefined>;
}

export interface ControlProps {
  disabled?: boolean;
  allowClear?: boolean;
  "aria-label"?: string;
  style?: CSSProperties;
  id?: string;
}

export interface UnitSelectProps extends ControlProps {
  value?: number;
  valueName?: string;
  onChange?: (value: number | undefined, row?: UnitNode) => void;
  roots?: UnitNode[];
  source: UnitSource;
}

export interface DateFieldsProps extends ControlProps {
  value?: string;
  onChange?: (value: string) => void;
}
