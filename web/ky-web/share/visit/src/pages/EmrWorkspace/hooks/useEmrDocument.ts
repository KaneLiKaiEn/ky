import { useCallback, useEffect, useState } from "react";
import { getPrintDocList } from "@/api/doc";
import { getEmrList } from "@/api/emr";
import { getFormList } from "@/api/form";
import type { EmrRow } from "@/types/emr";
import type {
  AutoCreateForm,
  EmrListFilter,
  EmrWorkspaceVisitContext,
  FormElemValue,
} from "../types";

export type UseEmrDocumentOptions = {
  visit: EmrWorkspaceVisitContext;
  listFilter: EmrListFilter;
  mode?: "single" | "list" | "radio";
  /** @deprecated 优先用 EmrCreateModal；保留给仍需自动草稿的场景 */
  draftForm?: AutoCreateForm;
  /** GetEmrList 额外筛选：work_type / emr_start / emr_end */
  listWorkType?: string;
  listEmrStart?: string;
  listEmrEnd?: string;
  /** 宿主就诊信息未就绪时暂停加载。默认启用。 */
  enabled?: boolean;
  /** 首次选中时优先的文档类型；不影响列表范围。 */
  preferredDocTypes?: readonly string[];
};

/**
 * 列表刷新后要打开的病历。
 * 要求最新一条时直接取列表末尾；否则按指定 ID、当前选中、优先文档类型、列表第一条依次匹配。
 * 指定 ID 或当前选中在新列表里不存在时，继续尝试下一级。
 */
const pickListEmr = (
  list: EmrRow[],
  options: {
    selectLatest?: boolean;
    selectEmrId?: number | null;
    currentEmrId?: number | null;
    preferredDocTypes?: readonly string[];
  },
): EmrRow | undefined => {
  if (options.selectLatest) return list[list.length - 1];

  if (options.selectEmrId != null) {
    const specified = list.find((row) => row.emr_id === options.selectEmrId);
    if (specified) return specified;
  }

  if (options.currentEmrId != null) {
    const current = list.find((row) => row.emr_id === options.currentEmrId);
    if (current) return current;
  }

  for (const docType of options.preferredDocTypes ?? []) {
    const preferred = list.find((row) => row.doc_type === docType);
    if (preferred) return preferred;
  }

  return list[0];
};

/** 从 listFilter 提取关联字段（仅 link_value 有效时返回） */
const pickLinkFields = (filter: EmrListFilter) => {
  if (filter.link_name == null || filter.link_value == null) return {};
  return {
    link_name: filter.link_name,
    link_value: filter.link_value,
  };
};

const loadPrintedEmrIds = async (visitId: number, list: EmrRow[]) => {
  const emrIds = new Set(
    list
      .map((item) => item.emr_id)
      .filter((id): id is number => id != null),
  );
  if (emrIds.size === 0) return new Set<number>();

  try {
    const res = await getPrintDocList({ visit_id: visitId });
    if (res.code !== 0) return new Set<number>();

    const printedIds = new Set<number>();
    for (const row of res.row_list ?? []) {
      if (row.owner_id != null && emrIds.has(row.owner_id)) {
        printedIds.add(row.owner_id);
      }
    }
    return printedIds;
  } catch {
    return new Set<number>();
  }
};

export type { FormElemValue };

/**
 * 病历列表 / 草稿定位。
 * 创建、保存、提交、取消提交、删除、获取属性由 EmrContent 内部处理。
 */
