import { useEffect } from "react";
import { create } from "zustand";
import { retrieveAreaListAPI } from "../../PatientInfo/api/sys";
import type { AreaRow } from "../../PatientInfo/types/sys";

/** 全量拉取，避免分页截断导致已选区域不在列表中 */
const AREA_RETRIEVE_LIMIT = 0;

const EMPTY_ROWS: AreaRow[] = [];

interface AreaCacheEntry {
  rows: AreaRow[];
  loading: boolean;
  loaded: boolean;
}

interface AreaStoreState {
  cache: Record<string, AreaCacheEntry>;
  /** 同 parentId(+level) 只请求一次，后续复用 */
  ensureArea: (parentId: number, areaLevel?: number) => Promise<AreaRow[]>;
}

const cacheKey = (parentId: number, areaLevel?: number) =>
  areaLevel != null ? `${parentId}:${areaLevel}` : String(parentId);

/** 进行中的请求，避免并发重复打接口 */
const inflight = new Map<string, Promise<AreaRow[]>>();

export const useAreaStore = create<AreaStoreState>()((set, get) => ({
  cache: {},
  ensureArea: async (parentId, areaLevel) => {
    if (parentId == null || Number.isNaN(parentId)) return [];

    const key = cacheKey(parentId, areaLevel);
    const cached = get().cache[key];
    if (cached?.loaded) return cached.rows;

    const pending = inflight.get(key);
    if (pending) return pending;

    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          rows: cached?.rows ?? EMPTY_ROWS,
          loading: true,
          loaded: false,
        },
      },
    }));

    const promise = retrieveAreaListAPI({
      parent_id: parentId,
      ...(areaLevel != null ? { area_level: areaLevel } : {}),
      retrieve_input: "*",
      retrieve_limit: AREA_RETRIEVE_LIMIT,
    })
      .then((res) => {
        const rows = res.row_list ?? [];
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: { rows, loading: false, loaded: true },
          },
        }));
        return rows;
      })
      .catch(() => {
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: { rows: [], loading: false, loaded: true },
          },
        }));
        return [] as AreaRow[];
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, promise);
    return promise;
  },
}));

/**
 * 组件内取区域列表：首次挂载时 ensure，同 parent 全局复用
 * parentId 为 undefined 时不请求（如未选省时不拉市）
 */
export function useArea(parentId?: number, areaLevel?: number) {
  const key = parentId == null ? "" : cacheKey(parentId, areaLevel);
  const entry = useAreaStore((s) => (key ? s.cache[key] : undefined));
  const ensureArea = useAreaStore((s) => s.ensureArea);

  useEffect(() => {
    if (parentId == null) return;
    void ensureArea(parentId, areaLevel);
  }, [parentId, areaLevel, ensureArea]);

  return {
    rows: entry?.rows ?? EMPTY_ROWS,
    loading: parentId != null && !entry?.loaded,
  };
}
