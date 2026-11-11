import { useCallback, useState } from "react";
import type { EmrCreateSelection } from "../types";
import {
  buildEmrCreateDraft,
  type EmrCreateDraft,
} from "../utils/emrCreateDraft";

/**
 * 共用「打开选择弹窗 → 确认生成草稿 → 交给 EmrContent」流程。
 */
export const useEmrCreateFlow = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draft, setDraft] = useState<EmrCreateDraft | null>(null);

  const openCreate = useCallback(() => setCreateOpen(true), []);
  const closeCreate = useCallback(() => {
    setDraftLoading(false);
    setCreateOpen(false);
  }, []);
  const clearDraft = useCallback(() => setDraft(null), []);

  const handleConfirm = useCallback(async (selection: EmrCreateSelection) => {
    setDraftLoading(true);
    try {
      const next = await buildEmrCreateDraft(selection);
      if (next == null) return;
      setDraft(next);
      setCreateOpen(false);
    } catch {
    } finally {
      setDraftLoading(false);
    }
  }, []);

  return {
    createOpen,
    openCreate,
    closeCreate,
    draftLoading,
    draft,
    setDraft,
    clearDraft,
    handleConfirm,
  };
};
