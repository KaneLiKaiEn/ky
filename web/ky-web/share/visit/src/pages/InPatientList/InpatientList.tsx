import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  forwardRef,
  Fragment,
} from "react";
import { Button, Empty, Input, Listy, Progress, Select, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getSessionInfo } from "comm/session";
import { eventBus } from "../../utils/eventBus";
import { INPATIENT_LIST_REFRESH } from "./events";
import { retrieveDict2ItemList } from "@/api/sys";
import type { Dict2ItemRow } from "@/types/sys";
import VisitItem, { VisitItemRow } from "../VisitItem";
import {
  fetchDischargeList,
  fetchDischargeSearchList,
  fetchInPatientList,
  fetchTransferDeptList,
} from "./fetch";
import type {
  GetDischargeListReq,
  GetIpListReq,
  GetTransferDeptList2Req,
  InPatientListProps,
  VisitIpRow,
  VisitRow,
} from "./type";
import { InPatientListRef } from ".";
import {
  applyInPatientListSort,
  buildIpListFromVisitItems,
  getInPatientListSortDictCode,
  getSortItemSelectValue,
  pickDefaultSortItem,
  sortDict2Items,
} from "./inpatientListSort";
import {
  filterVisitItemsByKeyword,
  filterVisitListByKeyword,
  listDatesInclusive,
} from "./inpatientListSearch";

type DischargeSearchProgress = {
  current: number;
  total: number;
  date: string;
};

/** 出院检索按天轮询时的进度条 */
const DischargeSearchProgressBar = ({
  progress,
  onAbort,
}: {
  progress: DischargeSearchProgress | null;
  onAbort: () => void;
}) => {
  const current = progress?.current ?? 0;
  const total = progress?.total ?? 0;
  const percent =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="shrink-0 bg-[#f3f5f8] px-2.5 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 text-[13px] leading-5 text-(--app-theme-text)">
          正在轮询请求数据，请稍后...
        </span>
        <Button
          type="primary"
          danger
          size="small"
          className="shrink-0"
          icon={<span className="inline-block size-2 bg-current" />}
          onClick={onAbort}
        >
          中止
        </Button>
      </div>
      <Progress
        className="mb-1! block"
        percent={percent}
        showInfo={false}
        strokeColor="#1677ff"
        size="small"
      />
      <div className="text-xs leading-5 text-(--app-theme-text-secondary)">
        进度: {current} / {total} 天
        {progress?.date ? ` (当前: ${progress.date})` : ""}
      </div>
    </div>
  );
};

export type { InPatientListProps, ListMode, ListScope } from "./type";

type ListFetchResult = { visit_list: VisitRow[]; ip_list: VisitIpRow[] };

/** 按 scope 补充 user_id / group_id（我的 / 医疗组 / 全科） */
const applyScopeFilter = (
  params: { user_id?: number; group_id?: number },
  scope: InPatientListProps["scope"],
  user_id: InPatientListProps["user_id"],
  group_id: InPatientListProps["group_id"],
) => {
  if (scope === "mine" && user_id != null) {
    params.user_id = user_id;
  } else if (scope === "group" && group_id != null) {
    params.group_id = group_id;
  }
};

/** 组装在院 GetIpList 请求参数 */
const buildIpListParams = ({
  org_id,
  dept_id,
  ward_id,
  scope,
  user_id,
  group_id,
  exclude_preadmission,
  column_visit,
  column_ip,
}: Pick<
  InPatientListProps,
  | "org_id"
  | "dept_id"
  | "ward_id"
  | "scope"
  | "user_id"
  | "group_id"
  | "exclude_preadmission"
  | "column_visit"
  | "column_ip"
>): GetIpListReq => {
  const params: GetIpListReq = {
    org_id,
    dept_id,
    ward_id,
    // 默认传 true
    exclude_preadmission: exclude_preadmission ?? true,
    column_visit,
    column_ip,
  };
  applyScopeFilter(params, scope, user_id, group_id);
  return params;
};

