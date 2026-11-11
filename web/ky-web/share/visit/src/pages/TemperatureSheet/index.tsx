import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Empty, Spin, Splitter, message } from "antd";
import dayjs from "dayjs";
import { getSessionId } from "comm/session";
import TemperatureSheetHeader from "./TemperatureSheetHeader";
import TemperatureSheetChart from "./TemperatureSheetChart";
import EntryTable from "./components/EntryTable/EntryTable";
import {
  getObserveListAPI,
  getVisitPropertyAPI,
  retrieveDict2ListAPI,
  retrieveDict2ItemListAPI,
  getSessionInfoAPI,
} from "./api";
import type { ObserveRow, VitalColumn } from "./types";
import {
  CHART_A4_WIDTH_PX,
  CHART_ZOOM_MIN,
  DAYS_PER_PAGE,
  getAdmissionStart,
  getPageDaysCount,
  getTodayWeekPage,
  getTotalDays,
  getTotalPages,
  getWeekStart,
} from "./utils";

export interface TemperatureSheetProps {
  visit_id?: number;
  /** 是否显示体征录入表：true 左右布局，false 仅居中展示体温单 */
  showTable?: boolean;
  className?: string;
}

/**
 * 体温单共享页：分页、入院时间、图表与录入均在组件内处理。
 * 宿主传 visit_id；showTable 控制是否展示录入表。
 */
