import { useWorkspaceNavigation } from "./useWorkspaceNavigation";
export type WorkspaceGuard = ReturnType<typeof useWorkspaceNavigation> & {
    registerDiscard?: (discard: (() => void) | null) => void;
};
/** A single history guard aggregates independent editors, saving deepest editors first. */
export declare function useScopedWorkspaceNavigation(onDiscard?: () => void): {
    guard: {
        busy: boolean;
        allow: () => Promise<boolean>;
        onDirtyChange: (value: boolean) => void;
        onBusyChange: (value: boolean) => void;
        registerSave: (save: (() => Promise<boolean>) | null) => void;
        setPageBusy: (value: boolean) => void;
        isBusy: () => boolean;
        commitNavigation: (action: () => void) => void;
        ensureSaved: () => Promise<boolean>;
        isDirty: () => boolean;
    };
    scope: (key: string, depth?: number) => WorkspaceGuard;
};