/** 组装出院 GetDischargeList 请求参数 */
const buildDischargeListParams = ({
  dept_id,
  ward_id,
  scope,
  user_id,
  group_id,
  visit_start,
  visit_end,
  column_visit,
  column_ip,
}: Pick<
  InPatientListProps,
  | "dept_id"
  | "ward_id"
  | "scope"
  | "user_id"
  | "group_id"
  | "visit_start"
  | "visit_end"
  | "column_visit"
  | "column_ip"
>): GetDischargeListReq => {
  const params: GetDischargeListReq = {
    dept_id,
    ward_id,
    visit_start,
    visit_end,
    column_visit,
    column_ip,
  };
  applyScopeFilter(params, scope, user_id, group_id);
  return params;
};

/** 组装转科 GetTransferDeptList2 请求参数（医生站 dept → from_dept_id；护士站 ward → from_ward_id） */
const buildTransferListParams = ({
  dept_id,
  ward_id,
  transfer_start,
  transfer_end,
  transfer_status = "RECV",
}: Pick<
  InPatientListProps,
  "dept_id" | "ward_id" | "transfer_start" | "transfer_end" | "transfer_status"
>): GetTransferDeptList2Req => ({
  from_dept_id: dept_id,
  from_ward_id: ward_id,
  transfer_start,
  transfer_end,
  transfer_status,
});

