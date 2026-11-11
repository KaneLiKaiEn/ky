import { Empty, Spin, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { getAssessmentListAPI } from "./api";

export interface AssessmentTimelineProps {
  visitId: number;
  /** 评估单名称；为空时不请求 */
  docName?: string;
  /** 文档类型，默认「患者评估」 */
  docType?: string;
  /** 工作类型，如 [NURSE] / [DOCTOR] */
  workType?: string;
  /** 变更后递增以强制重新拉取趋势 */
  refreshKey?: number;
}

interface TimelineStep {
  assess_score?: number;
  assess_total?: number;
  assess_result?: string;
  assess_color?: string;
  emr_time?: string;
  user_name_list?: string;
}

/** antd Tag 预设色 → Progress strokeColor 可用色值 */
const PRESET_STROKE: Record<string, string> = {
  pink: "#eb2f96",
  red: "#f5222d",
  yellow: "#fadb14",
  orange: "#fa8c16",
  cyan: "#13c2c2",
  green: "#52c41a",
  blue: "#1677ff",
  purple: "#722ed1",
  geekblue: "#2f54eb",
  magenta: "#eb2f96",
  volcano: "#fa541c",
  gold: "#faad14",
  lime: "#a0d911",
  success: "#52c41a",
  processing: "#1677ff",
  error: "#ff4d4f",
  warning: "#faad14",
};

const formatTime = (time?: string) =>
  time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "";

const toTimeValue = (time?: string) => {
  if (!time) return Number.NEGATIVE_INFINITY;
  const ms = dayjs(time).valueOf();
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms;
};

function resolveStrokeColor(color?: string) {
  const key = color?.trim() || "blue";
  if (PRESET_STROKE[key]) return PRESET_STROKE[key];
  return key;
}

function calcPercent(score?: number, total?: number) {
  if (score == null || total == null || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((score / total) * 100)));
}

function TimelineRow({
  step,
  isLast,
}: {
  step: TimelineStep;
  isLast: boolean;
}) {
  const strokeColor = resolveStrokeColor(step.assess_color);
  const hasScore = step.assess_score != null || step.assess_total != null;
  const hasResult = Boolean(step.assess_result?.trim());
  const resultText = hasResult ? step.assess_result!.trim() : "";
  const percent = calcPercent(step.assess_score, step.assess_total);
  const operator = step.user_name_list?.trim() || "";
  const timeText = formatTime(step.emr_time) || "—";

  const scoreTitle = [
    hasScore
      ? `得分 ${step.assess_score ?? ""}${step.assess_total != null ? ` / ${step.assess_total}` : ""}`
      : null,
    resultText || null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative">
      {/* 顶对齐：得分、圆点、进度条上沿齐平 */}
      <div className="flex items-start">
        <div
          className="flex w-18 shrink-0 justify-center"
          title={scoreTitle || undefined}
        >
          {hasScore && step.assess_score != null ? (
            <span
              className="text-xl font-bold tabular-nums leading-none"
              style={{ color: strokeColor }}
            >
              {step.assess_score}
            </span>
          ) : hasResult ? null : (
            <span className="text-[12px] leading-none">—</span>
          )}
        </div>
        <div className="relative flex w-3 shrink-0 justify-center pt-[3px]">
          <span
            className="relative z-1 size-2 shrink-0 rounded-full"
            style={{ backgroundColor: strokeColor }}
            aria-hidden
          />
          {!isLast && (
            <span
              className="absolute top-[11px] bottom-0 left-1/2 w-px -translate-x-1/2 bg-(--app-theme-border)"
              aria-hidden
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-start pt-[4px] pr-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--app-theme-border)">
            <div
              className="h-full rounded-full"
              style={{
                width: `${percent}%`,
                backgroundColor: strokeColor,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-5 items-start pt-1 pb-3">
        <div className="flex w-18 shrink-0 justify-center">
          {hasResult ? (
            <span
              className="max-w-full truncate rounded px-1.5 py-0.5 text-[12px] leading-4 font-semibold text-white"
              style={{ backgroundColor: strokeColor }}
            >
              {resultText}
            </span>
          ) : (
            <span className="h-5" aria-hidden />
          )}
        </div>
        <div className="relative w-3 shrink-0 self-stretch">
          {!isLast && (
            <span
              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-(--app-theme-border)"
              aria-hidden
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden pr-2 text-[12px] leading-5 text-(--app-theme-text-secondary)">
          <span className="shrink-0 whitespace-nowrap">{timeText}</span>
          {operator ? (
            <Typography.Text
              ellipsis={{ tooltip: operator }}
              className="min-w-0! max-w-full! text-[12px]! text-(--app-theme-text-secondary)!"
            >
              {operator}
            </Typography.Text>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * 评估趋势时间线：按评估单名称拉取历史记录，展示得分/结果与进度。
 */
export default function AssessmentTimeline({
  visitId,
  docName,
  docType = "患者评估",
  workType,
  refreshKey = 0,
}: AssessmentTimelineProps) {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visitId || !docName) {
      setSteps([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAssessmentListAPI({
          visit_id: visitId,
          doc_type: docType,
          doc_name: docName,
          // ...(workType ? { work_type: workType } : {}),
        });
        if (cancelled) return;
        const list = (res.row_list ?? []) as Record<string, unknown>[];
        const sorted = [...list].sort(
          (a, b) =>
            toTimeValue(b.emr_time as string | undefined) -
            toTimeValue(a.emr_time as string | undefined),
        );
        setSteps(
          sorted.map((row) => ({
            assess_score:
              typeof row.assess_score === "number"
                ? row.assess_score
                : undefined,
            assess_total:
              typeof row.assess_total === "number"
                ? row.assess_total
                : undefined,
            assess_result:
              typeof row.assess_result === "string"
                ? row.assess_result
                : undefined,
            assess_color:
              typeof row.assess_color === "string"
                ? row.assess_color
                : undefined,
            emr_time:
              typeof row.emr_time === "string" ? row.emr_time : undefined,
            user_name_list:
              typeof row.user_name_list === "string"
                ? row.user_name_list
                : undefined,
          })),
        );
      } catch (error) {
        console.error(error);
        if (!cancelled) setSteps([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [visitId, docName, docType, workType, refreshKey]);

  return (
    <Spin spinning={loading} classNames={{ root: "block" }}>
      {steps.length ? (
        <div className="flex flex-col py-1">
          {steps.map((step, index) => (
            <TimelineRow
              key={`${step.emr_time ?? "t"}-${index}`}
              step={step}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      ) : (
        !loading && (
          <Empty
            description="暂无评估趋势"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )
      )}
    </Spin>
  );
}

export type { AssessmentTimelineProps as AssessmentTimelinePageProps };
