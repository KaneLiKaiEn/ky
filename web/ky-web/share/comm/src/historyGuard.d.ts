export interface HistoryNavigationGuard {
    isBlocked: () => boolean;
    getIndex: () => number;
    confirm: () => Promise<boolean>;
}
export declare function registerHistoryNavigationGuard(guard: HistoryNavigationGuard): () => void;
