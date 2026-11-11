import { useCallback, useEffect, useRef, useState } from "react";
import { removeMetricFavorite, moveMetricFavorite } from "../../../api/metric";
import type { MetricFavoriteRow } from "../../../types/metric.d.ts";
import type { ManagementSession } from "comm/management";
import { useWorkspaceNavigation } from "comm/management";
import type { Service } from "../service";
import type { PreviewTarget } from "../types";
import { errorText, useRead } from "./useRead";

/** Writes update confirmed state first; a failed refresh never repeats the write. */
export async function confirmedWrite<T>(
  write: () => Promise<T>,
  apply: (result: T) => void,
  reload: () => Promise<unknown>,
) {
  const result = await write();
  apply(result);
  await reload().catch(() => {});
}
export function favoriteMove(
  rows: MetricFavoriteRow[],
  id: number,
  direction: "up" | "down",
) {
  const index = rows.findIndex((row) => row.favorite_id === id);
  const next = index + (direction === "up" ? -1 : 1);
  if (index < 0 || next < 0 || next >= rows.length || !rows[next].favorite_id)
    return;
  return direction === "up"
    ? { favorite_id: id, before_id: rows[next].favorite_id! }
    : { favorite_id: id, after_id: rows[next].favorite_id! };
}
export function reorderFavorites(
  rows: MetricFavoriteRow[],
  id: number,
  target: number,
  before: boolean,
) {
  const moved = rows.find((row) => row.favorite_id === id);
  if (!moved) return rows;
  const rest = rows.filter((row) => row.favorite_id !== id);
  const index = rest.findIndex((row) => row.favorite_id === target);
  if (index < 0) return rows;
  return [
    ...rest.slice(0, index + (before ? 0 : 1)),
    moved,
    ...rest.slice(index + (before ? 0 : 1)),
  ];
}
export function useWorkspaceActions(
  service: Service,
  session: ManagementSession,
  identity: string,
  libId?: number,
) {
  const guard = useWorkspaceNavigation();
  const locks = useRef(new Set<string>()),
    alive = useRef(true);
  const [busy, setLocked] = useState(false);
  const setBusy = useCallback(
    (key: string, value: boolean) => {
      if (value) locks.current.add(key);
      else locks.current.delete(key);
      const locked = locks.current.size > 0;
      if (!alive.current) return;
      setLocked(locked);
      guard.setPageBusy(locked);
    },
    [guard.setPageBusy],
  );
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      locks.current.clear();
      guard.setPageBusy(false);
    };
  }, [guard.setPageBusy]);
  const favorites = useRead(`favorites:${identity}`, (signal) =>
    service.favorites(
      {
        user_id: session.userId,
        include_child: true,
        ...(libId ? { lib_id: libId } : {}),
      },
      signal,
    ),
  );
  const [favoriteId, setFavoriteId] = useState<number>(),
    [writeError, setWriteError] = useState<string>();
  const [targets, setTargets] = useState<(PreviewTarget & { key: string })[]>(
    [],
  );
  const open = useCallback((target: PreviewTarget) => {
    const key = `${target.type}:${target.id}:${JSON.stringify(target.argList)}`;
    setTargets((previous) => [
      ...previous.filter((item) => item.key !== key),
      { ...target, key },
    ]);
  }, []);
  const reloadFavorites = async () => {
    setWriteError(undefined);
    await favorites.reload();
  };
  const perform = async (write: () => Promise<unknown>, apply: () => void) => {
    if (locks.current.size || favorites.loading || favorites.error) return;
    setBusy("favorite", true);
    setWriteError(undefined);
    try {
      await confirmedWrite(
        write,
        () => {
          if (alive.current) apply();
        },
        async () => {
          if (alive.current) await favorites.reload();
        },
      );
    } catch (error) {
      if (alive.current) setWriteError(errorText(error));
    } finally {
      setBusy("favorite", false);
    }
  };
  const favorite = (metricId: number) => {
    if (locks.current.size || favorites.loading || favorites.error) return;
    const record = favorites.data?.row_list?.find(
      (row) => row.metric_id === metricId,
    );
    if (!record) {
      setFavoriteId(metricId);
      return;
    }
    void perform(
      () =>
        removeMetricFavorite({ user_id: session.userId, metric_id: metricId }),
      () =>
        favorites.mutate((previous) => ({
          code: 0,
          ...previous,
          row_list:
            previous?.row_list?.filter((row) => row.metric_id !== metricId) ??
            [],
        })),
    );
  };
  const saved = async (row: MetricFavoriteRow) => {
    favorites.mutate((previous) => ({
      code: 0,
      ...previous,
      row_list: [
        ...(previous?.row_list ?? []).filter(
          (item) => item.metric_id !== row.metric_id,
        ),
        row,
      ],
    }));
    setFavoriteId(undefined);
    await favorites.reload().catch(() => {});
  };
  const move = async (
    rows: MetricFavoriteRow[],
    id: number,
    direction: "up" | "down",
  ) => {
    const params = favoriteMove(rows, id, direction);
    if (!params) return;
    await perform(
      () => moveMetricFavorite(params),
      () =>
        favorites.mutate((previous) => ({
          code: 0,
          ...previous,
          row_list: reorderFavorites(
            previous?.row_list ?? [],
            id,
            params.before_id ?? params.after_id!,
            params.before_id != null,
          ),
        })),
    );
  };
  return {
    busy,
    setBusy,
    favorites,
    favoriteError: favorites.error || writeError,
    reloadFavorites,
    favorite,
    favoriteId,
    setFavoriteId,
    saved,
    move,
    targets,
    setTargets,
    open,
  };
}
export type WorkspaceActions = ReturnType<typeof useWorkspaceActions>;
