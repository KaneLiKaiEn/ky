import { useEffect, useState } from "react";
import { getFormList } from "@/api/form";
import type { ExtraFormDocInfo } from "../utils/elemCore";

interface ExtraFormDefinitionState {
  key: string | null;
  formId: number | null;
  loading: boolean;
  error: string | null;
}

export const useExtraFormDefinition = (doc: ExtraFormDocInfo | null, open: boolean) => {
  const key = open && doc ? JSON.stringify([doc.doc_type, doc.doc_name, doc.doc_tag]) : null;
  const [state, setState] = useState<ExtraFormDefinitionState>({
    key: null,
    formId: null,
    loading: false,
    error: null,
  });
  useEffect(() => {
    if (key == null || !doc) {
      setState({ key: null, formId: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ key, formId: null, loading: true, error: null });
    void getFormList({ doc_type: doc.doc_type, doc_name: doc.doc_name, doc_tag: doc.doc_tag })
      .then((res) => {
        if (res.code !== 0) throw new Error(res.message || "表单加载失败");
        if (!cancelled) setState({ key, formId: res.row_list?.[0]?.form_id ?? null, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ key, formId: null, loading: false, error: error instanceof Error ? error.message : "表单加载失败，请重新打开后重试" });
      });
    return () => { cancelled = true; };
  }, [key]);
  return state.key === key ? state : { key, formId: null, loading: key != null, error: null };
};
