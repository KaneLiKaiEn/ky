import { createContext, useContext, type CSSProperties } from "react";
import type { LibRow, MetricFavoriteRow } from "../../types/metric.d.ts";
import type { CatalogRow } from "../../types/sys.d.ts";
import type { ManagementSession } from "comm/management";
import type { Query, PreviewTarget, PreviewArgument } from "./types";
import type { Service } from "./service";

export interface PreviewContext {
  allowFavorites?: boolean;
  host?: {
    argList?: PreviewArgument[];
    requestRunner?: import("./runtime").RequestRunner;
    depth: number;
    refreshKey?: number;
    autoRefresh?: boolean;
  };
  appearance?: "default" | "dashboard";
  identity: string;
  session: ManagementSession;
  service: Service;
  libId?: number;
  library?: LibRow;
  catalogs: CatalogRow[];
  query: Query;
  entityIds: number[];
  detailQuery: Query;
  catalogId?: number;
  metricId?: number;
  dynamic: boolean;
  busy: boolean;
  style: CSSProperties;
  favorites: MetricFavoriteRow[];
  favoriteError?: string;
  reloadFavorites: () => Promise<unknown>;
  favorite: (metricId: number) => void;
  setQuery: (query: Query) => void;
  selectCatalog: (id: number) => void;
  selectMetric: (id: number, date?: string, catalogId?: number) => void;
  open: (target: PreviewTarget) => void;
  setBusy: (key: string, busy: boolean) => void;
}
export const Context = createContext<PreviewContext | undefined>(undefined);
export function usePreview() {
  const context = useContext(Context);
  if (!context) throw new Error("MetricPreview context is missing");
  return context;
}
