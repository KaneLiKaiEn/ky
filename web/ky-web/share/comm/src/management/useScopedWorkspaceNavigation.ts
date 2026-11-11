import { useWorkspaceNavigation } from "./useWorkspaceNavigation";
import {
  confirmWorkspaceNavigation,
  type WorkspaceConfirmationState,
} from "./confirmWorkspaceNavigation";
import { App } from "antd";
import { useCallback, useRef } from "react";
export type WorkspaceGuard = ReturnType<typeof useWorkspaceNavigation> & {
  registerDiscard?: (discard: (() => void) | null) => void;
};
interface Entry extends WorkspaceConfirmationState {
  dirty: boolean;
  busy: boolean;
  pageBusy: boolean;
  save: (() => Promise<boolean>) | null;
  depth: number;
  discard?: (() => void) | null;
  guard: WorkspaceGuard;
}
/** A single history guard aggregates independent editors, saving deepest editors first. */
export function useScopedWorkspaceNavigation(onDiscard?: () => void) {
  const entries = useRef(new Map<string, Entry>());
  const root = useWorkspaceNavigation(() => {
    for (const row of entries.current.values()) {
      row.discard?.();
      row.dirty = false;
    }
    onDiscard?.();
  });
  const current = useRef(root);
  current.current = root;
  const { modal } = App.useApp();
  const sync = useCallback(() => {
    const all = [...entries.current.values()];
    current.current.onDirtyChange(all.some((row) => row.dirty));
    current.current.onBusyChange(all.some((row) => row.busy || row.pageBusy));
    current.current.registerSave(async () => {
      for (const row of [...entries.current.values()].sort(
        (a, b) => b.depth - a.depth,
      )) {
        if (row.dirty) {
          if (!row.save || !(await row.save())) return false;
          row.dirty = false;
        }
      }
      sync();
      return true;
    });
  }, []);
  const scope = useCallback(
    (key: string, depth = 0): WorkspaceGuard => {
      const previous = entries.current.get(key);
      if (previous) return previous.guard;
      const entry: Entry = {
        dirty: false,
        busy: false,
        pageBusy: false,
        save: null,
        depth,
        guard: null!,
      };
      const confirm = (saveOnly: boolean): Promise<boolean> => {
        if (
          [...entries.current.values()].some((row) => row.busy || row.pageBusy)
        )
          return Promise.resolve(false);
        if (!entry.dirty) return Promise.resolve(true);
        return confirmWorkspaceNavigation(
          modal,
          {
            saveOnly,
            canSave: () => !entry.busy && !entry.pageBusy,
            save: () => entry.save?.(),
            onDiscard: () => entry.discard?.(),
            onFinish: (ok) => {
              if (ok) entry.dirty = false;
              sync();
            },
          },
          entry,
        );
      };
      entry.guard = {
        get busy() {
          return [...entries.current.values()].some(
            (row) => row.busy || row.pageBusy,
          );
        },
        isDirty: () => entry.dirty,
        isBusy: () => current.current.isBusy(),
        commitNavigation: (action) => current.current.commitNavigation(action),
        allow: () => confirm(false),
        ensureSaved: () => confirm(true),
        onDirtyChange: (value) => {
          entry.dirty = value;
          sync();
        },
        onBusyChange: (value) => {
          entry.busy = value;
          sync();
        },
        setPageBusy: (value) => {
          entry.pageBusy = value;
          sync();
        },
        registerSave: (save) => {
          entry.save = save;
          sync();
        },
        registerDiscard: (discard) => {
          entry.discard = discard;
        },
      };
      entries.current.set(key, entry);
      return entry.guard;
    },
    [modal, sync],
  );
  return { guard: root, scope };
}
