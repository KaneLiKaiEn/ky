import { App } from "antd";
import { registerHistoryNavigationGuard } from "../session";
import {
  confirmWorkspaceNavigation,
  type WorkspaceConfirmationState,
} from "./confirmWorkspaceNavigation";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { UNSAFE_NavigationContext, useLocation } from "react-router-dom";

export interface WorkspaceNavigationOptions {
  discardContent?: string;
  /** Keep the existing footer unless the caller opts out of unregistered saves. */
  hideSaveWithoutHandler?: boolean;
}

/** Shared by URL changes, Host navigation, drawers and period switches. */
export function useWorkspaceNavigation(
  onDiscard?: () => void,
  options: WorkspaceNavigationOptions = {},
) {
  const discardRef = useRef(onDiscard);
  discardRef.current = onDiscard;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const { modal } = App.useApp();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const location = useLocation();
  const dirty = useRef(false);
  const locked = useRef(false);
  const locks = useRef(new Set<string>());
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);
  const confirmation = useRef<WorkspaceConfirmationState>({});
  const committing = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const onDirtyChange = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);
  const setLock = useCallback((key: string, value: boolean) => {
    if (value) locks.current.add(key);
    else locks.current.delete(key);
    locked.current = locks.current.size > 0;
    setBusy(locked.current);
  }, []);
  const onBusyChange = useCallback(
    (value: boolean) => setLock("editor", value),
    [setLock],
  );
  const setPageBusy = useCallback(
    (value: boolean) => setLock("workspace", value),
    [setLock],
  );
  const isBusy = useCallback(() => locked.current, []);
  /** Apply an accepted save/delete result before its final busy lock is released. */
  const commitNavigation = useCallback((action: () => void) => {
    const previous = committing.current;
    committing.current = true;
    try {
      action();
    } finally {
      committing.current = previous;
    }
  }, []);
  const registerSave = useCallback((save: (() => Promise<boolean>) | null) => {
    saveRef.current = save;
  }, []);
  const allow = useCallback((): Promise<boolean> => {
    if (locked.current) return Promise.resolve(false);
    if (!dirty.current) return Promise.resolve(true);
    return confirmWorkspaceNavigation(
      modal,
      {
        content:
          optionsRef.current.discardContent ?? "保存后离开，或放弃本次修改。",
        wrap: true,
        showSave:
          !optionsRef.current.hideSaveWithoutHandler || !!saveRef.current,
        canSave: () => !!saveRef.current && !locked.current,
        save: () => saveRef.current?.(),
        onDiscard: () => discardRef.current?.(),
        onFinish: (value) => {
          if (value) dirty.current = false;
        },
      },
      confirmation.current,
    );
  }, [modal]);
  const allowRef = useRef(allow);
  /** Executions must use saved configuration; discarding a draft is not an execution option. */
  const ensureSaved = useCallback((): Promise<boolean> => {
    if (locked.current) return Promise.resolve(false);
    if (!dirty.current) return Promise.resolve(true);
    return confirmWorkspaceNavigation(modal, {
      saveOnly: true,
      content: "保存成功后执行操作。",
      retryOnSaveFailure: true,
      save: () => saveRef.current?.(),
      onFinish: () => {
        dirty.current = false;
      },
    });
  }, [modal]);
  allowRef.current = allow;
  const historyIndex = useRef<number>(window.history.state?.idx ?? 0);
  useLayoutEffect(() => {
    historyIndex.current = window.history.state?.idx ?? historyIndex.current;
  }, [location]);
  useEffect(
    () =>
      registerHistoryNavigationGuard({
        isBlocked: () => dirty.current || locked.current,
        getIndex: () => historyIndex.current,
        confirm: () => allowRef.current(),
      }),
    [],
  );

  useEffect(() => {
    mounted.current = true;
    const push = navigator.push.bind(navigator);
    const replace = navigator.replace.bind(navigator);
    const go = navigator.go.bind(navigator);
    let generation = 0;
    const run = (action: () => void) => {
      if (committing.current || (!dirty.current && !locked.current)) {
        action();
        return;
      }
      const revision = ++generation;
      void allowRef.current().then((ok) => {
        if (ok && mounted.current && revision === generation) action();
      });
    };
    const guardedPush: typeof navigator.push = (...args) =>
      run(() => push(...args));
    const guardedReplace: typeof navigator.replace = (...args) =>
      run(() => replace(...args));
    const guardedGo: typeof navigator.go = (...args) => run(() => go(...args));
    navigator.push = guardedPush;
    navigator.replace = guardedReplace;
    navigator.go = guardedGo;
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty.current || locked.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      mounted.current = false;
      generation++;
      if (navigator.push === guardedPush) navigator.push = push;
      if (navigator.replace === guardedReplace) navigator.replace = replace;
      if (navigator.go === guardedGo) navigator.go = go;
      window.removeEventListener("beforeunload", unload);
    };
  }, [navigator]);
  return {
    busy,
    allow,
    onDirtyChange,
    onBusyChange,
    registerSave,
    setPageBusy,
    isBusy,
    commitNavigation,
    ensureSaved,
    isDirty: () => dirty.current,
  };
}
