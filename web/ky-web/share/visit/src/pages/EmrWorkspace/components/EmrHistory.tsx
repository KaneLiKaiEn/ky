import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Empty, Select, Space, Spin, Tag } from "antd";
import dayjs from "dayjs";
import { getEmrList } from "@/api/emr";
import type { EmrRow } from "@/types/emr";
import EmrPreview from "../../EmrPreview";
import EmrView from "../../EmrView";
import { formatCreateTime, isCommitted } from "../hooks/useEmrDocument";

export interface EmrHistoryProps {
  visitId: number;
  docType: string;
  /** 当前左侧选中病历的 doc_name；为空时不请求 */
  docName?: string;
  /** 排除当前左侧已创建的病历 id */
  excludeEmrId?: number | null;
  /** 变更后递增以强制重新拉取 */
  refreshKey?: number;
}

const getEmrTime = (row: EmrRow) => row.emr_time || row.input_time;

const getCreatorName = (row: EmrRow) => row.user_name_list?.trim() || "—";

const toTimeValue = (time?: string) => {
  if (!time) return Number.NEGATIVE_INFINITY;
  const ms = dayjs(time).valueOf();
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms;
};

const renderHistoryOptionLabel = (label: ReactNode, committed: boolean) => (
  <div className="flex min-w-0 items-center gap-1">
    <span className="min-w-0 truncate">{label}</span>
    <Tag color={committed ? "success" : "default"} className="me-0! shrink-0">
      {committed ? "已提交" : "未提交"}
    </Tag>
  </div>
);

const EmrHistory = ({
  visitId,
  docType,
  docName,
  excludeEmrId,
  refreshKey = 0,
}: EmrHistoryProps) => {
  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState<EmrRow[]>([]);
  const [selectedEmrId, setSelectedEmrId] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    if (!docName?.trim()) {
      setHistoryList([]);
      setSelectedEmrId(null);
      return;
    }

    setLoading(true);
    try {
      const res = await getEmrList({
        visit_id: visitId,
        doc_type: docType,
        doc_name: docName,
      });
      const list =
        res.code === 0
          ? (res.row_list ?? []).filter(
            (row) =>
              row.emr_id != null &&
              (excludeEmrId == null || row.emr_id !== excludeEmrId),
          )
          : [];
      const sorted = [...list].sort(
        (a, b) => toTimeValue(getEmrTime(b)) - toTimeValue(getEmrTime(a)),
      );
      setHistoryList(sorted);
      setSelectedEmrId((prev) => {
        if (prev != null && sorted.some((row) => row.emr_id === prev)) {
          return prev;
        }
        return sorted[0]?.emr_id ?? null;
      });
    } catch (error) {
      console.error(error);
      setHistoryList([]);
      setSelectedEmrId(null);
    } finally {
      setLoading(false);
    }
  }, [docName, docType, excludeEmrId, visitId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshKey]);

  const selectOptions = useMemo(
    () =>
      historyList
        .filter((row) => row.emr_id != null)
        .map((row) => {
          const committed = isCommitted(row.emr_status);
          return {
            value: row.emr_id!,
            label: `${formatCreateTime(getEmrTime(row))} ${getCreatorName(row)}`,
            committed,
          };
        }),
    [historyList],
  );

  const selectedEmrCommitted = useMemo(() => {
    if (selectedEmrId == null) return false;
    const row = historyList.find((item) => item.emr_id === selectedEmrId);
    return row ? isCommitted(row.emr_status) : false;
  }, [historyList, selectedEmrId]);

  if (!docName?.trim()) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty
          description="请选择病历"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <Spin spinning={loading} classNames={{ root: "flex h-full min-h-0 flex-col" }}>
      {historyList.length === 0 && !loading ? (
        <div className="flex h-full items-center justify-center">
          <Empty
            description="暂无历史记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="flex shrink-0 items-center gap-1">
            <Space.Compact className="w-full">
              <Space.Addon>
                <span className="text-(--app-theme-primary)">
                  历史
                </span>
              </Space.Addon>
              <Select
                size="small"
                className="min-w-0 flex-1"
                placeholder="选择历史记录"
                value={selectedEmrId ?? undefined}
                options={selectOptions}
                labelRender={(option) => {
                  const committed =
                    selectOptions.find((item) => item.value === option.value)
                      ?.committed ?? false;
                  return renderHistoryOptionLabel(option.label, committed);
                }}
                optionRender={(option) =>
                  renderHistoryOptionLabel(
                    option.label,
                    option.data.committed as boolean,
                  )
                }
                onChange={(value) => setSelectedEmrId(value)}
              />
            </Space.Compact>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {selectedEmrId != null ? (
              selectedEmrCommitted ? (
                <EmrView
                  key={selectedEmrId}
                  emr_id={selectedEmrId}
                />
              ) : (
                <EmrPreview
                  key={selectedEmrId}
                  emr_id={selectedEmrId}
                />
              )
            ) : null}
          </div>
        </div>
      )}
    </Spin>
  );
};

export default EmrHistory;
