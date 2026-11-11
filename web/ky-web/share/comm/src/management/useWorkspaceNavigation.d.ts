export interface WorkspaceNavigationOptions {
    discardContent?: string;
    /** Keep the existing footer unless the caller opts out of unregistered saves. */
    hideSaveWithoutHandler?: boolean;
}
/** Shared by URL changes, Host navigation, drawers and period switches. */
export declare function useWorkspaceNavigation(onDiscard?: () => void, options?: WorkspaceNavigationOptions): {
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