const InPatientList = forwardRef(
  (
    {
      list,
      mode = "in",
      org_id,
      dept_id,
      ward_id,
      scope,
      user_id,
      group_id,
      visit_start,
      visit_end,
      transfer_start,
      transfer_end,
      transfer_status,
      exclude_preadmission,
      column_visit = "*",
      column_ip = "*",
      loading: loadingProp = false,
      onLoad,
      onSelect,
      activeId,
      collapsed = true,
      workType = "DOCTOR",
      className,
    }: InPatientListProps,
    ref: React.Ref<InPatientListRef>,
  ) => {
    const hasList = list != null;
    const [visitList, setVisitList] = useState<VisitRow[]>([]);
    // 因为 在院、出院 患者列表要用 ip_list 列表的字段来排序，所以这边需要保存 ip_list 列表
    const [ipList, setIpList] = useState<VisitIpRow[]>([]);
    const [fetching, setFetching] = useState(false);
    const [activeItem, setActiveItem] = useState<VisitItemRow | null>(null);
    const [sortOptions, setSortOptions] = useState<Dict2ItemRow[]>([]);
    const [selectedSortValue, setSelectedSortValue] = useState<string>();
    const [sortDictLoading, setSortDictLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    /** 出院检索结果；null 表示未检索，走默认出院列表 */
    const [searchResultList, setSearchResultList] = useState<VisitRow[] | null>(
      null,
    );
    const [searching, setSearching] = useState(false);
    const [searchProgress, setSearchProgress] =
      useState<DischargeSearchProgress | null>(null);
    const dischargeSearchSeqRef = useRef(0);
    const loadSeqRef = useRef(0);
    const onLoadRef = useRef(onLoad);
    onLoadRef.current = onLoad;
    /** 虚拟列表会卸载视口外的行，请求结果必须缓存在列表层，滚回来才不会重新打接口 */
    // const itemCacheRef = useRef(new Map<number, VisitItemRow>());

    const loading = hasList ? loadingProp : fetching;
    const showSearch = mode === "in" || mode === "out";

    // 加载排序字典的依赖
    useEffect(() => {
      let cancelled = false;
      const dictCode = getInPatientListSortDictCode(mode);

      const loadSortDict = async () => {
        setSortDictLoading(true);
        try {
          const res = await retrieveDict2ItemList({ dict_code: dictCode });
          if (cancelled) return;
          const items =
            res.code === 0 ? sortDict2Items(res.row_list ?? []) : [];
          setSortOptions(items);
        } catch {
          if (!cancelled) setSortOptions([]);
        } finally {
          if (!cancelled) setSortDictLoading(false);
        }
      };

      void loadSortDict();
      return () => {
        cancelled = true;
      };
    }, [mode]);

    // 默认选中排序项
    useEffect(() => {
      if (!sortOptions.length) {
        setSelectedSortValue(undefined);
        return;
      }
      const def = pickDefaultSortItem(sortOptions, workType);
      setSelectedSortValue(def ? getSortItemSelectValue(def) : undefined);
    }, [sortOptions, workType]);

    // 获取排序表达式
    const sortExpression = useMemo(() => {
      if (!sortOptions.length || selectedSortValue == null) return "";
      const item = sortOptions.find(
        (row) => getSortItemSelectValue(row) === selectedSortValue,
      );
      return item?.item_value?.trim() ?? "";
    }, [sortOptions, selectedSortValue]);

    const sortConfigRef = useRef({ sortOptions, sortExpression });
    sortConfigRef.current = { sortOptions, sortExpression };

    const reloadList = useCallback(async () => {
      // list 优先：有外部数据时不请求
      if (hasList) {
        setVisitList([]);
        setIpList([]);
        setFetching(false);
        return;
      }

      const hasDept = dept_id != null && dept_id > 0;
      const hasWard = ward_id != null && ward_id > 0;
      if (!hasDept && !hasWard) {
        setVisitList([]);
        setIpList([]);
        setFetching(false);
        return;
      }

      // 出院 / 转科必须带日期范围
      if (mode === "out" && (!visit_start || !visit_end)) {
        setVisitList([]);
        setIpList([]);
        setFetching(false);
        return;
      }
      if (mode === "transfer" && (!transfer_start || !transfer_end)) {
        setVisitList([]);
        setIpList([]);
        setFetching(false);
        return;
      }

      const seq = ++loadSeqRef.current;
      setFetching(true);
      try {
        let result: ListFetchResult;

        if (mode === "out") {
          result = await fetchDischargeList(
            buildDischargeListParams({
              dept_id,
              ward_id,
              scope,
              user_id,
              group_id,
              visit_start,
              visit_end,
              column_visit,
              column_ip,
            }),
          );
        } else if (mode === "transfer") {
          result = await fetchTransferDeptList(
            buildTransferListParams({
              dept_id,
              ward_id,
              transfer_start,
              transfer_end,
              transfer_status,
            }),
          );
        } else {
          result = await fetchInPatientList(
            buildIpListParams({
              org_id,
              dept_id,
              ward_id,
              scope,
              user_id,
              group_id,
              exclude_preadmission,
              column_visit,
              column_ip,
            }),
          );
        }

        if (seq !== loadSeqRef.current) return;
        setVisitList(result.visit_list);
        setIpList(result.ip_list);
        // 排序
        const visit_list = applyInPatientListSort(result.visit_list, {
          ...sortConfigRef.current,
          ipList: result.ip_list,
        });
        onLoadRef.current?.({ ...result, visit_list });
      } catch {
        if (seq === loadSeqRef.current) {
          setVisitList([]);
          setIpList([]);
        }
      } finally {
        if (seq === loadSeqRef.current) setFetching(false);
      }
    }, [
      hasList,
      mode,
      org_id,
      dept_id,
      ward_id,
      scope,
      user_id,
      group_id,
      visit_start,
      visit_end,
      transfer_start,
      transfer_end,
      transfer_status,
      exclude_preadmission,
      column_visit,
      column_ip,
    ]);

    useEffect(() => {
      // itemCacheRef.current.clear();
      dischargeSearchSeqRef.current += 1;
      setSearchKeyword("");
      setSearchResultList(null);
      setSearching(false);
      setSearchProgress(null);
      void reloadList();

      return () => {
        loadSeqRef.current += 1;
      };
    }, [reloadList]);

    useEffect(() => {
      return eventBus.on(INPATIENT_LIST_REFRESH, () => {
        void reloadList();
      });
    }, [reloadList]);

    const handleSelect = (item: VisitItemRow) => {
      setActiveItem(item);
      onSelect(item);
    };

    const runDischargeSearch = async (raw: string) => {
      const keyword = raw.trim();
      if (!keyword) {
        dischargeSearchSeqRef.current += 1;
        setSearchResultList(null);
        setSearching(false);
        setSearchProgress(null);
        return;
      }

      const dates = listDatesInclusive(visit_start, visit_end);
      const seq = ++dischargeSearchSeqRef.current;
      setSearching(true);
      setSearchProgress(
        dates.length
          ? { current: 1, total: dates.length, date: dates[0] }
          : null,
      );
      try {
        const session = await getSessionInfo();
        const isNurse = String(session?.work_type ?? "")
          .toUpperCase()
          .includes("NURSE");
        if (seq !== dischargeSearchSeqRef.current) return;
        const visit_list = await fetchDischargeSearchList({
          retrieve_input: keyword,
          visit_start,
          visit_end,
          isCancelled: () => seq !== dischargeSearchSeqRef.current,
          onProgress: (progress) => {
            if (seq !== dischargeSearchSeqRef.current) return;
            setSearchProgress(progress);
          },
          ...(isNurse
            ? { ward_id_list: ward_id != null ? [ward_id] : undefined }
            : { dept_id_list: dept_id != null ? [dept_id] : undefined }),
        });
        if (seq !== dischargeSearchSeqRef.current) return;
        setSearchResultList(visit_list);
      } catch {
        if (seq !== dischargeSearchSeqRef.current) return;
        setSearchResultList([]);
      } finally {
        if (seq === dischargeSearchSeqRef.current) {
          setSearching(false);
          setSearchProgress(null);
        }
      }
    };

    const handleAbortDischargeSearch = () => {
      dischargeSearchSeqRef.current += 1;
      setSearching(false);
      setSearchProgress(null);
    };

    const handleSearchChange = (value: string) => {
      setSearchKeyword(value);
      if (mode !== "out" || hasList) return;
      if (!value.trim()) {
        dischargeSearchSeqRef.current += 1;
        setSearchResultList(null);
        setSearching(false);
        setSearchProgress(null);
      }
    };

    const handleSearch = (value: string) => {
      if (mode !== "out" || hasList) return;
      void runDischargeSearch(value);
    };

    // 排序在院、出院 患者列表
    const sortedVisitList = useMemo(
      () =>
        applyInPatientListSort(visitList, {
          sortOptions,
          sortExpression,
          ipList,
        }),
      [visitList, ipList, sortOptions, sortExpression],
    );

    // 排序受控 list -- 目前应该没有用上
    const sortedControlledList = useMemo(
      () =>
        applyInPatientListSort(list ?? [], {
          sortOptions,
          sortExpression,
          ipList: buildIpListFromVisitItems(list ?? []),
        }),
      [list, sortOptions, sortExpression],
    );

    const displayVisitList = useMemo(() => {
      if (mode === "out" && !hasList && searchResultList != null) {
        return searchResultList;
      }
      if (mode === "in") {
        return filterVisitListByKeyword(sortedVisitList, ipList, searchKeyword);
      }
      return sortedVisitList;
    }, [
      hasList,
      ipList,
      mode,
      searchKeyword,
      searchResultList,
      sortedVisitList,
    ]);

    const displayControlledList = useMemo(() => {
      if (mode === "in" || mode === "out") {
        return filterVisitItemsByKeyword(sortedControlledList, searchKeyword);
      }
      return sortedControlledList;
    }, [mode, searchKeyword, sortedControlledList]);

    // 统一两种数据来源为可渲染项：受控 list 直接用 data；自请求场景仅有 visitId，由 VisitItem 懒加载
    const rows = useMemo(() => {
      if (hasList) {
        return displayControlledList.map((item) => ({
          key: item.visit_id,
          data: item as VisitItemRow | undefined,
          visitId: undefined as number | undefined,
        }));
      }

      // 最终排序完的列表（出院检索仅有 visit_id，交给 VisitItem 懒加载）
      return displayVisitList
        .filter((visit) => visit.visit_id != null)
        .map((visit) => ({
          key: visit.visit_id as number,
          data: undefined as VisitItemRow | undefined,
          visitId: visit.visit_id as number,
        }));
    }, [displayControlledList, displayVisitList, hasList]);

    const isEmpty = rows.length === 0;
    const isInitialLoading =
      loading && isEmpty && searchResultList == null && !searchKeyword.trim();

    const wrapRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const observer = new ResizeObserver(() => {
        setHeight(el.clientHeight);
      });
      observer.observe(el);
      setHeight(el.clientHeight);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (!hasList) {
        setActiveItem((prev) => (prev?.visit_id === activeId ? prev : null));
        return;
      }
      setActiveItem(list.find((item) => item.visit_id === activeId) || null);
    }, [hasList, list, activeId]);

    return (
      <div
        ref={wrapRef}
        className={[
          // 最外层控制 x y 轴滚动
          "h-full overflow-auto border-r border-(--app-theme-border) bg-(--app-theme-bg-container)",
          isInitialLoading
            ? "flex items-center justify-center"
            : "flex flex-col",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isInitialLoading ? (
          <Spin size="small" description="加载中..." />
        ) : height > 0 ? (
          <Fragment>
            {/* 在院：排序 2/3 + 检索 1/3；出院：排序 3/5 + 检索 2/5 */}
            {sortOptions.length > 0 || showSearch ? (
              <div className="sticky top-0 z-10 shrink-0 border-b border-(--app-theme-border) bg-(--app-theme-bg-container) p-1.5">
                <div className="flex items-center gap-1.5">
                  {sortOptions.length > 0 ? (
                    <Select
                      size="small"
                      className={
                        showSearch
                          ? mode === "out"
                            ? "min-w-0 flex-[3]"
                            : "min-w-0 flex-[2]"
                          : "min-w-0 w-full"
                      }
                      loading={sortDictLoading}
                      value={selectedSortValue}
                      options={sortOptions.map((item) => ({
                        label: item.item_name ?? item.item_code ?? "",
                        value: getSortItemSelectValue(item),
                      }))}
                      onChange={setSelectedSortValue}
                    />
                  ) : null}
                  {showSearch ? (
                    <div
                      className={
                        mode === "out"
                          ? "flex min-w-0 flex-[2.5] items-center gap-1"
                          : "flex min-w-0 flex-1 items-center gap-1"
                      }
                    >
                      <Input
                        size="small"
                        allowClear
                        className="min-w-0 flex-1"
                        placeholder="检索"
                        value={searchKeyword}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onPressEnter={(e) =>
                          handleSearch((e.target as HTMLInputElement).value)
                        }
                      />
                      {mode === "out" ? (
                        <Button
                          size="small"
                          icon={<SearchOutlined />}
                          loading={searching}
                          aria-label="检索"
                          onClick={() => handleSearch(searchKeyword)}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {searching ? (
              <DischargeSearchProgressBar
                progress={searchProgress}
                onAbort={handleAbortDischargeSearch}
              />
            ) : isEmpty ? (
              <div className="flex flex-1 items-center justify-center">
                <Empty description="暂无数据" />
              </div>
            ) : (
              /* 由于要做到 最外层 x 轴滚动，这边要去掉 虚拟列表，否则会出现未知现象 */
              <Listy
                items={rows}
                rowKey="key"
                styles={{
                  // 展开时用 table，让每一行（含选中背景）都拉到最长内容的宽度。
                  // 否则行宽停在侧栏可视宽度，横向滚动后右侧没有背景。
                  root: collapsed
                    ? {
                        display: "table",
                        width: "max-content",
                        minWidth: "100%",
                        borderCollapse: "collapse",
                      }
                    : undefined,
                  item: {
                    padding: 0,
                    ...(collapsed
                      ? { display: "table-row", border: "none" }
                      : {}),
                  },
                }}
                itemRender={(item) => (
                  <VisitItem
                    className={collapsed ? undefined : "min-w-full"}
                    // 注意：要用 itemCacheRef 按 visit_id 缓存。行再次出现时把缓存当作 data 传给 VisitItem，有 data 就不会再请求
                    // 不然加载过的元素离开视口再次进入视口时会重新请求
                    // data={item.data ?? itemCacheRef.current.get(item.key)}
                    data={item.data}
                    visitId={item.visitId}
                    mode={mode}
                    workType={workType}
                    collapsed={collapsed}
                    selected={(activeItem?.visit_id ?? activeId) === item.key}
                    onClick={handleSelect}
                    /* onLoad={(row) => {
                    if (row.visit_id != null) {
                      itemCacheRef.current.set(row.visit_id, row);
                    }
                  }} */
                  />
                )}
                // 由于 Listy 内部会处理 x 轴滚动，这边必须配置 overflow-visible，让 父容器去处理 x 轴滚动
                // 并且为了在 收缩 的时候，床号能够居中，这边在收缩的时候要配置 flex flex-col justify-center，展开的时候不配置
                className={
                  collapsed
                    ? "overflow-visible"
                    : "inline-block min-w-full overflow-visible flex flex-col justify-center"
                }
              />
            )}
          </Fragment>
        ) : null}
      </div>
    );
  },
);

export default InPatientList;
