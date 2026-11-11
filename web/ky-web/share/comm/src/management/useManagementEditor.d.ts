import type { EditorGuard } from "./useEditorGuard";
export interface ManagementEditorContext {
    identity: string;
    isCurrent: () => boolean;
    guard: EditorGuard;
}
/** A committed write is never repeated to recover from a failed follow-up read. */
export declare function useManagementEditor<T>(context: ManagementEditorContext, load: () => Promise<T>, persist: (value: T) => Promise<unknown>, onSaved?: () => Promise<void>): {
    reload: () => Promise<void>;
    loadError: string | undefined;
    value: T | undefined;
    setValue: import("react").Dispatch<import("react").SetStateAction<T | undefined>>;
    baseline: T | undefined;
    busy: boolean;
    error: string | undefined;
    saved: boolean;
    dirty: boolean;
    save: () => Promise<boolean>;
    discard: () => void;
    data?: T | undefined;
    loading: boolean;
    ready: boolean;
    reloadData: () => Promise<T | undefined>;
    refresh: () => void;
    mutate: (update: (data: T | undefined) => T) => void;
};
