import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  App,
  Button,
  DatePicker,
  Empty,
  List,
  Spin,
  Table,
  Tabs,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { TableColumnsType } from "antd";
import type { Key } from "react";
import { StarFilled, StarOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import {
  favoriteReportItem,
  getFavoriteReportItemList,
  getLabItemHistory,
  getLabReportAst,
  getLabReportBact,
  getLabReportContent,
  getLabReportDetail,
  getLabReportDoc,
  getLabReportList,
  undoFavoriteReportItem,
} from "@/api/lab";
import type {
  LabReportAstRow,
  LabReportBactRow,
  LabReportContentRow,
  LabReportDetailRow,
  LabReportRow,
} from "@/types/lab";
import { getSessionId, getSessionInfo } from "comm/session";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import PdfViewer from "@/components/PdfViewer";
import "./index.scss";

export interface ReportLabViewerProps {
  visit_id?: number;
  patient_id?: number;
  baby_id?: number;
  /** 仅用于关注接口，不参与报告列表和项目历史查询 */
  favorite_visit_id?: number;
  report_start?: string;
  report_end?: string;
  abnormalChecked?: boolean;
}

export interface ReportLabViewerHandle {
  getStructuredReference: () => string;
}

interface HistoryRow extends LabReportDetailRow {
  recv_time?: string;
}

const favoriteItemKey = (item: {
  item_id?: number;
  item_code?: string;
  item_code_system?: string;
}): string => {
  const hasId = item.item_id != null && item.item_id !== 0;
  const hasCode = Boolean(item.item_code);
  if (!hasId && !hasCode) return "";
  return `${item.item_id ?? 0}|${item.item_code ?? ""}|${item.item_code_system ?? ""}`;
};

const detailRowKey = (row: LabReportDetailRow, index: number): string => {
  if (row.row_id != null) return `row-${row.row_id}`;
  if (row.serial_no != null) return `serial-${row.serial_no}`;
  return `idx-${index}`;
};

const parseNumber = (value?: string): number | null => {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const mapBactToDetail = (row: LabReportBactRow): LabReportDetailRow => ({
  ...row,
});

const mapAstToDetail = (row: LabReportAstRow): LabReportDetailRow => ({
  ...row,
  item_name: row.group_name
    ? `${row.group_name} / ${row.item_name ?? ""}`
    : row.item_name,
  item_value: row.item_mic,
  item_value_dec: row.item_mic_dec,
  item_value_tip: row.item_sir,
});

const mapContentToDetail = (row: LabReportContentRow): LabReportDetailRow => ({
  ...row,
  item_name: "报告内容",
  item_value: row.report_content,
});

const ReportLabViewer = forwardRef<ReportLabViewerHandle, ReportLabViewerProps>(
  (
    {
      visit_id,
      patient_id,
      baby_id = 0,
      favorite_visit_id,
      report_start,
      report_end,
      abnormalChecked = false,
    },
    ref,
  ) => {
    const { token } = theme.useToken();
    const { message } = App.useApp();
    const [reportList, setReportList] = useState<LabReportRow[]>([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [selectedReportNo, setSelectedReportNo] = useState<string | null>(
      null,
    );

    const [activeTab, setActiveTab] = useState<"data" | "doc">("data");
    const [detailList, setDetailList] = useState<LabReportDetailRow[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [checkedRowKeys, setCheckedRowKeys] = useState<Key[]>([]);
    const [previewItemKey, setPreviewItemKey] = useState<string | null>(null);
    const [previewItem, setPreviewItem] = useState<LabReportDetailRow | null>(
      null,
    );

    const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyRange, setHistoryRange] = useState<[Dayjs, Dayjs]>(() => [
      dayjs(),
      dayjs(),
    ]);
    const historyStart = historyRange[0].format("YYYY-MM-DD");
    const historyEnd = historyRange[1].format("YYYY-MM-DD");

    const [docUrl, setDocUrl] = useState<string | null>(null);
    const [docLoading, setDocLoading] = useState(false);

    const [workType, setWorkType] = useState<string | null>(null);
    const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
    const [pendingFavoriteKeys, setPendingFavoriteKeys] = useState<Set<string>>(
      new Set(),
    );
    const pendingFavoriteRef = useRef<Set<string>>(new Set());

    useEffect(() => {
      let cancelled = false;
      getSessionInfo()
        .then((session) => {
          if (cancelled) return;
          setWorkType(String(session?.work_type ?? ""));
        })
        .catch(() => {
          if (!cancelled) setWorkType("");
        });
      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      if (!favorite_visit_id || workType == null) {
        setFavoriteKeys(new Set());
        return;
      }
      let cancelled = false;
      getFavoriteReportItemList({
        visit_id: favorite_visit_id,
        baby_id,
        work_type: workType,
      })
        .then((res) => {
          if (cancelled) return;
          setFavoriteKeys(
            new Set((res.row_list ?? []).map(favoriteItemKey).filter(Boolean)),
          );
        })
        .catch(() => {
          if (!cancelled) setFavoriteKeys(new Set());
        });
      return () => {
        cancelled = true;
      };
    }, [favorite_visit_id, baby_id, workType]);

    useEffect(() => {
      if (!report_start || !report_end) {
        setReportList([]);
        setSelectedReportNo(null);
        return;
      }
      let cancelled = false;
      setReportLoading(true);
      setSelectedReportNo(null);
      getLabReportList({
        visit_id,
        patient_id,
        report_start,
        report_end,
      })
        .then((res) => {
          if (cancelled) return;
          setReportList(
            [...(res.row_list ?? [])].sort((a, b) =>
              (b.report_time ?? "").localeCompare(a.report_time ?? ""),
            ),
          );
        })
        .catch(() => {
          if (cancelled) return;
          setReportList([]);
        })
        .finally(() => {
          if (!cancelled) setReportLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [report_start, report_end]);

    useEffect(() => {
      setDetailList([]);
      setCheckedRowKeys([]);
      setPreviewItemKey(null);
      setPreviewItem(null);
      setHistoryRows([]);
      if (!selectedReportNo) return;
      const reportType =
        reportList.find((r) => r.report_no === selectedReportNo)?.report_type ??
        "";
      let cancelled = false;
      setDetailLoading(true);

      const tasks: Promise<LabReportDetailRow[]>[] = [
        getLabReportDetail({ report_no: selectedReportNo })
          .then((res) => res.row_list ?? [])
          .catch(() => [] as LabReportDetailRow[]),
      ];

      if (reportType.includes("[BACT]")) {
        tasks.push(
          getLabReportBact({ report_no: selectedReportNo })
            .then((res) => (res.row_list ?? []).map(mapBactToDetail))
            .catch(() => [] as LabReportDetailRow[]),
        );
      }
      if (reportType.includes("[AST]")) {
        tasks.push(
          getLabReportAst({ report_no: selectedReportNo })
            .then((res) => (res.row_list ?? []).map(mapAstToDetail))
            .catch(() => [] as LabReportDetailRow[]),
        );
      }
      if (reportType.includes("[CONTENT]")) {
        tasks.push(
          getLabReportContent({ report_no: selectedReportNo })
            .then((res) =>
              res.report_content
                ? [mapContentToDetail(res.report_content)]
                : [],
            )
            .catch(() => [] as LabReportDetailRow[]),
        );
      }

      Promise.all(tasks)
        .then((lists) => {
          if (cancelled) return;
          setDetailList(lists.flat());
        })
        .finally(() => {
          if (!cancelled) setDetailLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [selectedReportNo, reportList]);

    useEffect(() => {
      if (activeTab !== "doc" || !selectedReportNo) {
        return;
      }
      let cancelled = false;
      let objectUrl: string | null = null;
      setDocLoading(true);
      setDocUrl(null);
      getLabReportDoc({
        session_id: getSessionId() ?? "",
        report_no: selectedReportNo,
      })
        .then((blob) => {
          if (cancelled) return;
          const pdfBlob =
            blob instanceof Blob
              ? blob
              : new Blob([blob], { type: "application/pdf" });
          objectUrl = URL.createObjectURL(pdfBlob);
          setDocUrl(objectUrl);
        })
        .catch(() => {
          if (cancelled) return;
          setDocUrl(null);
        })
        .finally(() => {
          if (!cancelled) setDocLoading(false);
        });
      return () => {
        cancelled = true;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }, [activeTab, selectedReportNo]);

    useEffect(() => {
      if (!previewItem?.item_code) {
        setHistoryRows([]);
        return;
      }
      if (!visit_id && !patient_id) {
        setHistoryRows([]);
        return;
      }
      let cancelled = false;
      setHistoryLoading(true);
      getLabItemHistory({
        visit_id,
        patient_id,
        item_code: previewItem.item_code,
        report_start: historyStart,
        report_end: historyEnd,
      })
        .then((res) => {
          if (cancelled) return;
          const reportMap = new Map<string, LabReportRow>(
            (res.report_list ?? [])
              .filter((r): r is LabReportRow & { report_no: string } =>
                Boolean(r.report_no),
              )
              .map((r) => [r.report_no, r]),
          );
          const merged: HistoryRow[] = (res.detail_list ?? [])
            .map((d) => ({
              ...d,
              recv_time: d.report_no
                ? reportMap.get(d.report_no)?.recv_time
                : undefined,
            }))
            .sort((a, b) =>
              (a.recv_time ?? "").localeCompare(b.recv_time ?? ""),
            );
          setHistoryRows(merged);
        })
        .catch(() => {
          if (cancelled) return;
          setHistoryRows([]);
        })
        .finally(() => {
          if (!cancelled) setHistoryLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [previewItem, visit_id, patient_id, historyStart, historyEnd]);

    useEffect(() => {
      const abnormalKeys = detailList
        .map((row, index) =>
          row.item_value_tip ? detailRowKey(row, index) : null,
        )
        .filter((key): key is string => key != null);
      if (abnormalChecked) {
        setCheckedRowKeys((prev) => [...new Set([...prev, ...abnormalKeys])]);
        return;
      }
      const abnormalSet = new Set(abnormalKeys);
      setCheckedRowKeys((prev) =>
        prev.filter((key) => !abnormalSet.has(String(key))),
      );
    }, [abnormalChecked, detailList]);

    useImperativeHandle(
      ref,
      () => ({
        getStructuredReference: () => {
          const report = reportList.find(
            (r) => r.report_no === selectedReportNo,
          );
          const title = report?.report_title || report?.report_name || "";
          const time = report?.report_time ?? "";
          const keySet = new Set(checkedRowKeys);
          return detailList
            .filter((row, index) => keySet.has(detailRowKey(row, index)))
            .map(
              (row) =>
                `${title}(${time}) ${row.item_name ?? ""} ${row.item_value ?? ""} ${row.item_unit ?? ""}`,
            )
            .join("\n");
        },
      }),
      [checkedRowKeys, detailList, reportList, selectedReportNo],
    );

    const handleToggleFavorite = useCallback(
      (row: LabReportDetailRow, event: React.MouseEvent) => {
        event.stopPropagation();
        const key = favoriteItemKey(row);
        if (!key) return;
        if (!favorite_visit_id) {
          message.warning("请先选择患者");
          return;
        }
        if (workType == null || pendingFavoriteRef.current.has(key)) return;

        pendingFavoriteRef.current.add(key);
        setPendingFavoriteKeys(new Set(pendingFavoriteRef.current));

        const favorited = favoriteKeys.has(key);
        const request = favorited
          ? undoFavoriteReportItem({
              visit_id: favorite_visit_id,
              baby_id,
              work_type: workType,
              item_id: row.item_id ?? 0,
              item_code: row.item_code ?? "",
              item_code_system: row.item_code_system ?? "",
            })
          : favoriteReportItem({
              visit_id: favorite_visit_id,
              baby_id,
              work_type: workType,
              item_id: row.item_id ?? 0,
              item_code: row.item_code ?? "",
              item_code_system: row.item_code_system ?? "",
              item_name: row.item_name ?? "",
              item_unit: row.item_unit ?? "",
              favorite_duration: 0,
              favorite_unit: "",
              favorite_tag: "",
              favorite_note: "",
            });

        void request
          .then(() => {
            setFavoriteKeys((prev) => {
              const next = new Set(prev);
              if (favorited) next.delete(key);
              else next.add(key);
              return next;
            });
          })
          .catch(() => {})
          .finally(() => {
            pendingFavoriteRef.current.delete(key);
            setPendingFavoriteKeys(new Set(pendingFavoriteRef.current));
          });
      },
      [baby_id, favoriteKeys, favorite_visit_id, message, workType],
    );

    const detailColumns: TableColumnsType<LabReportDetailRow> = useMemo(
      () => [
        {
          title: "项目",
          dataIndex: "item_name",
          key: "item_name",
          width: 200,
        },
        {
          title: "结果",
          dataIndex: "item_value",
          key: "item_value",
          width: 120,
        },
        {
          title: "提示",
          dataIndex: "item_value_tip",
          key: "item_value_tip",
          width: 80,
        },
        { title: "单位", dataIndex: "item_unit", key: "item_unit", width: 100 },
        {
          title: "参考范围",
          dataIndex: "value_range",
          key: "value_range",
          width: 160,
        },
        {
          title: "方法",
          dataIndex: "item_method",
          key: "item_method",
          width: 140,
        },
        {
          title: "前次时间",
          dataIndex: "prev_time",
          key: "prev_time",
          width: 140,
        },
        {
          title: "前次值",
          dataIndex: "prev_value",
          key: "prev_value",
          width: 80,
        },
        {
          title: "代码",
          dataIndex: "item_code",
          key: "item_code",
          width: 80,
        },
        {
          title: "操作",
          key: "action",
          width: 72,
          align: "center",
          render: (_value, row) => {
            const key = favoriteItemKey(row);
            if (!key) return null;
            const favorited = favoriteKeys.has(key);
            return (
              <Tooltip title={favorited ? "取消关注" : "关注"}>
                <Button
                  type="text"
                  size="small"
                  disabled={pendingFavoriteKeys.has(key)}
                  icon={
                    favorited ? (
                      <StarFilled style={{ color: "#faad14" }} />
                    ) : (
                      <StarOutlined />
                    )
                  }
                  onClick={(event) => handleToggleFavorite(row, event)}
                />
              </Tooltip>
            );
          },
        },
      ],
      [favoriteKeys, handleToggleFavorite, pendingFavoriteKeys],
    );

    const historyColumns: TableColumnsType<HistoryRow> = useMemo(
      () => [
        {
          title: "时间",
          dataIndex: "recv_time",
          key: "recv_time",
          width: 160,
          render: (text: string) => (
            <span>{text ? dayjs(text).format("YYYY-MM-DD") : "-"}</span>
          ),
        },
        {
          title: "结果",
          dataIndex: "item_value",
          key: "item_value",
          width: 120,
        },
        {
          title: "提示",
          dataIndex: "item_value_tip",
          key: "item_value_tip",
          width: 140,
        },
      ],
      [],
    );

    const chartOption = useMemo(() => {
      return {
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 20, top: 30, bottom: 40 },
        xAxis: {
          type: "category",
          data: historyRows.map((r) =>
            dayjs(r.recv_time ?? "").format("YYYY-MM-DD"),
          ),
          axisLabel: { rotate: 30 },
        },
        yAxis: { type: "value" },
        series: [
          {
            type: "line",
            name: previewItem?.item_name ?? "结果",
            data: historyRows.map((r) => {
              const value = parseNumber(r.item_value);
              const hasTip = Boolean(r.item_value_tip);
              return {
                value,
                itemStyle: hasTip ? { color: "#ff4d4f" } : undefined,
                symbolSize: hasTip ? 10 : 6,
              };
            }),
            smooth: true,
            connectNulls: true,
          },
        ],
      };
    }, [historyRows, previewItem]);

    const previewPane = (
      <div className="report-lab__pane">
        <Table<LabReportDetailRow>
          size="small"
          loading={detailLoading}
          rowKey={(row) =>
            detailRowKey(row, (detailList as LabReportDetailRow[]).indexOf(row))
          }
          dataSource={detailList}
          columns={detailColumns}
          pagination={false}
          sticky
          scroll={{ x: "max-content" }}
          rowClassName={(row) => {
            const key = detailRowKey(row, detailList.indexOf(row));
            const classes = [
              row.item_value_tip ? "report-lab__row--abnormal" : "",
              key === previewItemKey ? "report-lab__row--preview" : "",
            ];
            return classes.filter(Boolean).join(" ");
          }}
          rowSelection={{
            type: "checkbox",
            selectedRowKeys: checkedRowKeys,
            onChange: (keys) => setCheckedRowKeys(keys),
          }}
          onRow={(row) => ({
            onClick: () => {
              const key = detailRowKey(row, detailList.indexOf(row));
              setPreviewItemKey(key);
              setPreviewItem(row);
            },
          })}
        />
      </div>
    );

    const docPane = (
      <div className="report-lab__pane report-lab__pane--doc">
        {!selectedReportNo ? (
          <Empty description="请选择报告" />
        ) : docLoading ? (
          <div className="report-lab__doc-loading">
            <Spin description="加载中..." />
          </div>
        ) : (
          <PdfViewer className="report-exam__doc-frame" src={docUrl} />
        )}
      </div>
    );

    return (
      <div className="report-lab">
        <div className="report-lab__list">
          <Spin spinning={reportLoading}>
            <List
              className="report-lab__report-list"
              size="small"
              bordered
              rowKey="report_no"
              style={{ borderColor: token.colorBorderSecondary }}
              dataSource={reportList}
              locale={{
                emptyText: (
                  <Empty
                    description={
                      !report_start || !report_end
                        ? "请选择日期区间"
                        : "暂无报告"
                    }
                  />
                ),
              }}
              renderItem={(item) => {
                const active = item.report_no === selectedReportNo;
                return (
                  <List.Item
                    className="report-lab__report-item"
                    style={{
                      background: active ? token.colorPrimaryBg : undefined,
                    }}
                    onClick={() => setSelectedReportNo(item.report_no ?? null)}
                  >
                    <div className="report-lab__report-item-body">
                      <Typography.Text
                        ellipsis
                        className="report-lab__report-title"
                      >
                        {item.report_title || item.report_name || "-"}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        className="report-lab__report-desc"
                      >
                        {`${item.report_time ?? ""} ${item.specimen_name ?? ""}`}
                      </Typography.Text>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Spin>
        </div>
        <div className="report-lab__main">
          <Tabs
            className="report-lab__tabs"
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as "data" | "doc")}
            items={[
              { key: "data", label: "数据", children: previewPane },
              { key: "doc", label: "文档", children: docPane },
            ]}
          />
          {previewItem ? (
            <div className="report-lab__detail">
              <Typography.Text strong>
                详细信息：{previewItem.item_name}
              </Typography.Text>
              <div className="report-lab__detail-body">
                <div className="report-lab__history">
                  <div className="report-lab__history-toolbar">
                    <DatePicker.RangePicker
                      allowClear={false}
                      value={historyRange}
                      onChange={(v) => {
                        if (v && v[0] && v[1]) setHistoryRange([v[0], v[1]]);
                      }}
                    />
                  </div>
                  <Table<HistoryRow>
                    size="small"
                    loading={historyLoading}
                    rowKey={(row, index) =>
                      row.row_id != null ? `h-${row.row_id}` : `h-${index}`
                    }
                    dataSource={historyRows}
                    columns={historyColumns}
                    pagination={false}
                    sticky
                    scroll={{ x: "max-content" }}
                    rowClassName={(row) =>
                      row.item_value_tip ? "report-lab__row--abnormal" : ""
                    }
                  />
                </div>
                <div className="report-lab__chart">
                  {!historyLoading && historyRows.length === 0 ? (
                    <Empty description="暂无历史数据" />
                  ) : (
                    <ReactECharts
                      option={chartOption}
                      showLoading={historyLoading}
                      style={{ height: "100%", width: "100%" }}
                      notMerge
                    />
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

ReportLabViewer.displayName = "ReportLabViewer";

export default ReportLabViewer;