export default function TemperatureSheet({
  visit_id,
  showTable = false,
  className,
}: TemperatureSheetProps) {
  const validVisitId =
    visit_id != null && Number.isFinite(visit_id) && visit_id > 0
      ? visit_id
      : null;

  const sessionId = getSessionId();
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const [observeList, setObserveList] = useState<ObserveRow[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [admissionTime, setAdmissionTime] = useState("");
  /** 出院时间；有值时体温单展示截止到该日，之后日期不显示、不分页 */
  const [dischargeTime, setDischargeTime] = useState("");
  const [patientId, setPatientId] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [dynamicColumns, setDynamicColumns] = useState<VitalColumn[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [chartRefreshKey, setChartRefreshKey] = useState(0);
  const [chartZoom, setChartZoom] = useState(1);
  /** 图表面板宽度 = A4 纸自然宽度 × 缩放比例（如 90% → 642.6px） */
  const chartPanelSize = Number((CHART_A4_WIDTH_PX * chartZoom).toFixed(1));

  const totalPages = useMemo(
    () => (admissionTime ? getTotalPages(admissionTime, dischargeTime) : 1),
    [admissionTime, dischargeTime],
  );

  const tableDaysCount = useMemo(() => {
    if (!admissionTime) return 0;
    if (showAll) {
      return dischargeTime
        ? getTotalDays(admissionTime, dischargeTime)
        : totalPages * DAYS_PER_PAGE;
    }
    return getPageDaysCount(admissionTime, currentPage, dischargeTime);
  }, [admissionTime, dischargeTime, showAll, currentPage, totalPages]);

  const tableRangeStart = useMemo(() => {
    if (!admissionTime) return null;
    return showAll
      ? getAdmissionStart(admissionTime)
      : getWeekStart(admissionTime, currentPage);
  }, [admissionTime, showAll, currentPage]);

  const refreshChart = useCallback(() => {
    setChartRefreshKey((k) => k + 1);
  }, []);

  const fetchObserveList = useCallback(async () => {
    if (!showTable || !tableRangeStart || !validVisitId) return;

    setTableLoading(true);
    try {
      const res = await getObserveListAPI({
        visit_id: validVisitId,
        observe_start: tableRangeStart.format("YYYY-MM-DD HH:mm:ss"),
        observe_end: tableRangeStart
          .add(tableDaysCount, "day")
          .format("YYYY-MM-DD HH:mm:ss"),
      });
      if (res?.code === 0) {
        setObserveList(res.row_list || []);
      } else {
        message.error(
          `${res?.message || "获取体温单数据失败"}${res?.hint ? `（${res.hint}）` : ""}`,
        );
      }
    } catch {
      message.error("获取体温单数据失败");
    } finally {
      setTableLoading(false);
    }
  }, [showTable, tableRangeStart, tableDaysCount, validVisitId]);

  const handleRefresh = () => {
    if (showTable) void fetchObserveList();
    refreshChart();
  };

  const handlePageChange = (displayPage: number) => {
    setShowAll(false);
    setCurrentPage(displayPage - 1);
  };

  /** 拖动分隔条：图表面板宽度换算为缩放比例 */
  const handleSplitterResize = (sizes: number[]) => {
    const size = sizes[1];
    if (typeof size === "number" && size > 0) {
      setChartZoom(size / CHART_A4_WIDTH_PX);
    }
  };

  const fetchAdmission = useCallback(async () => {
    if (!validVisitId) return;

    setLoading(true);
    setShowAll(false);
    try {
      const visitPropertyRes = await getVisitPropertyAPI({
        visit_id: validVisitId,
      });
      if (visitPropertyRes?.code === 0) {
        const time =
          visitPropertyRes.ip_property?.admission_time ||
          dayjs().format("YYYY-MM-DD HH:mm:ss");
        const discharge = String(
          visitPropertyRes.ip_property?.discharge_time ?? "",
        ).trim();
        setAdmissionTime(time);
        setDischargeTime(discharge);
        setPatientId(
          Number(visitPropertyRes.visit_property?.patient_id) || undefined,
        );
        setCurrentPage(getTodayWeekPage(time, discharge));
      } else {
        message.error(
          `${visitPropertyRes?.message || "获取就诊信息失败"}${
            visitPropertyRes?.hint ? `（${visitPropertyRes.hint}）` : ""
          }`,
        );
      }
    } catch {
      message.error("获取就诊信息失败");
    } finally {
      setLoading(false);
    }
  }, [validVisitId]);

  const fetchDynamicColumns = useCallback(async (org_id: number) => {
    try {
      const res = await retrieveDict2ListAPI({ org_id });
      if (res?.code !== 0) return;

      const findDict = (res.row_list || []).find(
        (item: any) =>
          item.dict_name === "体征项目" &&
          item.valid_status === "1" &&
          item.catalog_id === 0,
      );
      if (!findDict) return;

      const dictItemListRes = await retrieveDict2ItemListAPI({
        dict_id: findDict.dict_id,
      });
      if (dictItemListRes?.code !== 0) return;

      const fixedNames = new Set(["体温", "脉搏", "呼吸"]);
      const cols: VitalColumn[] = (dictItemListRes.row_list || [])
        .filter((item: any) => !fixedNames.has(item.item_name))
        .map((item: any) => ({
          elem_name: item.item_name,
          item_unit: item.item_unit,
          item_tag: item.item_tag,
        }));
      const eventIdx = cols.findIndex((c) => c.item_tag === "EVENT");
      if (eventIdx >= 0) {
        const [eventCol] = cols.splice(eventIdx, 1);
        cols.push(eventCol);
      } else {
        cols.push({ elem_name: "床头事件", item_tag: "EVENT" });
      }
      setDynamicColumns(cols);
    } catch {
      console.error("获取体征项目列表失败");
    }
  }, []);

  useEffect(() => {
    if (!showTable || !sessionId) return;
    void getSessionInfoAPI({ session_id: sessionId }).then((res) => {
      if (res.code !== 0) {
        message.error(res.message + res.hint);
        return;
      }
      setSessionInfo(res.session_info);
    });
  }, [showTable, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    void fetchAdmission();
  }, [sessionId, fetchAdmission]);

  useEffect(() => {
    if (!showTable || !sessionInfo?.org_id) return;
    void fetchDynamicColumns(sessionInfo.org_id);
  }, [showTable, sessionInfo?.org_id, fetchDynamicColumns]);

  useEffect(() => {
    if (!showTable || !sessionId || !tableRangeStart) return;
    void fetchObserveList();
  }, [showTable, sessionId, tableRangeStart, fetchObserveList]);

  if (!sessionId) {
    return <Empty description="请先登录" />;
  }

  if (validVisitId == null) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-(--app-theme-bg-container)">
        <Empty description="请先选择患者" />
      </div>
    );
  }

  return (
    <div
      className={
        className ??
        "flex h-full min-h-0 flex-col overflow-hidden bg-(--app-theme-bg-container)"
      }
    >
      <Card
        className="flex h-full min-h-0 flex-col overflow-hidden [&_.ant-card-body]:flex [&_.ant-card-body]:h-full [&_.ant-card-body]:min-h-0 [&_.ant-card-body]:flex-col [&_.ant-card-body]:overflow-hidden"
        styles={{ body: { padding: "0.5rem" } }}
      >
        <TemperatureSheetHeader
          visitId={validVisitId}
          admissionTime={admissionTime}
          endTime={dischargeTime}
          currentPage={currentPage}
          showAll={showAll}
          onShowAll={() => setShowAll(true)}
          onPageChange={handlePageChange}
          onRefresh={handleRefresh}
        />
        {loading ? (
          <Spin />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--app-theme-bg-container)">
            {showTable ? (
              <Splitter className="h-full min-h-0" onResize={handleSplitterResize}>
                <Splitter.Panel min={420}>
                  <div className="h-full min-h-0 overflow-hidden">
                    <EntryTable
                      visitId={validVisitId}
                      patientId={patientId}
                      orgId={sessionInfo?.org_id}
                      currentDate={tableRangeStart}
                      daysCount={tableDaysCount}
                      loading={tableLoading}
                      admissionTime={admissionTime}
                      dynamicColumns={dynamicColumns}
                      observeList={observeList}
                      onSaved={refreshChart}
                      onEventSaved={refreshChart}
                    />
                  </div>
                </Splitter.Panel>
                <Splitter.Panel
                  size={chartPanelSize}
                  min={CHART_A4_WIDTH_PX * CHART_ZOOM_MIN}
                >
                  <TemperatureSheetChart
                    visitId={validVisitId}
                    page={currentPage}
                    showAll={showAll}
                    totalPages={totalPages}
                    refreshKey={chartRefreshKey}
                    fitWidth
                    zoom={chartZoom}
                    onZoomChange={setChartZoom}
                    className="h-full"
                  />
                </Splitter.Panel>
              </Splitter>
            ) : (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <TemperatureSheetChart
                  visitId={validVisitId}
                  page={currentPage}
                  showAll={showAll}
                  totalPages={totalPages}
                  refreshKey={chartRefreshKey}
                  fill
                  className="h-full w-full"
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
