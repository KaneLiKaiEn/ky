import type { Dict2ItemRow } from "../../PatientInfo/types/sys";
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
export declare const useDictStore: import("zustand").UseBoundStore<import("zustand").StoreApi<DictStoreState>>;
/**
 * 组件内取字典，同类型全局复用。
 * eager 默认 true（挂载即请求）。下拉场景传 eager: false，展开时再调 ensure。
 */
export declare function useDict(dictName: string, options?: {
    eager?: boolean;
}): {
    rows: Dict2ItemRow[];
    loading: boolean;
    loaded: boolean;
    ensure: () => Promise<Dict2ItemRow[]>;
};
export {};
