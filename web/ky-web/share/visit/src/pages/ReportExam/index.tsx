import React, { useEffect, useState } from "react";
import {
  Button,
  Empty,
  Input,
  List,
  Spin,
  Tabs,
  Typography,
  message,
  Space,
  theme,
} from "antd";
import {
  getExamReportContent,
  getExamReportDoc,
  getExamReportList,
} from "@/api/exam";
import type { ExamReportRow } from "@/types/exam";
import { getSessionId } from "comm/session";
import PdfViewer from "@/components/PdfViewer";
import "./index.scss";


export interface ReportExamViewerProps {
  visit_id?: number;
  patient_id?: number;
  report_start?: string;
  report_end?: string;
}

const ReportExamViewer: React.FC<ReportExamViewerProps> = ({
  visit_id,
  patient_id,
  report_start,
  report_end,
}) => {
  const { token } = theme.useToken();
  const [reportList, setReportList] = useState<ExamReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedReportNo, setSelectedReportNo] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"data" | "doc">("data");
  const [examObserve, setExamObserve] = useState("");
  const [examResult, setExamResult] = useState("");
  const [contentLoading, setContentLoading] = useState(false);

  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    if (!report_start || !report_end) {
      setReportList([]);
      setSelectedReportNo(null);
      return;
    }
    let cancelled = false;
    setReportLoading(true);
    setSelectedReportNo(null);
    getExamReportList({
      visit_id,
      patient_id,
      report_start,
      report_end,
    })
      .then((res) => {
        if (cancelled) return;
        setReportList(res.row_list ?? []);
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
    setExamObserve("");
    setExamResult("");
    if (!selectedReportNo) return;
    let cancelled = false;
    setContentLoading(true);
    getExamReportContent({ report_no: selectedReportNo })
      .then((res) => {
        if (cancelled) return;
        setExamObserve(res.report_content?.exam_observe ?? "");
        setExamResult(res.report_content?.exam_result ?? "");
      })
      .catch(() => {
        if (cancelled) return;
        setExamObserve("");
        setExamResult("");
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedReportNo]);

  useEffect(() => {
    if (activeTab !== "doc" || !selectedReportNo) {
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    setDocLoading(true);
    setDocUrl(null);
    getExamReportDoc({
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

  const handleCopy = async (text: string, label: string) => {
    if (!text) {
      message.warning(`${label}为空`);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      message.success("已复制");
    } catch {
      message.error("复制失败");
    }
  };

  const fields = [
    {
      key: "observe",
      label: "检查所见",
      value: examObserve,
      onChange: setExamObserve,
    },
    {
      key: "result",
      label: "检验所见",
      value: examResult,
      onChange: setExamResult,
    },
  ];

  const dataPane = (
    <div className="report-exam__pane">
      {!selectedReportNo ? (
        <Empty description="请选择报告" />
      ) : (
        <Spin spinning={contentLoading}>
          <div className="report-exam__fields">
            {fields.map((field) => (
              <div key={field.key} className="report-exam__field">
                <Space>
                  <Typography.Text strong>{field.label}</Typography.Text>

                  <Button
                    size="small"
                    onClick={() => handleCopy(field.value, field.label)}
                  >
                    复制
                  </Button>
                </Space>

                <Input.TextArea
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  autoSize={{ minRows: 6, maxRows: 12 }}
                />
              </div>
            ))}
          </div>
        </Spin>
      )}
    </div>
  );

  const docPane = (
    <div className="report-exam__pane report-exam__pane--doc">
      {!selectedReportNo ? (
        <Empty description="请选择报告" />
      ) : docLoading ? (
        <div className="report-exam__doc-loading">
          <Spin description="加载中..." />
        </div>
      ) : (
        <PdfViewer className="report-exam__doc-frame" src={docUrl} />
      )}
    </div>
  );

  return (
    <div className="report-exam">
      <div className="report-exam__list">
        <Spin spinning={reportLoading}>
          <List
            className="report-exam__report-list"
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
                  className="report-exam__report-item"
                  style={{
                    background: active ? token.colorPrimaryBg : undefined,
                  }}
                  onClick={() => setSelectedReportNo(item.report_no ?? null)}
                >
                  <div className="report-exam__report-item-body">
                    <Typography.Text
                      ellipsis
                      className="report-exam__report-title"
                    >
                      {item.report_title || item.report_name || "-"}
                    </Typography.Text>
                    <Typography.Text
                      type="secondary"
                      className="report-exam__report-desc"
                    >
                      {`${item.report_time ?? ""} ${item.exec_body_name ?? ""}`}
                    </Typography.Text>
                  </div>
                </List.Item>
              );
            }}
          />
        </Spin>
      </div>
      <div className="report-exam__main">
        <Tabs
          className="report-exam__tabs"
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "data" | "doc")}
          items={[
            { key: "data", label: "数据", children: dataPane },
            { key: "doc", label: "文档", children: docPane },
          ]}
        />
      </div>
    </div>
  );
};

export default ReportExamViewer;