export const useEmrDocument = (options: UseEmrDocumentOptions) => {
  const {
    mode = "single",
    draftForm,
    visit,
    listFilter,
    listWorkType,
    listEmrStart,
    listEmrEnd,
    enabled = true,
    preferredDocTypes,
  } = options;
  const filterDocType = listFilter.doc_type;
  const filterDocName = listFilter.doc_name;
  const filterDocTag = listFilter.doc_tag;
  const filterLinkName = listFilter.link_name;
  const filterLinkValue = listFilter.link_value;
  const linkFields = pickLinkFields(listFilter);

  const visitId = visit.visitId ?? undefined;
  const patientId = visit.patientId ?? undefined;
  const babyId = visit.babyId ?? undefined;
  const encounterId = visit.encounterId ?? undefined;

  const [emrList, setEmrList] = useState<EmrRow[]>([]);
  const [printedEmrIds, setPrintedEmrIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [emr, setEmr] = useState<EmrRow | null>(null);
  const [draftFormId, setDraftFormId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const clearDetail = useCallback(() => {
    setEmr(null);
    setDraftFormId(null);
  }, []);

  const loadDraftForm = useCallback(
    async (form: AutoCreateForm) => {
      const formRes = await getFormList({
        doc_type: form.doc_type,
        doc_name: form.doc_name,
        doc_tag: form.doc_tag,
      });
      const f = formRes.code === 0 ? formRes.row_list?.[0] : undefined;
      if (f?.form_id == null) {
        clearDetail();
        return;
      }
      setEmr(null);
      setDraftFormId(f.form_id);
    },
    [clearDetail],
  );

  const loadEmr = useCallback(
    async (loadOptions?: {
      silent?: boolean;
      selectEmrId?: number | null;
      selectLatest?: boolean;
    }) => {
      if (!enabled || visitId == null) {
        setLoading(false);
        setRefreshLoading(false);
        setEmrList([]);
        setPrintedEmrIds(new Set());
        clearDetail();
        return;
      }

      if (filterLinkName != null && filterLinkValue == null) {
        setLoading(false);
        setRefreshLoading(false);
        setEmrList([]);
        setPrintedEmrIds(new Set());
        clearDetail();
        return;
      }

      const setBusy = loadOptions?.silent ? setRefreshLoading : setLoading;
      setLoading(!loadOptions?.silent);
      setRefreshLoading(Boolean(loadOptions?.silent));
      try {
        const res = await getEmrList({
          visit_id: visitId,
          baby_id: babyId,
          encounter_id: encounterId,
          doc_type: filterDocType,
          doc_name: filterDocName,
          doc_tag: filterDocTag,
          work_type: listWorkType,
          emr_start: listEmrStart,
          emr_end: listEmrEnd,
          ...linkFields,
        });

        const list = res.code === 0 ? (res.row_list ?? []) : [];
        setEmrList(list);

        if (mode === "list") {
          const printed = await loadPrintedEmrIds(visitId, list);
          setPrintedEmrIds(printed);

          const target = pickListEmr(list, {
            selectLatest: loadOptions?.selectLatest,
            selectEmrId: loadOptions?.selectEmrId,
            currentEmrId: emr?.emr_id,
            preferredDocTypes,
          });

          if (target?.emr_id != null) {
            setDraftFormId(null);
            setEmr(target);
          } else {
            clearDetail();
          }
          return;
        }

        const first = list[0];
        if (first?.emr_id != null) {
          setDraftFormId(null);
          setEmr(first);
          return;
        }

        if (draftForm) {
          await loadDraftForm(draftForm);
        } else {
          clearDetail();
        }
      } catch {
        if (!loadOptions?.silent) {
          setEmrList([]);
          setPrintedEmrIds(new Set());
          clearDetail();
        }
      } finally {
        setBusy(false);
      }
    },
    [
      clearDetail,
      emr,
      enabled,
      preferredDocTypes,
      draftForm,
      emr?.emr_id,
      filterDocName,
      filterDocTag,
      filterDocType,
      filterLinkName,
      filterLinkValue,
      linkFields,
      listEmrEnd,
      listEmrStart,
      listWorkType,
      loadDraftForm,
      mode,
      visitId,
      babyId,
      encounterId,
    ],
  );

  useEffect(() => {
    void loadEmr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visitId,
    babyId,
    enabled,
    filterDocType,
    filterDocName,
    filterDocTag,
    filterLinkName,
    filterLinkValue,
    listWorkType,
    listEmrStart,
    listEmrEnd,
    mode,
  ]);

  const selectEmr = useCallback(async (row: EmrRow) => {
    if (row.emr_id == null) return;
    setDraftFormId(null);
    setEmr(row);
  }, []);

  const handleRefresh = async () => {
    await loadEmr({ silent: true });
    setRefreshKey((prev) => prev + 1);
  };

  const formId = emr?.form_id ?? draftFormId ?? undefined;
  const hasEmr = visitId != null && emr?.emr_id != null;
  const hasForm = visitId != null && formId != null;

  const isEmrPrinted = useCallback(
    (emrId?: number | null) => emrId != null && printedEmrIds.has(emrId),
    [printedEmrIds],
  );

  return {
    visitId,
    patientId,
    babyId,
    emrList,
    isEmrPrinted,
    emr,
    formId,
    draftFormId,
    hasEmr,
    hasForm,
    loading,
    refreshLoading,
    refreshKey,
    selectEmr,
    clearEmr: clearDetail,
    loadEmr,
    loadDraftForm,
    handleRefresh,
  };
};

export { formatCreateTime, isCommitted } from "../utils/emrFormat";
