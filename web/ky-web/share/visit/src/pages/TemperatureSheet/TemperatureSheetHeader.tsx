import { useMemo, useState } from "react";
import { Button, Space, message } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import { getSessionId } from "comm/session";
import { print, printPreview } from "@/pages/PrintList";
import {
  DAYS_PER_PAGE,
  getAdmissionStart,
  getPageDaysCount,
  getPageItems,
  getSheetEnd,
  getTotalPages,
  getWeekStart,
} from "./utils";

export interface TemperatureSheetHeaderProps {
  visitId: number;
  /** 入院时间；有值时展示周次分页 */
  admissionTime?: string;
  /** 出院时间；有值时分页与日期范围截止到该日 */
  endTime?: string;
  /** 当前周次，0 = 入院第一周 */
  currentPage: number;
  /** 全部周次模式 */
  showAll: boolean;
  onShowAll: () => void;
  /** displayPage 从 1 起 */
  onPageChange: (displayPage: number) => void;
  /** 刷新图表（及宿主侧其它数据） */
  onRefresh: () => void;
  /** 覆盖默认打印；不传则按体温单 doc/visit3 打印 */
  onPrint?: () => void;
  /** 覆盖默认打印预览 */
  onPrintPreview?: () => void;
  title?: string;
}

/** 当前选中页（或全部）的起止日期 YYYY-MM-DD */
function getSelectedPageDateRange(
  admissionTime: string,
  currentPage: number,
  showAll: boolean,
  endTime?: string,
): { start: string; end: string } {
  if (showAll) {
    const start = getAdmissionStart(admissionTime);
    if (endTime?.trim()) {
      return {
        start: start.format("YYYY-MM-DD"),
        end: getSheetEnd(endTime).format("YYYY-MM-DD"),
      };
    }
    const totalPages = getTotalPages(admissionTime);
    const end = start.add(totalPages * DAYS_PER_PAGE - 1, "day");
    return {
      start: start.format("YYYY-MM-DD"),
      end: end.format("YYYY-MM-DD"),
    };
  }
  const start = getWeekStart(admissionTime, currentPage);
  const days = getPageDaysCount(admissionTime, currentPage, endTime);
  const end = start.add(Math.max(days, 1) - 1, "day");
  return {
    start: start.format("YYYY-MM-DD"),
    end: end.format("YYYY-MM-DD"),
  };
}

function buildTemperatureSheetPrintUrl(
  sessionId: string,
  visitId: number,
  linkData: string,
  linkExt: string,
) {
  return (
    `doc/visit3/${sessionId}` +
    `?visit_id=${visitId}` +
    `&doc_type=${encodeURIComponent("体温单")}` +
    `&doc_name=${encodeURIComponent("体温单")}` +
    `&doc_tag=${encodeURIComponent("体温单")}` +
    `&link_data=${encodeURIComponent(linkData)}` +
    `&link_ext=${encodeURIComponent(linkExt)}` +
    `&auto_create=1&rebuild=1`
  );
}

export default function TemperatureSheetHeader({
  visitId,
  admissionTime,
  endTime,
  currentPage,
  showAll,
  onShowAll,
  onPageChange,
  onRefresh,
  onPrint,
  onPrintPreview,
  title = "体温单",
}: TemperatureSheetHeaderProps) {
  const [printLoading, setPrintLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const totalPages = useMemo(
    () => (admissionTime ? getTotalPages(admissionTime, endTime) : 1),
    [admissionTime, endTime],
  );

  const weekRangeLabel = useMemo(() => {
    if (!admissionTime) return "";
    const start = getWeekStart(admissionTime, currentPage);
    const days = getPageDaysCount(admissionTime, currentPage, endTime);
    const end = start.add(Math.max(days, 1) - 1, "day");
    return `${start.format("MM-DD")} ~ ${end.format("MM-DD")}`;
  }, [admissionTime, currentPage, endTime]);

  const resolvePrintUrl = (): string | null => {
    const sessionId = getSessionId();
    if (!sessionId) {
      message.warning("请先登录");
      return null;
    }
    if (!visitId) {
      message.warning("缺少就诊信息");
      return null;
    }
    if (!admissionTime) {
      message.warning("缺少入院时间，无法确定打印日期范围");
      return null;
    }

    const { start, end } = getSelectedPageDateRange(
      admissionTime,
      currentPage,
      showAll,
      endTime,
    );
    return buildTemperatureSheetPrintUrl(sessionId, visitId, start, end);
  };

  const handlePrint = async () => {
    if (onPrint) {
      onPrint();
      return;
    }
    const url = resolvePrintUrl();
    if (!url) return;

    setPrintLoading(true);
    try {
      await print(url);
    } finally {
      setPrintLoading(false);
    }
  };

  const handlePrintPreview = async () => {
    if (onPrintPreview) {
      onPrintPreview();
      return;
    }
    const url = resolvePrintUrl();
    if (!url || previewLoading) return;

    setPreviewLoading(true);
    try {
      await printPreview(url);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 border-(--app-theme-border) pb-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-bold">{title}</div>
      </div>
      {admissionTime && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-(--app-theme-text-secondary)">
            {showAll
              ? "全部周次"
              : `第 ${currentPage + 1} 周${weekRangeLabel ? `（${weekRangeLabel}）` : ""}`}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              size="small"
              type={showAll ? "primary" : "default"}
              onClick={onShowAll}
            >
              全部
            </Button>
            <Button
              size="small"
              disabled={showAll || currentPage <= 0}
              onClick={() => onPageChange(currentPage)}
            >
              上一页
            </Button>
            {getPageItems(currentPage + 1, totalPages).map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`e-${idx}`}
                  className="px-1 text-(--app-theme-text-secondary)"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  size="small"
                  type={
                    !showAll && currentPage + 1 === item ? "primary" : "default"
                  }
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              size="small"
              disabled={showAll || currentPage >= totalPages - 1}
              onClick={() => onPageChange(currentPage + 2)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Space.Compact>
          <Button
            size="small"
            loading={printLoading}
            disabled={previewLoading}
            onClick={() => void handlePrint()}
          >
            打印
          </Button>
          <Button
            size="small"
            loading={previewLoading}
            disabled={printLoading}
            icon={<EllipsisOutlined />}
            title="打印预览"
            onClick={() => void handlePrintPreview()}
          />
        </Space.Compact>
        <Button size="small" onClick={onRefresh} type="primary">
          刷新
        </Button>
      </div>
    </div>
  );
}
