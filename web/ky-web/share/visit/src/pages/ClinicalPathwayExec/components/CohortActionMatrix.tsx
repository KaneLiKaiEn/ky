import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Spin, message } from "antd";
import {
  BorderOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  PlusCircleFilled,
} from "@ant-design/icons";
import {
  cancelCohortStepActionAPI,
  deleteCohortExceptionAPI,
  finishCohortStepActionAPI,
  getCohortExceptionListAPI,
  getCohortStepActionListAPI,
  undoCohortStepActionAPI,
} from "@/api/cohort";
import type {
  ClinicalPathwayRole,
  CohortExceptionRow,
  CohortStepActionRow,
  CohortStepRow,
} from "@/types/cohort";
import ExceptionFormModal, {
  type ExceptionFromAction,
} from "./ExceptionFormModal";

/** 医疗 / 护理 / 患者（执行行 & 变异子行共用） */
const WORK_TYPE_GROUPS: {
  label: string;
  value: "DOCTOR" | "NURSE" | "PATIENT";
}[] = [
  { label: "医疗", value: "DOCTOR" },
  { label: "护理", value: "NURSE" },
  { label: "患者", value: "PATIENT" },
];

/** 各角色可操作的执行分类 */
const OPERABLE_ACTION_TYPES: Record<
  ClinicalPathwayRole,
  Array<"DOCTOR" | "NURSE" | "PATIENT">
> = {
  DOCTOR: ["DOCTOR", "PATIENT"],
  NURSE: ["NURSE", "PATIENT"],
};

/** 变异新增：医生/护士均可在对应可操作行上新增 */
const canAddExceptionForRole = (
  role: ClinicalPathwayRole,
  workType: "DOCTOR" | "NURSE" | "PATIENT",
) => OPERABLE_ACTION_TYPES[role].includes(workType);

const hasTime = (time?: string) => Boolean(time && String(time).trim());
const ICON_SIZE = 14;
const EMPTY_ACTION_TYPE = "";
const OPTIONAL_TAG = "[可选]";

const isOptionalAction = (row: { action_tag?: string }) =>
  Boolean(row.action_tag?.includes(OPTIONAL_TAG));

/** stepId -> actions */
type StepActionMap = Record<number, CohortStepActionRow[]>;
/** workType -> stepActionMap（不含变异） */
type WorkTypeActionMap = Partial<
  Record<"DOCTOR" | "NURSE" | "PATIENT", StepActionMap>
>;
/** stepId -> exceptions */
type StepExceptionMap = Record<number, CohortExceptionRow[]>;

/** 按 action_type 分组；空类型用 EMPTY_ACTION_TYPE，不显示「未分类」标题 */
const groupByActionType = <
  T extends { action_type?: string; sort_no?: string },
>(
  rows: T[],
  sortBy?: (a: T, b: T) => number,
) => {
  const sorted = sortBy
    ? [...rows].sort(sortBy)
    : [...rows].sort((a, b) =>
        String(a.sort_no ?? "").localeCompare(String(b.sort_no ?? ""), "zh", {
          numeric: true,
        }),
      );
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const row of sorted) {
    const key = row.action_type?.trim() || EMPTY_ACTION_TYPE;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(row);
  }
  return order.map((type) => ({ type, items: map.get(type)! }));
};

export interface CohortActionMatrixProps {
  cohortId: number;
  stepList: CohortStepRow[];
  roleWorkType: ClinicalPathwayRole;
}

