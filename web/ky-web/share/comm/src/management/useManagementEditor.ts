import type { EditorGuard } from "./useEditorGuard";
import { useEditorGuard } from "./useEditorGuard";
import { useResource } from "../resource";
import { errorText } from "../utils/result";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ManagementEditorContext {
  identity: string;
  isCurrent: () => boolean;
  guard: EditorGuard;
}

/** A committed write is never repeated to recover from a failed follow-up read. */
export function useManagementEditor<T>(
  context: ManagementEditorContext,
  load: () => Promise<T>,
  persist: (value: T) => Promise<unknown>,
  onSaved?: () => Promise<void>,
) {
  const resource = useResource(context.identity, load);
  const [value, setValue] = useState<T>();
  const [baseline, setBaseline] = useState<T>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const lock = useRef(false),
    mounted = useRef(true),
    committed = useRef(false),
    needsRefresh = useRef(false),
    applied = useRef<T | undefined>(undefined),
    baselineRef = useRef<T | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (resource.data !== undefined && resource.data !== applied.current) {
      applied.current = resource.data;
      setValue(resource.data);
      setBaseline(resource.data);
      baselineRef.current = resource.data;
      if (!needsRefresh.current) setError(undefined);
      committed.current = false;
    }
  }, [resource.data]);
  const dirty = useMemo(
    () => JSON.stringify(value) !== JSON.stringify(baseline),
    [value, baseline],
  );
  const discard = useCallback(() => {
    if (!mounted.current || lock.current || !context.isCurrent()) return;
    setValue(baselineRef.current);
    if (!needsRefresh.current) {
      setError(undefined);
      setSaved(false);
    }
    context.guard.onDirtyChange(false);
  }, [context.isCurrent, context.guard.onDirtyChange]);
  const registerDiscard = context.guard.registerDiscard;
  useEffect(() => {
    registerDiscard?.(discard);
    return () => registerDiscard?.(null);
  }, [registerDiscard, discard]);
  const reload = async () => {
    const ownLock = !lock.current;
    if (ownLock) {
      lock.current = true;
      setBusy(true);
      context.guard.onBusyChange(true);
    }
    try {
      const next = await resource.reloadData();
      if (!mounted.current || !context.isCurrent() || next === undefined)
        return;
      // Apply the accepted read before unlocking. A later resource effect must not reset
      // the next user action or replace the row keys captured by its event handler.
      applied.current = next;
      setValue(next);
      setBaseline(next);
      baselineRef.current = next;
      committed.current = false;
      if (needsRefresh.current) {
        await onSaved?.();
        needsRefresh.current = false;
      }
      setError(undefined);
    } catch (err) {
      if (mounted.current && context.isCurrent())
        setError(
          needsRefresh.current
            ? `已保存成功，重新读取失败：${errorText(err)}。请重试读取。`
            : errorText(err),
        );
      throw err;
    } finally {
      if (ownLock) {
        lock.current = false;
        if (mounted.current) {
          setBusy(false);
          context.guard.onBusyChange(false);
        }
      }
    }
  };
  const save = async () => {
    if (lock.current || value === undefined || !context.isCurrent())
      return false;
    lock.current = true;
    setBusy(true);
    context.guard.onBusyChange(true);
    setError(undefined);
    try {
      if (!committed.current) {
        await persist(value);
        if (!mounted.current || !context.isCurrent()) return false;
        committed.current = true;
        needsRefresh.current = true;
        setBaseline(value);
        baselineRef.current = value;
        setSaved(true);
        // Reset synchronously so a successful write can safely complete navigation.
        context.guard.onDirtyChange(false);
      }
      try {
        await reload();
      } catch {
        /* reload exposes a read-only retry without repeating the write. */
      }
      return true;
    } catch (err) {
      if (mounted.current && context.isCurrent()) setError(errorText(err));
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) {
        setBusy(false);
        // Save-and-leave continues before React effects flush the busy state.
        context.guard.onBusyChange(false);
      }
    }
  };
  useEditorGuard(context.guard, dirty, busy, save);
  return {
    ...resource,
    reload,
    loadError: needsRefresh.current && error ? error : resource.error,
    value,
    setValue,
    baseline,
    busy,
    error,
    saved,
    dirty,
    save,
    discard,
  };
}
