import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Collapse,
  DatePicker,
  Empty,
  List,
  Listy,
  message,
  Spin,
  Splitter,
  Tag,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import type { EmrRow } from "@/types/emr";
import EmrContent from "../../EmrContent";
import AssessmentTimeline from "../../AssessmentTimeline";
import EmrHistory from "./EmrHistory";
import { print, printPreview } from "../../PrintList";
import {
  formatCreateTime,
  isCommitted,
  useEmrDocument,
} from "../hooks/useEmrDocument";
import { useEmrCreateFlow } from "../hooks/useEmrCreateFlow";
import { PROGRESS_NOTE_DOC_TYPE, type EmrListWorkspaceProps } from "../types";
import EmrContentFrame from "./EmrContentFrame";
import EmrCreateModal from "./EmrCreateModal";
import PrintToolbar from "./PrintToolbar";

type DateRange = [Dayjs | null, Dayjs | null] | null;

const defaultDateRange = (): DateRange => [
  dayjs().subtract(1, "month"),
  dayjs(),
];

const getEmrTime = (row: EmrRow) => row.emr_time || row.input_time;

const getCreatorName = (row: EmrRow) => row.user_name_list?.trim() || "—";

const EMR_CONTENT_HIGHLIGHT_MS = 1500;
const DEFAULT_EXCLUDE_LINK_DOC_TYPES = [
  "病程记录",
  "患者评估",
  "知情同意书",
];
const DEFAULT_ASSESS_DOC_TYPE = "患者评估";
const ASSESSMENT_TREND_WIDTH = "20%";
const ASSESSMENT_CONTENT_HEIGHT = "66.67%";

const EMR_GROUP_KEY_SEP = "\0";

const getEmrGroupKey = (row: EmrRow) =>
  `${row.doc_type ?? ""}${EMR_GROUP_KEY_SEP}${row.doc_name ?? ""}`;

type ListItemSegment = { type: "item"; row: EmrRow };
type ListGroupSegment = {
  type: "group";
  key: string;
  rows: EmrRow[];
  title: string;
};
type ListSegment = ListItemSegment | ListGroupSegment;

const buildListSegments = (
  rows: EmrRow[],
  getGroupTitle: (sample: EmrRow, count: number) => string,
): ListSegment[] => {
  const buckets = new Map<string, EmrRow[]>();
  for (const row of rows) {
    const key = getEmrGroupKey(row);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(row);
    else buckets.set(key, [row]);
  }

  const emittedGroups = new Set<string>();
  const segments: ListSegment[] = [];
  for (const row of rows) {
    const key = getEmrGroupKey(row);
    const groupRows = buckets.get(key)!;
    if (groupRows.length >= 2) {
      if (!emittedGroups.has(key)) {
        emittedGroups.add(key);
        segments.push({
          type: "group",
          key,
          rows: groupRows,
          title: getGroupTitle(groupRows[0], groupRows.length),
        });
      }
    } else {
      segments.push({ type: "item", row });
    }
  }
  return segments;
};

/**
 * 左右布局：左侧列表 + 头部筛选；右侧详情表单。
 */
