import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Button, Modal, Spin, Tag, message } from "antd";
import dayjs from "dayjs";
import { endCohortAPI, getCohortListAPI } from "@/api/cohort";
import type { CohortRow } from "@/types/cohort";

const DISEASE_TYPE_CLINICAL_PATH = "临床路径";

const formatTime = (time?: string) =>
  time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "—";

const getCohortStatus = (row: CohortRow) => {
  if (!row.end_time) {
    return { label: "执行中", color: "processing" as const, running: true };
  }
  if (row.end_tag === "[EXIT]") {
    return { label: "退出", color: "default" as const, running: false };
  }
  if (row.end_tag === "[FINISH]") {
    return { label: "完成", color: "success" as const, running: false };
  }
  return { label: "已结束", color: "default" as const, running: false };
};

export interface CpCohortListProps {
  visitId: number | null;
  selectedCohortId: number | null;
  onSelect: (cohortId: number | null) => void;
  onStatusChange?: (status: { loading: boolean; empty: boolean }) => void;
}

export default function CpCohortList({
  visitId,
  selectedCohortId,
  onSelect,
  onStatusChange,
}: CpCohortListProps) {
  const [loading, setLoading] = useState(false);
  const [endingId, setEndingId] = useState<number | null>(null);
  const [list, setList] = useState<CohortRow[]>([]);

  const loadList = useCallback(async () => {
    if (visitId == null) {
      setList([]);
      onSelect(null);
      onStatusChange?.({ loading: false, empty: true });
      return;
    }
    setLoading(true);
    onStatusChange?.({ loading: true, empty: true });
    try {
      const res = await getCohortListAPI({
        visit_id: visitId,
        disease_type: DISEASE_TYPE_CLINICAL_PATH,
        include_finish: true,
        include_exit: true,
      });
      if (res.code !== 0) {
        message.error(`${res.message ?? ""}${res.hint ?? ""}`);
        setList([]);
        onSelect(null);
        onStatusChange?.({ loading: false, empty: true });
        return;
      }
      const rows = res.row_list ?? [];
      setList(rows);
      onStatusChange?.({ loading: false, empty: rows.length === 0 });
    } catch {
      setList([]);
      onSelect(null);
      onStatusChange?.({ loading: false, empty: true });
    } finally {
      setLoading(false);
    }
  }, [visitId, onSelect, onStatusChange]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (list.length === 0) {
      if (selectedCohortId != null) onSelect(null);
      return;
    }
    const stillSelected = list.some((r) => r.cohort_id === selectedCohortId);
    if (!stillSelected) {
      onSelect(list[0].cohort_id);
    }
  }, [list, selectedCohortId, onSelect]);

  const handleEnd = (
    e: MouseEvent,
    row: CohortRow,
    endTag: "[FINISH]" | "[EXIT]",
  ) => {
    e.stopPropagation();
    const isFinish = endTag === "[FINISH]";
    const title = row.cohort_name || row.disease_name || `队列#${row.cohort_id}`;
    Modal.confirm({
      title: isFinish ? "确认完成" : "确认退出",
      content: `确定要${isFinish ? "完成" : "退出"}「${title}」吗？`,
      okText: isFinish ? "完成" : "退出",
      okButtonProps: isFinish ? undefined : { danger: true },
      cancelText: "取消",
      onOk: async () => {
        setEndingId(row.cohort_id);
        try {
          const res = await endCohortAPI({
            cohort_id: row.cohort_id,
            end_tag: endTag,
          });
          if (res.code !== 0) {
            message.error(`${res.message ?? ""}${res.hint ?? ""}`);
            return;
          }
          message.success(isFinish ? "完成成功" : "退出成功");
          await loadList();
        } catch {
          // ignore
        } finally {
          setEndingId(null);
        }
      },
    });
  };

  if (list.length === 0) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-2">
      <Spin
        spinning={loading}
        classNames={{ root: "min-h-0 flex-1 [&>div]:h-full" }}
      >
        <div className="flex h-full min-h-0 gap-2 overflow-x-auto overflow-y-hidden pb-1">
          {list.map((row) => {
            const active = row.cohort_id === selectedCohortId;
            const title =
              row.cohort_name || row.disease_name || `队列#${row.cohort_id}`;
            const status = getCohortStatus(row);
            const ending = endingId === row.cohort_id;
            return (
              <div
                key={row.cohort_id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(row.cohort_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(row.cohort_id);
                  }
                }}
                className={`flex h-full w-[360px] shrink-0 cursor-pointer flex-col gap-1 rounded border p-2 transition-colors ${
                  active
                    ? "border-(--app-theme-primary) bg-(--app-theme-primary-bg)"
                    : "border-(--app-theme-border) hover:bg-(--app-theme-bg-fill-alter)"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="min-w-0 flex-1 line-clamp-1 font-medium text-(--app-theme-text)">
                    {title}
                  </span>
                  <Tag className="m-0 shrink-0" color={status.color}>
                    {status.label}
                  </Tag>
                </div>
                <div className="grid grid-cols-2 gap-1 text-(--app-theme-text-secondary)">
                  <span>诊断：{row.diag_info || "—"}</span>
                  <span>手术：{row.ops_info || "—"}</span>
                  <span>进入：{formatTime(row.enter_time)}</span>
                  <span>结束：{formatTime(row.end_time)}</span>
                </div>
                {status.running ? (
                  <div className="mt-auto flex justify-end gap-2">
                    <Button
                      size="small"
                      type="primary"
                      loading={ending}
                      onClick={(e) => handleEnd(e, row, "[FINISH]")}
                    >
                      完成
                    </Button>
                    <Button
                      size="small"
                      danger
                      loading={ending}
                      onClick={(e) => handleEnd(e, row, "[EXIT]")}
                    >
                      退出
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Spin>
    </div>
  );
}
