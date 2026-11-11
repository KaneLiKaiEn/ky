import { App } from "antd";
export interface WorkspaceConfirmationState {
    pending?: Promise<boolean>;
}
interface WorkspaceConfirmationOptions {
    saveOnly?: boolean;
    content?: string;
    wrap?: boolean;
    showSave?: boolean;
    canSave?: () => boolean;
    save: () => Promise<boolean> | undefined;
    onDiscard?: () => void;
    onFinish: (value: boolean) => void;
    /** Preserve the root ensureSaved dialog's native retry and close behavior. */
    retryOnSaveFailure?: boolean;
}
/** Optional state shares one confirmation across concurrent requests. */
export declare function confirmWorkspaceNavigation(modal: ReturnType<typeof App.useApp>["modal"], options: WorkspaceConfirmationOptions, state?: WorkspaceConfirmationState): Promise<boolean>;
export {};
