import { useCallback, useEffect, useRef, useState } from "react";
import { editReportCell } from "../../../api/report";
import { errorText } from "comm/utils";
import { Operation, type RequestRunner } from "../runtime";
import * as service from "../service";
import {
  argumentsFor,
  defaultsFor,
  autoQuery,
  refreshAllowed,
  refreshDelay,
  rowPayload,
  success,
  validateValues,
  type Column,
  type DataRow,
  type Metadata,
  type Result,
  type Snapshot,
  type Values,
  type PageSize,
} from "../model";

export interface PreviewOptions {
  refreshKey?: number;
  autoRefresh?: boolean;
  requestRunner?: RequestRunner;
  blocked?: boolean;
  depth?: number;
}
export function usePreview(
  reportId: number,
  initial: Values,
  active: boolean,
  options: PreviewOptions = {},
) {
  const [meta, setMeta] = useState<Metadata>();
  const [draft, setDraft] = useState<Values>({});
  const [view, setView] = useState<{ result: Result; snapshot: Snapshot }>();
  const [metaLoading, setMetaLoading] = useState(true),
    [loading, setLoading] = useState(false);
  const [metaError, setMetaError] = useState<string>(),
    [error, setError] = useState<string>();
  const [working, setWorking] = useState(false),
    [editing, setEditing] = useState(false);
  const [reload, setReload] = useState(0),
    [visibility, setVisibility] = useState(0);
  const request = useRef(new Operation(options.requestRunner)),
    metadataRequest = useRef(new Operation(options.requestRunner)),
    fileRequest = useRef(new Operation(options.requestRunner));
  const workLock = useRef(false),
    currentMeta = useRef(meta),
    currentView = useRef(view);
  const attempt = useRef<Snapshot | undefined>(undefined),
    alive = useRef(true);
  currentMeta.current = meta;
  currentView.current = view;

  const run = useCallback(
    async (snapshot: Snapshot, metadata = currentMeta.current) => {
      if (!metadata || workLock.current) return;
      const ticket = request.current.begin();
      attempt.current = snapshot;
      setLoading(true);
      setError(undefined);
      try {
        const result = await service.query(metadata, snapshot, ticket);
        if (ticket.current()) setView({ result, snapshot });
      } catch (err) {
        if (ticket.current()) setError(errorText(err));
      } finally {
        if (ticket.current()) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    alive.current = true;
    const ticket = metadataRequest.current.begin();
    setMeta(undefined);
    setView(undefined);
    setMetaLoading(true);
    setMetaError(undefined);
    setError(undefined);
    void (async () => {
      try {
        const next = await service.metadata(reportId, initial, ticket);
        ticket.check();
        setMeta(next);
        setDraft(next.defaults);
        setMetaLoading(false);
        if (autoQuery(next.args, next.defaults)) {
          try {
            validateValues(next.args, next.defaults);
            await run(
              {
                values: { ...next.defaults },
                args: argumentsFor(next.args, next.defaults),
                page: 1,
                size: 1000,
              },
              next,
            );
          } catch (err) {
            if (ticket.current()) setError(errorText(err));
          }
        }
      } catch (err) {
        if (ticket.current()) setMetaError(errorText(err));
      } finally {
        if (ticket.current()) setMetaLoading(false);
      }
    })();
    return () => {
      alive.current = false;
      metadataRequest.current.cancel();
      request.current.cancel();
      fileRequest.current.cancel();
    };
  }, [reportId, reload, run]); // Initial values belong to the mounted report/tab identity.

  useEffect(() => {
    const change = () => setVisibility((n) => n + 1);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  useEffect(() => {
    const delay = refreshDelay(meta?.property.report_tag);
    if (
      options.autoRefresh === false ||
      options.blocked ||
      !delay ||
      !refreshAllowed({
        active,
        hidden: document.hidden,
        loading: loading || metaLoading,
        editing,
        working,
        queried: !!view,
      })
    )
      return;
    const timer = window.setTimeout(() => {
      if (currentView.current) void run(currentView.current.snapshot);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    meta,
    options.autoRefresh,
    options.blocked,
    active,
    visibility,
    loading,
    metaLoading,
    working,
    editing,
    view,
    run,
  ]);

  // A refresh while editing/exporting is represented by the latest props only.
  // Keep the queried snapshot on revision-only refreshes (including pagination).
  const initialKey = JSON.stringify(initial);
  const external = useRef({ initialKey, refreshKey: options.refreshKey });
  const invalidExternal = useRef(false);
  useEffect(() => {
    if (working || editing || options.blocked) return;
    const previous = external.current;
    if (previous.initialKey !== initialKey) {
      request.current.cancel();
      setLoading(false);
    }
    if (!meta || metaLoading) return;
    if (
      previous.initialKey === initialKey &&
      previous.refreshKey === options.refreshKey
    )
      return;
    if (loading && previous.initialKey === initialKey) return;
    external.current = { initialKey, refreshKey: options.refreshKey };
    if (previous.initialKey !== initialKey) {
      const values = defaultsFor(meta.args, initial);
      setDraft(values);
      try {
        validateValues(meta.args, values);
        invalidExternal.current = false;
        void run({
          values,
          args: argumentsFor(meta.args, values),
          page: 1,
          size: view?.snapshot.size ?? 1000,
        });
      } catch (err) {
        invalidExternal.current = true;
        setError(errorText(err));
      }
    } else if (!invalidExternal.current && attempt.current)
      void run(attempt.current);
  }, [
    initialKey,
    options.refreshKey,
    options.blocked,
    meta,
    metaLoading,
    working,
    editing,
    loading,
    run,
  ]);

  const search = () => {
    if (!meta) return;
    try {
      validateValues(meta.args, draft);
      invalidExternal.current = false;
      void run({
        values: structuredClone(draft),
        args: argumentsFor(meta.args, draft),
        page: 1,
        size: view?.snapshot.size ?? 1000,
      });
    } catch (err) {
      setError(errorText(err));
    }
  };
  const paginate = (page: number, size: PageSize) => {
    if (view)
      void run({
        ...view.snapshot,
        page: size !== view.snapshot.size ? 1 : page,
        size,
      });
  };
  const saveCell = async (rowIndex: number, column: Column, value: string) => {
    const current = currentView.current,
      metadata = currentMeta.current;
    if (!current || !metadata || workLock.current) return false;
    workLock.current = true;
    setWorking(true);
    try {
      const row = current.result.rows[rowIndex];
      const ticket = fileRequest.current.begin();
      success(
        await ticket.run(() =>
          editReportCell(
            {
              report_id: reportId,
              arg_list: current.snapshot.args,
              row_data: rowPayload(row),
              edit_key: column.key,
              edit_value: value,
            },
            ticket.signal,
          ),
        ),
      );
      ticket.check();
      if (!alive.current) return false;
      setView({
        ...current,
        result: {
          ...current.result,
          rows: current.result.rows.map((item, i) =>
            i === rowIndex ? { ...item, [column.key]: value } : item,
          ),
        },
      });
      return true;
    } finally {
      workLock.current = false;
      if (alive.current) setWorking(false);
    }
  };
  const fileOperation = async <T>(
    task: (context: {
      meta: Metadata;
      result: Result;
      snapshot: Snapshot;
      ticket: ReturnType<Operation["begin"]>;
    }) => Promise<T>,
  ): Promise<T | undefined> => {
    const current = currentView.current,
      metadata = currentMeta.current;
    if (!current || !metadata || workLock.current) return;
    workLock.current = true;
    setWorking(true);
    const ticket = fileRequest.current.begin();
    try {
      return await task({ meta: metadata, ...current, ticket });
    } finally {
      workLock.current = false;
      if (alive.current) setWorking(false);
    }
  };
  return {
    meta,
    draft,
    setDraft,
    view,
    metaLoading,
    loading,
    metaError,
    error,
    working,
    editing,
    setEditing,
    locked: working || editing,
    retryMeta: () => setReload((n) => n + 1),
    retry: () => attempt.current && void run(attempt.current),
    search,
    paginate,
    saveCell,
    fileOperation,
  };
}
