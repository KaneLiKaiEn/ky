import { useCallback, useEffect } from "react";
import { create } from "zustand";
import { retrieveDict2ItemList } from "../../PatientInfo/api/sys";
import type { Dict2ItemRow } from "../../PatientInfo/types/sys";

/** 全量拉取，避免分页截断导致已选 code 不在列表中 */
const DICT_RETRIEVE_LIMIT = 0;

const EMPTY_ROWS: Dict2ItemRow[] = [];

interface DictCacheEntry {
  rows: Dict2ItemRow[];
  loading: boolean;
  loaded: boolean;
}

interface DictStoreState {
  cache: Record<string, DictCacheEntry>;
  /** 同 dictName 只请求一次，后续复用 */
  ensureDict: (dictName: string) => Promise<Dict2ItemRow[]>;
}

/** 进行中的请求，避免并发重复打接口 */
const inflight = new Map<string, Promise<Dict2ItemRow[]>>();

export const useDictStore = create<DictStoreState>()((set, get) => ({
  cache: {},
  ensureDict: async (dictName) => {
    if (!dictName) return [];

    const cached = get().cache[dictName];
    if (cached?.loaded) return cached.rows;

    const pending = inflight.get(dictName);
    if (pending) return pending;

    set((state) => ({
      cache: {
        ...state.cache,
        [dictName]: {
          rows: cached?.rows ?? EMPTY_ROWS,
          loading: true,
          loaded: false,
        },
      },
    }));

    const promise = retrieveDict2ItemList({
      dict_code: dictName,
      retrieve_input: "*",
      retrieve_limit: DICT_RETRIEVE_LIMIT,
    })
      .then((res) => {
        const rows = res.row_list ?? [];
        set((state) => ({
          cache: {
            ...state.cache,
            [dictName]: { rows, loading: false, loaded: true },
          },
        }));
        return rows;
      })
      .catch(() => {
        set((state) => ({
          cache: {
            ...state.cache,
            [dictName]: { rows: [], loading: false, loaded: true },
          },
        }));
        return [] as Dict2ItemRow[];
      })
      .finally(() => {
        inflight.delete(dictName);
      });

    inflight.set(dictName, promise);
    return promise;
  },
}));

/**
 * 组件内取字典，同类型全局复用。
 * eager 默认 true（挂载即请求）。下拉场景传 eager: false，展开时再调 ensure。
 */
export function useDict(
  dictName: string,
  options?: { eager?: boolean },
) {
  const eager = options?.eager !== false;
  const entry = useDictStore((s) => s.cache[dictName]);
  const ensureDict = useDictStore((s) => s.ensureDict);

  useEffect(() => {
    if (!eager || !dictName) return;
    void ensureDict(dictName);
  }, [dictName, ensureDict, eager]);

  const ensure = useCallback(
    () => ensureDict(dictName),
    [dictName, ensureDict],
  );

  return {
    rows: entry?.rows ?? EMPTY_ROWS,
    /** 尚未发起请求时，只有 eager 视为加载中，避免下拉未展开就转圈 */
    loading: entry ? entry.loading : eager && !!dictName,
    loaded: !!entry?.loaded,
    ensure,
  };
}