const EmrListLayout = ({
  visit,
  listFilter,
  label,
  names = [],
  allRecords = false,
  filterByDocName = false,
  docType,
  docName,
  progressNote = false,
  assessment,
  workType,
  createModal,
  draftLink,
  excludeLinkDocTypes = DEFAULT_EXCLUDE_LINK_DOC_TYPES,
  onBeforeCreate,
  progressNotePrint,
  listUi,
  emptyVisitDescription = "请先选择住院患者",
  className,
  onPrinted,
}: EmrListWorkspaceProps) => {
  const useListy = listUi?.useListy ?? true;
  const showAscendingToggle = listUi?.showAscendingToggle ?? true;
  const defaultAscending = listUi?.defaultAscending ?? true;

  const isProgressNote =
    progressNote || (!allRecords && docType === PROGRESS_NOTE_DOC_TYPE);
  const effectiveDocType = docType ?? listFilter.doc_type;
  const isAssessment =
    assessment != null ||
    (!allRecords && effectiveDocType === DEFAULT_ASSESS_DOC_TYPE);
  const assessDocType = assessment?.docType ?? DEFAULT_ASSESS_DOC_TYPE;
  const assessWorkType = assessment?.workType ?? "[DOCTOR]";

  const effectiveListFilter = allRecords
    ? {}
    : filterByDocName && docType && docName
      ? { doc_type: docType, doc_name: docName }
      : listFilter;

  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [filterByDate, setFilterByDate] = useState(true);
  const [filterDoctor, setFilterDoctor] = useState(false);
  const [filterNurse, setFilterNurse] = useState(false);
  const [ascending, setAscending] = useState(defaultAscending);
  const [listGrouping, setListGrouping] = useState(
    () => listUi?.groupByDocTypeAndName ?? true,
  );
  const [activeGroupKeys, setActiveGroupKeys] = useState<string[]>([]);

  const listWorkType = useMemo(() => {
    if (filterDoctor && filterNurse) return undefined;
    if (filterDoctor) return "[DOCTOR]";
    if (filterNurse) return "[NURSE]";
    return undefined;
  }, [filterDoctor, filterNurse]);

  const listEmrStart = useMemo(() => {
    if (!filterByDate || !dateRange?.[0]) return undefined;
    return dateRange[0].startOf("day").format("YYYY-MM-DD HH:mm:ss");
  }, [dateRange, filterByDate]);

  const listEmrEnd = useMemo(() => {
    if (!filterByDate || !dateRange?.[1]) return undefined;
    return dateRange[1].endOf("day").format("YYYY-MM-DD HH:mm:ss");
  }, [dateRange, filterByDate]);
  const [selectedEmrId, setSelectedEmrId] = useState<number | null>(null);
  const [highlightedEmrId, setHighlightedEmrId] = useState<number | null>(
    null,
  );
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 病程记录保存后列表尚未刷新时，避免 selection effect 误选第一条 */
  const pendingProgressSelectIdRef = useRef<number | null>(null);

  const {
    createOpen,
    openCreate,
    closeCreate,
    draftLoading,
    draft,
    clearDraft,
    handleConfirm,
  } = useEmrCreateFlow();

  const {
    visitId,
    babyId,
    emrList,
    emr,
    isEmrPrinted,
    selectEmr,
    clearEmr,
    loadEmr,
    handleRefresh,
    refreshLoading,
    loading,
    refreshKey,
  } = useEmrDocument({
    visit,
    listFilter: effectiveListFilter,
    mode: "list",
    listWorkType,
    listEmrStart,
    listEmrEnd,
  });

  const filteredList = useMemo(() => {
    const sortAsc = showAscendingToggle ? ascending : defaultAscending;
    return [...emrList].sort((a, b) => {
      const ta = getEmrTime(a);
      const tb = getEmrTime(b);
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      const diff = dayjs(ta).valueOf() - dayjs(tb).valueOf();
      return sortAsc ? diff : -diff;
    });
  }, [
    ascending,
    defaultAscending,
    emrList,
    filterDoctor,
    filterNurse,
    showAscendingToggle,
  ]);

  const listSegments = useMemo((): ListSegment[] | null => {
    if (!listGrouping) return null;
    const resolveDocDisplayName = (row: EmrRow) =>
      names.find((n) => n.doc_name === row.doc_name)?.label ??
      row.doc_name ??
      label;
    return buildListSegments(filteredList, (sample, count) => {
      const name = resolveDocDisplayName(sample);
      const title =
        allRecords && sample.doc_type
          ? `${sample.doc_type} / ${name}`
          : name;
      return `${title} (${count})`;
    });
  }, [allRecords, filteredList, listGrouping, label, names]);

  const visibleSelected =
    emr?.emr_id != null &&
    filteredList.some((row) => row.emr_id === emr.emr_id);

  const locateEmrContent = useCallback((emrId: number) => {
    const el = document.getElementById(`emr-content-${emrId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedEmrId(emrId);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedEmrId(null);
      highlightTimerRef.current = null;
    }, EMR_CONTENT_HIGHLIGHT_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  /** 切换患者时，清除暂存的新建病程记录 id */
  useEffect(() => {
    pendingProgressSelectIdRef.current = null;
  }, [visitId]);

  useEffect(() => {
    if (!listGrouping || listSegments == null) return;
    const activeEmrId = isProgressNote ? selectedEmrId : (emr?.emr_id ?? null);
    if (activeEmrId == null) return;
    for (const seg of listSegments) {
      if (
        seg.type === "group" &&
        seg.rows.some((row) => row.emr_id === activeEmrId)
      ) {
        setActiveGroupKeys((prev) =>
          prev.includes(seg.key) ? prev : [...prev, seg.key],
        );
        break;
      }
    }
  }, [
    emr?.emr_id,
    listGrouping,
    isProgressNote,
    listSegments,
    selectedEmrId,
  ]);

  useEffect(() => {
    if (draft == null) return;
    clearEmr();
    setSelectedEmrId(null);
    setHighlightedEmrId(null);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    const frame = requestAnimationFrame(() => {
      document
        .getElementById("emr-content-draft")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [clearEmr, draft]);

  useEffect(() => {
    if (draft != null) return;

    const first = filteredList[0];
    const firstId = first?.emr_id ?? null;

    // 如果是 病程记录，需要检查是否存在暂存的新建病程记录，如果存在，则选中该病程记录，否则选中第一条
    if (isProgressNote) {
      const pendingId = pendingProgressSelectIdRef.current;
      if (pendingId != null) {
        const pendingVisible = filteredList.some(
          (row) => row.emr_id === pendingId,
        );
        if (pendingVisible) {
          pendingProgressSelectIdRef.current = null;
          setSelectedEmrId(pendingId);
          const frame = requestAnimationFrame(() =>
            locateEmrContent(pendingId),
          );
          return () => cancelAnimationFrame(frame);
        }
        setSelectedEmrId(pendingId);
        return;
      }

      const stillVisible =
        selectedEmrId != null &&
        filteredList.some((row) => row.emr_id === selectedEmrId);
      if (stillVisible) return;
      setSelectedEmrId(firstId);
      if (firstId == null) return;
      const frame = requestAnimationFrame(() => locateEmrContent(firstId));
      return () => cancelAnimationFrame(frame);
    }

    if (visibleSelected) return;
    if (first) void selectEmr(first);
  }, [
    draft,
    filteredList,
    isProgressNote,
    locateEmrContent,
    selectEmr,
    selectedEmrId,
    visibleSelected,
  ]);

  const handleSelectEmr = (row: EmrRow) => {
    clearDraft();
    if (isProgressNote) {
      if (row.emr_id == null) return;
      setSelectedEmrId(row.emr_id);
      locateEmrContent(row.emr_id);
      return;
    }
    void selectEmr(row);
  };

  const handleOpenCreate = () => {
    if (onBeforeCreate) {
      const err = onBeforeCreate();
      if (err) {
        message.warning(err);
        return;
      }
    }
    if (visitId == null) {
      message.error("未选择就诊");
      return;
    }
    openCreate();
  };

  const refreshContent = useCallback(() => {
    void handleRefresh();
  }, [handleRefresh]);

  const handleDraftSaved = useCallback(
    (emrId: number) => {
      const createdId = emrId > 0 ? emrId : undefined;
      clearDraft();
      if (createdId != null) {
        // 如果是 病程记录 新建完，把新建的病程记录 id 暂存起来，等列表刷新后再选中，避免新建完 病程记录 后仍然选中第一条数
        if (isProgressNote) {
          pendingProgressSelectIdRef.current = createdId;
        }
        setSelectedEmrId(createdId);
      }
      void loadEmr({
        silent: true,
        selectEmrId: createdId,
        selectLatest: createdId == null,
      });
    },
    [clearDraft, isProgressNote, loadEmr],
  );

  const handlePickForm = useCallback(
    async (selection: Parameters<typeof handleConfirm>[0]) => {
      if (visitId == null) {
        message.error("未选择就诊");
        return;
      }
      await handleConfirm(selection);
    },
    [handleConfirm, visitId],
  );

  const draftContent =
    draft != null && visitId != null ? (
      <EmrContent
        key={`draft-${draft.key}`}
        visit_id={visitId}
        baby_id={babyId ?? undefined}
        encounter_id={visit.encounterId ?? undefined}
        form_id={draft.form_id}
        form_version={draft.form_version}
        form_values={draft.form_values}
        emr_title={draft.emr_title ?? label}
        link_name={draftLink?.link_name}
        link_value={draftLink?.link_value}
        link_data={draftLink?.link_data}
        link_tag={draftLink?.link_tag}
        link_ext={draftLink?.link_ext}
        onSaved={handleDraftSaved}
        onCommitted={handleDraftSaved}
        onCommitCancelled={handleDraftSaved}
        onDeleted={() => {
          clearDraft();
          refreshContent();
        }}
        onPrinted={onPrinted}
      />
    ) : null;

  const emptyText =
    emrList.length === 0
      ? "暂无病历，请点击新增"
      : filteredList.length === 0
        ? "当前时间范围内暂无病历"
        : "请选择病历";

  const getRowLabel = (row: EmrRow) =>
    row.emr_title ??
    names.find((n) => n.doc_name === row.doc_name)?.label ??
    row.doc_name ??
    label;

  const defaultProgressNotePrintUrl = () => {
    if (visitId == null) return "";
    return `doc/visit3/${getSessionId()}?doc_type=病程记录&doc_name=病程记录&visit_id=${visitId}&baby_id=${babyId || 0}`;
  };

  const handlePrint = async () => {
    const url = progressNotePrint?.buildPrintUrl({
      visitId: visitId!,
      babyId,
    }) ?? defaultProgressNotePrintUrl();
    if (!url) return;
    await print(url);
  };

  const handlePrintPreview = () => {
    const url = progressNotePrint?.buildPrintUrl({
      visitId: visitId!,
      babyId,
    }) ?? defaultProgressNotePrintUrl();
    if (!url) return;
    printPreview(url);
  };

  const createModalDocType = createModal?.docType ?? (allRecords ? undefined : docType);
  const excludeLinkSet = new Set(excludeLinkDocTypes);
  const shouldExcludeLink = Boolean(
    createModal?.excludeLink ??
    (docType && excludeLinkSet.has(docType)),
  );

  const renderListItem = (row: EmrRow) => {
    const active =
      draft == null &&
      row.emr_id != null &&
      row.emr_id === (isProgressNote ? selectedEmrId : emr?.emr_id);
    const rowCommitted = isCommitted(row.emr_status);
    const assessColor = row.assess_color?.trim() || "blue";
    const hasAssessScore =
      row.assess_score != null || row.assess_total != null;
    const assessResult = row.assess_result?.trim() || "";

    const inner = (
      <>
        <div className="flex items-center justify-between gap-2">
          <span
            className="whitespace-nowrap text-(length:--app-theme-font-default) text-(--app-theme-text)"
            title={getRowLabel(row)}
          >
            {getRowLabel(row)}
          </span>
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap text-(length:--app-theme-font-sm) text-(--app-theme-text-secondary)">
          <Tag
            color={rowCommitted ? "success" : "default"}
            className="me-0! shrink-0"
          >
            {rowCommitted ? "已提交" : "未提交"}
          </Tag>
          {isEmrPrinted(row.emr_id) ? (
            <Tag color="success" className="me-0! shrink-0">
              已打印
            </Tag>
          ) : null}
          {row.doc_type === assessDocType && hasAssessScore ? (
            <Tag color={assessColor} className="me-0! shrink-0">
              {row.assess_score ?? "未知"}/{row.assess_total ?? "未知"}
              {assessResult ? ` ${assessResult}` : ""}
            </Tag>
          ) : null}
          <span
            className="whitespace-nowrap"
            title={
              formatCreateTime(getEmrTime(row)) + " " + getCreatorName(row)
            }
          >
            {formatCreateTime(getEmrTime(row))} {getCreatorName(row)}
          </span>
        </div>
      </>
    );

    if (useListy) {
      return (
        <div
          onClick={() => handleSelectEmr(row)}
          className={[
            "cursor-pointer px-2 py-2",
            active
              ? "bg-(--app-theme-primary-bg)!"
              : "hover:bg-(--app-theme-bg-fill-alter)!",
          ].join(" ")}
        >
          <div className="flex w-max min-w-full flex-col gap-1">{inner}</div>
        </div>
      );
    }

    return (
      <List.Item
        key={row.emr_id}
        onClick={() => handleSelectEmr(row)}
        className={[
          "cursor-pointer! gap-2 px-2!",
          active
            ? "bg-(--app-theme-primary-bg)!"
            : "hover:bg-(--app-theme-bg-fill-alter)!",
        ].join(" ")}
      >
        <div className="min-w-0">{inner}</div>
      </List.Item>
    );
  };

  const renderGroupRows = (rows: EmrRow[]) =>
    useListy ? (
      <Listy<EmrRow>
        items={rows}
        className="inline-block min-w-full"
        rowKey={(row) => String(row.emr_id ?? "")}
        styles={{ item: { padding: 0 } }}
        itemRender={(row) => renderListItem(row)}
      />
    ) : (
      <List
        size="small"
        dataSource={rows}
        renderItem={(row) => renderListItem(row)}
      />
    );

  const renderSidebarList = () => {
    if (listGrouping && listSegments != null) {
      return (
        <div className={useListy ? "inline-block min-w-full" : undefined}>
          {listSegments.map((seg) =>
            seg.type === "item" ? (
              <div key={String(seg.row.emr_id ?? getEmrGroupKey(seg.row))}>
                {renderListItem(seg.row)}
              </div>
            ) : (
              <Collapse
                key={seg.key}
                ghost
                bordered={false}
                styles={{ body: { padding: 0 }, header: { padding: 8 } }}
                activeKey={activeGroupKeys.includes(seg.key) ? [seg.key] : []}
                onChange={(keys) => {
                  const open = (Array.isArray(keys) ? keys : [keys]).includes(
                    seg.key,
                  );
                  setActiveGroupKeys((prev) =>
                    open
                      ? prev.includes(seg.key)
                        ? prev
                        : [...prev, seg.key]
                      : prev.filter((k) => k !== seg.key),
                  );
                }}
                items={[
                  {
                    key: seg.key,
                    label: (
                      <span className="text-(length:--app-theme-font-default) font-medium text-(--app-theme-text)">
                        {seg.title}
                      </span>
                    ),
                    children: renderGroupRows(seg.rows),
                  },
                ]}
              />
            ),
          )}
        </div>
      );
    }

    if (useListy) {
      return (
        <Listy<EmrRow>
          items={filteredList}
          className="inline-block min-w-full"
          rowKey={(row) => String(row.emr_id ?? "")}
          styles={{ item: { padding: 0 } }}
          itemRender={(row) => renderListItem(row)}
        />
      );
    }

    return (
      <List
        size="small"
        dataSource={filteredList}
        locale={{
          emptyText: (
            <Empty
              description={
                emrList.length === 0 ? "暂无病历" : "无匹配记录"
              }
            />
          ),
        }}
        renderItem={(row) => renderListItem(row)}
      />
    );
  };

  if (visitId == null) {
    return (
      <div className="flex h-full items-center justify-center p-2">
        <Empty description={emptyVisitDescription} />
      </div>
    );
  }

  const showAssessmentAside =
    isAssessment || (emr != null && emr.doc_type === assessDocType);

  const assessmentTimelineProps = {
    visitId,
    docName: emr?.doc_name,
    docType: assessDocType,
    workType: assessWorkType,
    refreshKey,
  };

  const mainContentPanel = (
    <>
      {isProgressNote ? (
        <div className="h-full overflow-y-auto p-1">
          {filteredList.length === 0 && !draftContent ? (
            <div className="flex h-full items-center justify-center">
              <Empty description={emptyText} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <PrintToolbar
                label={progressNotePrint?.label ?? "打印病程记录"}
                onPrint={handlePrint}
                onPrintPreview={handlePrintPreview}
              />
              {draftContent ? (
                <div
                  id="emr-content-draft"
                  className="emr-content-item scroll-mt-2 rounded border-2 border-(--app-theme-primary) bg-(--app-theme-bg-container) p-2"
                >
                  {draftContent}
                </div>
              ) : null}
              {filteredList.map((row) =>
                row.emr_id == null ? null : (
                  <div
                    key={row.emr_id}
                    id={`emr-content-${row.emr_id}`}
                    className={[
                      "emr-content-item scroll-mt-2 rounded border-2 bg-(--app-theme-bg-container) p-2 transition-colors duration-300",
                      draft == null && highlightedEmrId === row.emr_id
                        ? "emr-content-item-active border-(--app-theme-primary)"
                        : "border-(--app-theme-border)",
                    ].join(" ")}
                  >
                    <EmrContent
                      emr_id={row.emr_id}
                      onSaved={refreshContent}
                      onCommitted={refreshContent}
                      onCommitCancelled={refreshContent}
                      onDeleted={refreshContent}
                      onPrinted={onPrinted}
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ) : draftContent ? (
        <EmrContentFrame
          grow={draft?.doc_type === PROGRESS_NOTE_DOC_TYPE}
          className="h-full"
        >
          {draftContent}
        </EmrContentFrame>
      ) : visibleSelected && emr?.emr_id != null ? (
        // 由于在 所有病历 菜单下，docType 为空，所以没法区分出是否是 病程记录 ， 所以这边用 AI 提供的一个 EmrContentFrame 组件来包裹，就可以使得 病程记录 和 非病程记录 的病历内容都可以滚动不被截断，并且 非病程记录 的病历滚动条在组件内部
        <EmrContentFrame
          grow={emr.doc_type === PROGRESS_NOTE_DOC_TYPE}
          className="h-full"
        >
          <EmrContent
            key={emr.emr_id}
            emr_id={emr.emr_id}
            onSaved={refreshContent}
            onCommitted={refreshContent}
            onCommitCancelled={refreshContent}
            onDeleted={refreshContent}
            onPrinted={onPrinted}
          />
        </EmrContentFrame>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Empty description={emptyText} />
        </div>
      )}
    </>
  );

  const assessmentHistoryPanel = (
    <div className="min-h-0 flex-1 overflow-auto p-2">
      <EmrHistory
        visitId={visitId}
        docType={assessDocType}
        docName={emr?.doc_name ?? draft?.doc_name}
        excludeEmrId={emr?.emr_id}
        refreshKey={refreshKey}
      />
    </div>
  );

  const assessmentTrendPanel = (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-(--app-theme-border) bg-(--app-theme-bg-container)">
      <div className="shrink-0 border-b border-(--app-theme-border) px-2 py-1.5 text-(length:--app-theme-font-sm) font-medium text-(--app-theme-text)">
        当前趋势
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <AssessmentTimeline {...assessmentTimelineProps} />
      </div>
    </aside>
  );

  const assessmentCenterPanel = (
    <Splitter layout="vertical" className="h-full min-h-0">
      <Splitter.Panel
        defaultSize={ASSESSMENT_CONTENT_HEIGHT}
        className="min-h-0 overflow-hidden"
      >
        {mainContentPanel}
      </Splitter.Panel>
      <Splitter.Panel className="min-h-0 overflow-hidden mt-2">
        {assessmentHistoryPanel}
      </Splitter.Panel>
    </Splitter>
  );

  return (
    <>
      <div
        className={["flex h-full min-h-0 gap-2 p-2", className]
          .filter(Boolean)
          .join(" ")}
      >
        <aside className="flex w-70 shrink-0 flex-col overflow-hidden rounded border border-(--app-theme-border) bg-(--app-theme-bg-container)">
          <div className="flex shrink-0 flex-col gap-2 border-b border-(--app-theme-border) p-2">
            <div className="flex min-w-0 items-center gap-1">
              {/* <Checkbox
                checked={filterByDate}
                onChange={(e) => setFilterByDate(e.target.checked)}
              /> */}
              <DatePicker.RangePicker
                size="small"
                className="min-w-0 flex-1"
                value={dateRange}
                onChange={(values) => setDateRange(values)}
                disabled={!filterByDate}
                allowClear
                placeholder={["开始日期", "结束日期"]}
              />
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                aria-label="刷新"
                title="刷新"
                onClick={refreshContent}
              />
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                className="shrink-0 px-1!"
                disabled={!allRecords && !docType && !listFilter.doc_type}
                onClick={handleOpenCreate}
              />
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              <Checkbox
                checked={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.checked)}
              >
                医疗
              </Checkbox>
              <Checkbox
                checked={filterNurse}
                onChange={(e) => setFilterNurse(e.target.checked)}
              >
                护理
              </Checkbox>
              {showAscendingToggle ? (
                <Checkbox
                  checked={ascending}
                  onChange={(e) => setAscending(e.target.checked)}
                >
                  正序
                </Checkbox>
              ) : null}
              <Checkbox
                checked={listGrouping}
                onChange={(e) => setListGrouping(e.target.checked)}
              >
                分组
              </Checkbox>
            </div>
          </div>

          <div
            className={[
              "min-h-0 flex-1",
              useListy ? "overflow-auto" : "overflow-y-auto",
            ].join(" ")}
          >
            {refreshLoading || loading ? (
              <Spin className="w-full" />
            ) : filteredList.length === 0 ? (
              <Empty
                description={emrList.length === 0 ? "暂无病历" : "无匹配记录"}
              />
            ) : (
              renderSidebarList()
            )}
          </div>
        </aside>

        {showAssessmentAside ? (
          <Splitter className="min-h-0 min-w-0 flex-1">
            <Splitter.Panel className="min-h-0 overflow-hidden">
              {assessmentCenterPanel}
            </Splitter.Panel>
            <Splitter.Panel
              defaultSize={ASSESSMENT_TREND_WIDTH}
              className="min-h-0 overflow-hidden"
            >
              {assessmentTrendPanel}
            </Splitter.Panel>
          </Splitter>
        ) : (
          <div className="min-h-0 min-w-0 flex-1">{mainContentPanel}</div>
        )}
      </div>

      <EmrCreateModal
        open={createOpen}
        confirmLoading={draftLoading}
        visit={visit}
        workType={workType}
        docType={createModalDocType}
        docName={createModal?.docName}
        docTag={createModal?.docTag}
        onlyLink={createModal?.onlyLink}
        excludeLink={shouldExcludeLink}
        onCancel={closeCreate}
        onConfirm={handlePickForm}
      />
    </>
  );
};

export default EmrListLayout;
