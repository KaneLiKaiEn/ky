import type { AreaRow } from "../../PatientInfo/types/sys";
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
export declare const useAreaStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AreaStoreState>>;
/**
 * 组件内取区域列表：首次挂载时 ensure，同 parent 全局复用
 * parentId 为 undefined 时不请求（如未选省时不拉市）
 */
export declare function useArea(parentId?: number, areaLevel?: number): {
    rows: AreaRow[];
    loading: boolean;
};
export {};