export default function CohortActionMatrix({
  cohortId,
  stepList,
  roleWorkType,
}: CohortActionMatrixProps) {
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [actionMap, setActionMap] = useState<WorkTypeActionMap>({});
  const [exceptionMap, setExceptionMap] = useState<StepExceptionMap>({});
  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<{
    workType: "DOCTOR" | "NURSE" | "PATIENT";
    stepId: number;
    editing?: CohortExceptionRow | null;
    fromAction?: ExceptionFromAction | null;
  } | null>(null);

  const canOperateException = useCallback(
    (workType: "DOCTOR" | "NURSE" | "PATIENT") =>
      canAddExceptionForRole(roleWorkType, workType),
    [roleWorkType],
  );

  const openAddException = (
    workType: "DOCTOR" | "NURSE" | "PATIENT",
    stepId: number,
  ) => {
    setFormTarget({ workType, stepId, editing: null, fromAction: null });
    setFormOpen(true);
  };

  const openEditException = (
    workType: "DOCTOR" | "NURSE" | "PATIENT",
    row: CohortExceptionRow,
  ) => {
    setFormTarget({
      workType,
      stepId: row.step_id,
      editing: row,
      fromAction: null,
    });
    setFormOpen(true);
  };

  /** 作废非可选执行：打开变异登记弹窗 */
  const openCancelException = (
    workType: "DOCTOR" | "NURSE" | "PATIENT",
    row: CohortStepActionRow,
  ) => {
    setFormTarget({
      workType,
      stepId: row.step_id,
      editing: null,
      fromAction: {
        action_id: row.action_id,
        action_type: row.action_type,
        action_name: row.action_name || `执行#${row.action_id}`,
      },
    });
    setFormOpen(true);
  };

  const loadAllActions = useCallback(async () => {
    if (stepList.length === 0) {
      setActionMap({});
      setExceptionMap({});
      return;
    }
    setLoading(true);
    try {
      const nextActions: WorkTypeActionMap = {};
      const nextExceptions: StepExceptionMap = {};

      await Promise.all([
        ...WORK_TYPE_GROUPS.map(async (wt) => {
          const stepMap: StepActionMap = {};
          await Promise.all(
            stepList.map(async (step) => {
              try {
                const res = await getCohortStepActionListAPI({
                  cohort_id: cohortId,
                  step_id: step.step_id,
                  work_type: wt.value,
                });
                stepMap[step.step_id] =
                  res.code === 0 ? (res.row_list ?? []) : [];
              } catch {
                stepMap[step.step_id] = [];
              }
            }),
          );
          nextActions[wt.value] = stepMap;
        }),
        Promise.all(
          stepList.map(async (step) => {
            try {
              const res = await getCohortExceptionListAPI({
                cohort_id: cohortId,
                step_id: step.step_id,
              });
              nextExceptions[step.step_id] =
                res.code === 0 ? (res.row_list ?? []) : [];
            } catch {
              nextExceptions[step.step_id] = [];
            }
          }),
        ),
      ]);

      setActionMap(nextActions);
      setExceptionMap(nextExceptions);
    } finally {
      setLoading(false);
    }
  }, [cohortId, stepList]);

  useEffect(() => {
    void loadAllActions();
  }, [loadAllActions]);

  const handleDeleteException = (row: CohortExceptionRow) => {
    const title =
      row.exception_name || row.exception_type || `变异#${row.exception_id}`;
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除「${title}」吗？`,
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          const res = await deleteCohortExceptionAPI({
            exception_id: row.exception_id,
          });
          if (res.code !== 0) {
            message.error(`${res.message ?? ""}${res.hint ?? ""}`);
            return;
          }
          message.success("删除成功");
          await loadAllActions();
        } catch {
          // ignore
        }
      },
    });
  };

  const canOperate = useCallback(
    (actionWorkType: "DOCTOR" | "NURSE" | "PATIENT") =>
      OPERABLE_ACTION_TYPES[roleWorkType].includes(actionWorkType),
    [roleWorkType],
  );

  const handleFinish = async (actionId: number) => {
    setActingId(actionId);
    try {
      const res = await finishCohortStepActionAPI({
        cohort_id: cohortId,
        action_id: actionId,
      });
      if (res.code !== 0) {
        message.error(`${res.message ?? ""}${res.hint ?? ""}`);
        return;
      }
      message.success("完成成功");
      await loadAllActions();
    } catch {
      // ignore
    } finally {
      setActingId(null);
    }
  };

  const handleUndo = (actionId: number, actionName?: string) => {
    Modal.confirm({
      title: "确认撤销",
      content: `确定要撤销「${actionName || `执行#${actionId}`}」吗？`,
      okText: "撤销",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        setActingId(actionId);
        try {
          const res = await undoCohortStepActionAPI({
            cohort_id: cohortId,
            action_id: actionId,
          });
          if (res.code !== 0) {
            message.error(`${res.message ?? ""}${res.hint ?? ""}`);
            return;
          }
          message.success("撤销成功");
          await loadAllActions();
        } catch {
          // ignore
        } finally {
          setActingId(null);
        }
      },
    });
  };

  const handleCancel = (
    workType: "DOCTOR" | "NURSE" | "PATIENT",
    row: CohortStepActionRow,
  ) => {
    const actionName = row.action_name || `执行#${row.action_id}`;
    const needException = !isOptionalAction(row);
    Modal.confirm({
      title: "确认作废",
      content: `确定要作废「${actionName}」吗？`,
      okText: "作废",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        setActingId(row.action_id);
        try {
          const res = await cancelCohortStepActionAPI({
            cohort_id: cohortId,
            action_id: row.action_id,
          });
          if (res.code !== 0) {
            message.error(`${res.message ?? ""}${res.hint ?? ""}`);
            return;
          }
          message.success("作废成功");
          await loadAllActions();
          // 非可选：作废成功后再登记变异
          if (needException) {
            openCancelException(workType, row);
          }
        } catch {
          // ignore
        } finally {
          setActingId(null);
        }
      },
    });
  };

  const renderStatusIcon = (row: CohortStepActionRow) => {
    if (hasTime(row.cancel_time)) {
      return (
        <CloseCircleFilled style={{ fontSize: ICON_SIZE, color: "#ff4d4f" }} />
      );
    }
    if (hasTime(row.finish_time)) {
      return (
        <CheckCircleFilled style={{ fontSize: ICON_SIZE, color: "#52c41a" }} />
      );
    }
    return <BorderOutlined style={{ fontSize: ICON_SIZE, color: "#bfbfbf" }} />;
  };

  const renderActionItems = (
    actions: CohortStepActionRow[],
    workType: "DOCTOR" | "NURSE" | "PATIENT",
    /** 护理无 action_type 时不显示「未分类」分组标题 */
    hideEmptyTypeLabel: boolean,
  ) => {
    if (actions.length === 0) return null;
    const groups = groupByActionType(actions);
    const operable = canOperate(workType);
    const showTypeLabel = groups.length > 1;

    return (
      <div className="flex flex-col gap-2">
        {groups.map((group) => {
          // 仅一种 action_type 时不显示分组标题；护理无值也不显示「未分类」
          const typeLabel =
            showTypeLabel && group.type
              ? group.type
              : showTypeLabel && !hideEmptyTypeLabel
                ? "未分类"
                : null;
          return (
            <div
              key={group.type || "__empty__"}
              className="flex flex-col gap-1"
            >
              {typeLabel ? (
                <div className="font-medium text-(--app-theme-primary)">
                  {typeLabel}
                </div>
              ) : null}
              {group.items.map((row) => {
                const finished = hasTime(row.finish_time);
                const cancelled = hasTime(row.cancel_time);
                const busy = actingId === row.action_id;
                const canFinish = operable && !finished && !cancelled && !busy;
                const canUndo = operable && (finished || cancelled) && !busy;
                return (
                  <div
                    key={row.action_id}
                    role={canFinish ? "button" : undefined}
                    tabIndex={canFinish ? 0 : undefined}
                    onClick={() => {
                      if (canFinish) void handleFinish(row.action_id);
                    }}
                    onKeyDown={(e) => {
                      if (!canFinish) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        void handleFinish(row.action_id);
                      }
                    }}
                    className={`group relative flex items-center gap-1 rounded px-1 py-0.5 ${
                      canFinish
                        ? "cursor-pointer hover:bg-(--app-theme-bg-fill-alter)"
                        : ""
                    }`}
                  >
                    <span
                      className={`shrink-0 ${canUndo ? "cursor-pointer" : ""}`}
                      onClick={(e) => {
                        if (!canUndo) return;
                        e.stopPropagation();
                        handleUndo(row.action_id, row.action_name);
                      }}
                    >
                      {renderStatusIcon(row)}
                    </span>
                    <div className="flex w-fit max-w-full min-w-0 items-center">
                      <span className="min-w-0 truncate text-(--app-theme-text)">
                        {row.action_name || `执行#${row.action_id}`}
                        {isOptionalAction(row) ? (
                          <span className="text-(--app-theme-text-secondary) text-[11px]">
                            （可选）
                          </span>
                        ) : null}
                      </span>
                      {operable && !finished && !cancelled ? (
                        <Button
                          size="small"
                          danger
                          variant="outlined"
                          loading={busy}
                          className="invisible ml-4 shrink-0 group-hover:visible"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(workType, row);
                          }}
                        >
                          作废
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderActionCell = (
    workType: "DOCTOR" | "NURSE" | "PATIENT",
    stepId: number,
  ) => {
    const actions = actionMap[workType]?.[stepId] ?? [];
    if (actions.length === 0) {
      return <span className="text-(--app-theme-text-secondary)" />;
    }
    return renderActionItems(actions, workType, workType === "NURSE");
  };

  /** 变异某一 work_type 行的单元格（空也占位；可新增时单元格前显示 +） */
  const renderExceptionCell = (
    stepId: number,
    workType: "DOCTOR" | "NURSE" | "PATIENT",
  ) => {
    const rows = (exceptionMap[stepId] ?? []).filter(
      (r) => (r.work_type || "").toUpperCase() === workType,
    );
    const operable = canOperateException(workType);
    const groups =
      rows.length === 0
        ? []
        : groupByActionType(rows, (a, b) =>
            String(a.exception_time ?? "").localeCompare(
              String(b.exception_time ?? ""),
            ),
          );
    const showTypeLabel = groups.length > 1;

    return (
      <div className="flex flex-col gap-1">
        {operable ? (
          <div className="flex items-center">
            <PlusCircleFilled
              className="shrink-0 cursor-pointer"
              style={{ fontSize: ICON_SIZE, color: "#1677ff" }}
              onClick={() => openAddException(workType, stepId)}
            />
          </div>
        ) : null}
        {groups.map((group) => (
          <div key={group.type || "__empty__"} className="flex flex-col gap-1">
            {showTypeLabel && group.type ? (
              <div className="font-medium text-(--app-theme-primary)">
                {group.type}
              </div>
            ) : null}
            {group.items.map((row) => (
              <div
                key={row.exception_id}
                className="group relative flex items-center gap-1 rounded px-1 py-0.5 hover:bg-(--app-theme-bg-fill-alter)"
              >
                <div className="flex w-fit max-w-full min-w-0 items-center">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-(--app-theme-text)">
                      {row.exception_name ||
                        row.exception_type ||
                        `变异#${row.exception_id}`}
                    </span>
                    {row.exception_note ? (
                      <span className="line-clamp-2 text-(--app-theme-text-secondary)">
                        {row.exception_note}
                      </span>
                    ) : null}
                  </div>
                  {operable ? (
                    <div className="invisible ml-4 flex shrink-0 gap-1 group-hover:visible">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => openEditException(workType, row)}
                      >
                        编辑
                      </Button>
                      <Button
                        size="small"
                        danger
                        variant="outlined"
                        onClick={() => handleDeleteException(row)}
                      >
                        删除
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  /** 步骤列默认宽度；左侧两列：分类 + 子分类（变异用） */
  const STEP_COL_WIDTH = 300;
  const LABEL_COL_WIDTH = 40;
  const SUB_LABEL_COL_WIDTH = 40;
  const LEFT_COLS_WIDTH = LABEL_COL_WIDTH + SUB_LABEL_COL_WIDTH;

  const stickyLabelClass =
    "sticky z-10 border-b border-r border-(--app-theme-border) bg-(--app-theme-bg-container) px-1 py-2 font-medium text-(--app-theme-text)";

  return (
    <Spin
      spinning={loading}
      classNames={{
        root: "flex h-full min-h-0 flex-1 flex-col overflow-hidden [&>.ant-spin-container]:min-h-0 [&>.ant-spin-container]:flex-1 [&>.ant-spin-container]:overflow-hidden",
      }}
    >
      <div className="h-full min-h-0 overflow-x-auto overflow-y-auto rounded border border-(--app-theme-border)">
        <table
          className="border-collapse text-sm"
          style={{
            width: LEFT_COLS_WIDTH + stepList.length * STEP_COL_WIDTH,
            minWidth: "100%",
            tableLayout: "fixed",
          }}
        >
          <thead className="sticky top-0 z-10 bg-(--app-theme-bg-container)">
            <tr>
              <th
                colSpan={2}
                className="sticky left-0 z-20 border-b border-r border-(--app-theme-border) bg-(--app-theme-bg-fill-alter) px-2 py-2"
                style={{ width: LEFT_COLS_WIDTH, minWidth: LEFT_COLS_WIDTH }}
              />
              {stepList.map((step) => (
                <th
                  key={step.step_id}
                  className="border-b border-r border-(--app-theme-border) bg-(--app-theme-bg-fill-alter) px-2 py-2 text-center font-medium text-(--app-theme-text) last:border-r-0"
                  style={{ width: STEP_COL_WIDTH, minWidth: STEP_COL_WIDTH }}
                >
                  <div className="truncate">{step.step_name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 医疗 / 护理 / 患者 */}
            {WORK_TYPE_GROUPS.map((wt) => (
              <tr key={wt.value} className="align-top">
                <td
                  colSpan={2}
                  className={`${stickyLabelClass} left-0`}
                  style={{
                    width: LEFT_COLS_WIDTH,
                    minWidth: LEFT_COLS_WIDTH,
                    verticalAlign: "middle",
                    textAlign: "center",
                  }}
                >
                  {wt.label}
                </td>
                {stepList.map((step) => (
                  <td
                    key={`${wt.value}-${step.step_id}`}
                    className="border-b border-r border-(--app-theme-border) px-2 py-2 last:border-r-0"
                    style={{ width: STEP_COL_WIDTH, minWidth: STEP_COL_WIDTH }}
                  >
                    {renderActionCell(wt.value, step.step_id)}
                  </td>
                ))}
              </tr>
            ))}

            {/* 变异：医疗 / 护理 / 患者 各占一行，始终显示 */}
            {WORK_TYPE_GROUPS.map((wt, idx) => (
              <tr key={`exception-${wt.value}`} className="align-top">
                {idx === 0 ? (
                  <td
                    rowSpan={WORK_TYPE_GROUPS.length}
                    className={`${stickyLabelClass} left-0`}
                    style={{
                      width: LABEL_COL_WIDTH,
                      minWidth: LABEL_COL_WIDTH,
                      verticalAlign: "middle",
                      textAlign: "center",
                    }}
                  >
                    变异
                  </td>
                ) : null}
                <td
                  className={`${stickyLabelClass}`}
                  style={{
                    left: LABEL_COL_WIDTH,
                    width: SUB_LABEL_COL_WIDTH,
                    minWidth: SUB_LABEL_COL_WIDTH,
                    verticalAlign: "middle",
                    textAlign: "center",
                  }}
                >
                  {wt.label}
                </td>
                {stepList.map((step) => (
                  <td
                    key={`exception-${wt.value}-${step.step_id}`}
                    className="border-b border-r border-(--app-theme-border) px-2 py-2 last:border-r-0"
                    style={{ width: STEP_COL_WIDTH, minWidth: STEP_COL_WIDTH }}
                  >
                    {renderExceptionCell(step.step_id, wt.value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {formTarget ? (
        <ExceptionFormModal
          open={formOpen}
          cohortId={cohortId}
          stepId={formTarget.stepId}
          workType={formTarget.workType}
          editing={formTarget.editing}
          fromAction={formTarget.fromAction}
          onClose={() => {
            setFormOpen(false);
            setFormTarget(null);
          }}
          onSuccess={() => {
            void loadAllActions();
          }}
        />
      ) : null}
    </Spin>
  );
}
