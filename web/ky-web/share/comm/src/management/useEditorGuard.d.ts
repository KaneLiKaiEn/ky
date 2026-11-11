export interface EditorGuard {
    registerDiscard?: (discard: (() => void) | null) => void;
    onDirtyChange: (dirty: boolean) => void;
    onBusyChange: (busy: boolean) => void;
    registerSave: (save: (() => Promise<boolean>) | null) => void;
}
export declare function useEditorGuard(props: EditorGuard, dirty: boolean, busy: boolean, save: () => Promise<boolean>): void;
