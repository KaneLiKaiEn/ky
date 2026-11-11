export interface ResourceState<T> {
    key: string | null;
    data?: T;
    loading: boolean;
    error?: string;
}
export interface ResourceOptions {
    formatError?: (error: unknown) => string;
}
export interface Resource<T> {
    data?: T;
    loading: boolean;
    error?: string;
    ready: boolean;
    reloadData: () => Promise<T | undefined>;
    reload: () => Promise<void>;
    /** Schedule a background read; failures are exposed through error. */
    refresh: () => void;
    mutate: (update: (data: T | undefined) => T) => void;
}
/** Each hook owns its snapshot; only the latest request for its current key may settle. */
export declare function useResource<T>(key: string | null, loader: () => Promise<T>, options?: ResourceOptions): Resource<T>;
