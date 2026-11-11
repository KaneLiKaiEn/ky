import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "antd";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import {
  getObserveFavoriteList,
  getObserveLatest,
  getObserveList,
  saveObserveFavoriteList,
} from "@/api/care";
import { getElemProperty2 } from "@/api/elem";
import { getSessionInfo } from "@/api/auth";
import type {
  ObserveFavoriteRow,
  ObserveLatestRow,
  ObserveRow,
  VitalSignItem,
} from "@/types/care";
import { calcObserveRange } from "./utils/observeRange";

interface UseFavoriteObserveOptions {
  visitId: number;
  babyId: number;
}

export function useFavoriteObserve({
  visitId,
  babyId,
}: UseFavoriteObserveOptions) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [items, setItems] = useState<VitalSignItem[]>([]);
  const [workType, setWorkType] = useState("DOCTOR");
  const workTypeRef = useRef(workType);
  workTypeRef.current = workType;

  const mergeLatestAndFavorite = useCallback(
    (
      latestList: ObserveLatestRow[],
      favoriteList: ObserveFavoriteRow[],
    ): VitalSignItem[] =>
      latestList.map((item) => {
        const matched = favoriteList.find((f) => f.elem_id === item.elem_id);
        return {
          ...item,
          checked: !!matched,
          tempChecked: !!matched,
          favorite_duration: matched?.favorite_duration,
          favorite_unit: matched?.favorite_unit ?? "HOUR",
        };
      }),
    [],
  );

  const loadObserveHistory = useCallback(
    async (favoriteItems: VitalSignItem[]): Promise<ObserveRow[]> => {
      const now = dayjs();
      const requests = favoriteItems
        .filter((item) => item.elem_id != null && item.elem_id > 0)
        .map(async (item) => {
          const range = calcObserveRange(
            item.favorite_duration ?? 24,
            item.favorite_unit ?? "HOUR",
            now,
          );
          if (!range) return [] as ObserveRow[];

          const res = await getObserveList({
            visit_id: visitId,
            baby_id: babyId,
            elem_id: item.elem_id,
            observe_start: range.observeStart,
            observe_end: range.observeEnd,
          });
          if (res.code !== 0) return [] as ObserveRow[];
          return res.row_list ?? [];
        });

      const results = await Promise.all(requests);
      return results.flat();
    },
    [babyId, visitId],
  );

  const enrichElemProperties = useCallback(async (list: VitalSignItem[]) => {
    const elemIds = list
      .filter((item) => item.checked && item.elem_id != null && item.elem_id > 0)
      .map((item) => item.elem_id!);
    if (!elemIds.length) return list;

    const res = await getElemProperty2({ id_list: elemIds });
    if (res.code !== 0) return list;

    const elemMap = new Map(
      (res.elem_list ?? []).map((elem) => [elem.elem_id, elem]),
    );
    return list.map((item) => ({
      ...item,
      ...elemMap.get(item.elem_id),
    }));
  }, []);

  const loadData = useCallback(async () => {
    if (visitId <= 0) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const sessionRes = await getSessionInfo({
        session_id: getSessionId() ?? undefined,
      });
      const sessionWorkType = (sessionRes.session_info?.work_type ?? "DOCTOR")
        .toUpperCase()
        .trim();
      const nextWorkType = sessionWorkType || "DOCTOR";
      setWorkType(nextWorkType);

      const [latestRes, favoriteRes] = await Promise.all([
        getObserveLatest({ visit_id: visitId, baby_id: babyId }),
        getObserveFavoriteList({
          visit_id: visitId,
          baby_id: babyId,
          work_type: nextWorkType,
        }),
      ]);

      if (latestRes.code !== 0) {
        message.error(`${latestRes.message || ""}${latestRes.hint || ""}`);
        setItems([]);
        return;
      }
      if (favoriteRes.code !== 0) {
        message.error(`${favoriteRes.message || ""}${favoriteRes.hint || ""}`);
      }

      let merged = mergeLatestAndFavorite(
        latestRes.row_list ?? [],
        favoriteRes.row_list ?? [],
      );

      const favoriteItems = merged.filter((item) => item.checked);
      if (favoriteItems.length > 0) {
        const [historyRows, enriched] = await Promise.all([
          loadObserveHistory(favoriteItems),
          enrichElemProperties(merged),
        ]);
        merged = enriched.map((item) => ({
          ...item,
          observeList: historyRows.filter(
            (row) => row.elem_id === item.elem_id,
          ),
        }));
      }

      setItems(merged);
    } catch {
      message.error("加载生命体征失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [
    babyId,
    enrichElemProperties,
    loadObserveHistory,
    mergeLatestAndFavorite,
    message,
    visitId,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const checkedItems = items.filter((item) => item.checked);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  const toggleFavorite = useCallback((elemId: number, tempChecked: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.elem_id === elemId
          ? {
              ...item,
              tempChecked,
              favorite_duration: item.favorite_duration ?? 24,
              favorite_unit: item.favorite_unit ?? "HOUR",
            }
          : item,
      ),
    );
  }, []);

  const updateDuration = useCallback(
    (elemId: number, duration: number | null) => {
      setItems((prev) =>
        prev.map((item) =>
          item.elem_id === elemId
            ? { ...item, favorite_duration: duration ?? 0 }
            : item,
        ),
      );
    },
    [],
  );

  const updateUnit = useCallback((elemId: number, unit: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.elem_id === elemId ? { ...item, favorite_unit: unit } : item,
      ),
    );
  }, []);

  const saveFavorites = useCallback(async () => {
    if (visitId <= 0) return;

    setSaving(true);
    try {
      const rowList: ObserveFavoriteRow[] = items
        .filter((item) => item.tempChecked && item.elem_id != null)
        .map((item) => ({
          elem_id: item.elem_id,
          elem_code: item.elem_code,
          elem_name: item.elem_name,
          elem_unit: item.elem_unit,
          favorite_duration: item.favorite_duration ?? 24,
          favorite_unit: item.favorite_unit ?? "HOUR",
        }));

      const res = await saveObserveFavoriteList({
        visit_id: visitId,
        baby_id: babyId,
        work_type: workTypeRef.current,
        row_list: rowList,
      });

      if (res.code !== 0) {
        message.error(`${res.message || ""}${res.hint || ""}`);
        return;
      }

      message.success("保存成功");
      setModalVisible(false);
      await loadData();
    } catch {
      message.error("保存关注列表失败");
    } finally {
      setSaving(false);
    }
  }, [babyId, items, loadData, message, visitId]);

  return {
    items,
    checkedItems,
    loading,
    saving,
    modalVisible,
    openModal,
    closeModal,
    toggleFavorite,
    updateDuration,
    updateUnit,
    saveFavorites,
    refresh: loadData,
  };
}
