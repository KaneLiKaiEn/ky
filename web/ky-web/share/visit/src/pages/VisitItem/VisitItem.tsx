import { useEffect, useState } from "react";
import { eventBus } from "../../utils/eventBus";
import {
  INPATIENT_LIST_REFRESH,
  type InPatientListRefreshPayload,
} from "../InPatientList/events";
import { Avatar, Badge, Spin, Tag } from "antd";
import dayjs from "dayjs";
import type { ListMode } from "../InPatientList/type";
import { getTimeTaskCount2API } from "./api";
import { fetchVisitItemById } from "./fetch";
import type { GetTimeTaskCount2Res, VisitItemRow } from "./types";
import { getSessionId } from "comm/session";
import { getInsuranceTagInfo } from "../VisitInfo/VisitInfo";
import { EmrWorkType } from "../EmrWorkspace";

export interface VisitItemProps {
  /**
   * 已组织好的展示数据。
   * 有值时直接使用，不再发起请求。
   */
  data?: VisitItemRow | null;
  /**
   * 就诊 ID。
   * 当 data 为空时，用该 ID 请求完整展示数据
   *（GetVisitProperty + GetAllergyInfo2 + GetDiagList）。
   */
  visitId?: number | null;
  /**
   * 列表模式，影响住院天数计算与展示：
   * - in: 在院天数（当前 - 入院）
   * - out: 出院天数（出院 - 入院，为 0 时记 1）
   * - transfer: 不展示天数
   */
  mode?: ListMode;
  /**
   * 外部加载态（仅在传入 data 的受控场景使用）。
   * 组件自行请求时忽略此值。
   */
  loading?: boolean;
  /** 是否高亮选中，由外部控制 */
  selected?: boolean;
  /** 为 true 时展示完整信息，为 false 时姓氏缩略 */
  collapsed?: boolean;
  /** 自行请求成功后回调 */
  onLoad?: (data: VisitItemRow) => void;
  /** 点击回调（始终回传组织后的 VisitItemRow） */
  onClick?: (data: VisitItemRow) => void;
  /** 工作类型（DOCTOR / NURSE），用于时限任务统计 */
  workType?: EmrWorkType;
  className?: string;
}

interface TimeTaskBadge {
  count: number;
  bgClass: string;
}

const TIME_TASK_BADGE_PRIORITY: Array<{
  key: keyof Pick<
    GetTimeTaskCount2Res,
    | "timeout_count"
    | "expire1_count"
    | "expire2_count"
    | "expire4_count"
    | "expire8_count"
    | "task_count"
  >;
  bgClass: string;
}> = [
  { key: "timeout_count", bgClass: "bg-red-600" },
  { key: "expire1_count", bgClass: "bg-orange-700" },
  { key: "expire2_count", bgClass: "bg-orange-500" },
  { key: "expire4_count", bgClass: "bg-yellow-500" },
  { key: "expire8_count", bgClass: "bg-orange-500" },
  { key: "task_count", bgClass: "bg-green-600" },
];

/** 医保参保地：医保且 insurance_district 以 3502 开头为本地，其余医保为异地 */
const getInsuranceDistrictTag = (
  status?: VisitItemRow["status_property"],
): { text: "本地" | "异地"; color: "cyan" | "blue" } | null => {
  if (status?.insurance_name !== "医保") return null;
  const district = status.insurance_district?.trim() ?? "";
  if (district.startsWith("3502")) {
    return { text: "本地", color: "cyan" };
  }
  return { text: "异地", color: "blue" };
};

const getTimeTaskBadge = (res: GetTimeTaskCount2Res): TimeTaskBadge | null => {
  for (const { key, bgClass } of TIME_TASK_BADGE_PRIORITY) {
    const count = Number(res[key]) || 0;
    if (count > 0) {
      return { count, bgClass };
    }
  }
  return null;
};

const VisitItem = ({
  data,
  visitId,
  mode = "in",
  loading: loadingProp = false,
  selected = false,
  collapsed = false,
  onLoad,
  onClick,
  workType,
  className,
}: VisitItemProps) => {
  const hasData = data != null;
  const [fetched, setFetched] = useState<VisitItemRow | null>(null);
  const [fetching, setFetching] = useState(false);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [timeTaskBadge, setTimeTaskBadge] = useState<TimeTaskBadge | null>(
    null,
  );

  useEffect(() => {
    // data 优先：有外部数据时不请求
    if (hasData) {
      setFetched(null);
      setFetching(false);
      return;
    }

    const id = Number(visitId);
    if (!Number.isFinite(id) || id <= 0) {
      setFetched(null);
      setFetching(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setFetching(true);
      try {
        const row = await fetchVisitItemById(id, mode);
        if (cancelled) return;
        setFetched(row);
        if (row) onLoad?.(row);
      } catch {
        if (!cancelled) setFetched(null);
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [hasData, visitId, mode, reloadSeq]);

  useEffect(() => {
    if (hasData) return;
    return eventBus.on(
      INPATIENT_LIST_REFRESH,
      (payload?: InPatientListRefreshPayload) => {
        const id = Number(visitId);
        if (!Number.isFinite(id) || id <= 0) return;
        if (payload?.visit_id != null && payload.visit_id !== id) return;
        setReloadSeq((seq) => seq + 1);
      },
    );
  }, [hasData, visitId]);

  useEffect(() => {
    const id = Number(visitId);
    if (!workType || !Number.isFinite(id) || id <= 0) {
      setTimeTaskBadge(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const res = await getTimeTaskCount2API({
          visit_id: id,
          rule_type: workType,
        });
        if (cancelled) return;
        setTimeTaskBadge(getTimeTaskBadge(res));
      } catch {
        if (!cancelled) setTimeTaskBadge(null);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [visitId, workType]);

  const row = hasData ? data : fetched;
  const loading = hasData ? loadingProp : fetching;

  if (loading && !row) {
    return (
      <div
        className={[
          "flex items-center justify-center border-b border-(--app-theme-border) px-2 py-2 min-h-[87px]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Spin size="small" />
      </div>
    );
  }

  if (!row) return null;

  const {
    bed_no,
    patient_name,
    age_full,
    visit_no,
    hospital_days,
    diag_list,
    tag_list,
    dept_id,
    ward_id,
    dept_name,
    doctor_name,
    status_property,
    ip_property,
  } = row;
  const bedNo = bed_no || "-";
  const diagText = diag_list?.length ? diag_list.join("、") : "暂无诊断";
  const visitInfoText = [patient_name ?? "-"]
    .filter((v) => v != null && String(v).trim() !== "")
    .join(" ");
  const deptDoctorText = [dept_id !== ward_id ? dept_name : "", doctor_name]
    .filter(Boolean)
    .join("-");
  const visitLineText = [
    visitInfoText,
    deptDoctorText ? `（${deptDoctorText}）` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const getHospitalDaysTag = () => {
    if (mode === "transfer") return null;
    if (mode === "out") {
      const dischargeTime = ip_property?.discharge_time;
      if (!dischargeTime) return { label: "未知" };
      const date = dayjs(dischargeTime);
      if (!date.isValid()) return null;
      return { label: date.format("YYYY-MM-DD"), color: "purple" as const };
    } else {
      const days = hospital_days ?? 0;
      if (mode === "in" && days === 1) {
        return { label: "今日", color: "volcano" as const };
      }
      if (mode === "in" && days === 2) {
        return { label: "昨日", color: "success" as const };
      }
      // 大于 2 天时，显示具体天数
      return { label: `${days}天`, color: "purple" as const };
    }
  };

  /** 在院：今日(红) / 昨日(成功) / {x}天(蓝)；出院：出院日期 */
  const hospitalDaysTag = getHospitalDaysTag();

  const insuranceTag =
    mode === "out" ? null : getInsuranceTagInfo(status_property);
  const insuranceDistrictTag =
    mode === "out" ? null : getInsuranceDistrictTag(status_property);

  if (collapsed) {
    return (
      <div
        className={[
          "table-cell cursor-pointer whitespace-nowrap align-top border-b border-(--app-theme-border) bg-(--app-theme-bg-container) p-2 text-(length:--app-theme-font-default) leading-[1.5715] transition-colors min-w-[278px]",
          selected
            ? // 使用 --app-theme-primary-bg-hover 颜色更加明显
              "bg-(--app-theme-primary-bg-hover)! shadow-[inset_3px_0_0_var(--app-theme-warning)]"
            : "hover:bg-(--app-theme-bg-fill-alter)",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onClick?.(row)}
      >
        <div className="flex items-center gap-2">
          <div className="flex w-12 shrink-0 flex-col">
            <Badge
              count={timeTaskBadge?.count ?? 0}
              size="small"
              offset={[-2, 2]}
              classNames={
                timeTaskBadge ? { indicator: timeTaskBadge.bgClass } : undefined
              }
            >
              <Avatar
                shape="square"
                src={`/api/visit/photo/${encodeURIComponent(getSessionId() ?? "")}/${visitId ?? row.visit_id ?? 0}`}
                alt={patient_name || "患者头像"}
                className="h-12! w-12! rounded-b-none! leading-12! border-0!"
              >
                {patient_name?.slice(0, 1) || "患"}
              </Avatar>
            </Badge>
            <Tag
              color="blue"
              variant="solid"
              className="overflow-hidden rounded-t-none! text-center! text-(length:--app-theme-font-default)! px-0!"
            >
              {bed_no || "-"}
            </Tag>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span
                className="font-medium text-(--app-theme-text)"
                title={visitLineText}
              >
                {visitLineText}
              </span>
            </div>

            <div
              className="text-(length:--app-theme-font-sm) text-(--app-theme-text-secondary)"
              title={diagText}
            >
              {age_full}&nbsp;{visit_no} {diagText}
            </div>

            {(!!tag_list?.length ||
              !!hospitalDaysTag ||
              !!insuranceDistrictTag) && (
              <div className="flex items-center gap-1">
                {hospitalDaysTag && (
                  <Tag color={hospitalDaysTag.color} className="m-0!">
                    {hospitalDaysTag.label}
                  </Tag>
                )}
                {insuranceTag ? (
                  <Tag
                    className="m-0! shrink-0 text-(length:--app-theme-font-sm)"
                    color={insuranceTag.color}
                  >
                    {insuranceTag.text}
                  </Tag>
                ) : null}
                {insuranceDistrictTag ? (
                  <Tag
                    className="m-0! shrink-0 text-(length:--app-theme-font-sm)"
                    color={insuranceDistrictTag.color}
                  >
                    {insuranceDistrictTag.text}
                  </Tag>
                ) : null}
                {tag_list?.map((tag, index) => (
                  <Tag
                    color={tag.color ?? "volcano"}
                    key={`${tag.label}-${index}`}
                    className="m-0!"
                  >
                    {tag.label}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "flex cursor-pointer items-center justify-center py-1 transition-colors mx-auto",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onClick?.(row)}
    >
      <div
        className={[
          "flex h-7 w-7 items-center justify-center rounded-md border text-[12px] font-bold hover:bg-(--app-theme-primary-bg) hover:text-(--app-theme-primary)",
          selected
            ? "border-(--app-theme-primary) bg-(--app-theme-primary) text-white"
            : "border-(--app-theme-bg-layout) bg-(--app-theme-bg-layout) text-(--app-theme-text)",
        ].join(" ")}
      >
        {bedNo}
      </div>
    </div>
  );
};

export default VisitItem;
