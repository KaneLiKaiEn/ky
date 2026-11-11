import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Listy,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  deleteDiseaseStepActionAPI,
  deleteDiseaseStepAPI,
  getDiseaseStepActionListAPI,
  getDiseaseStepActionPropertyAPI,
  getDiseaseStepListAPI,
  getDiseaseStepPropertyAPI,
  newDiseaseStepActionAPI,
  newDiseaseStepAPI,
  saveDiseaseStepActionPropertyAPI,
  saveDiseaseStepPropertyAPI,
} from "@/api/cohort";
import type { DiseaseStepActionRow, DiseaseStepRow } from "@/types/cohort";
import {
  ACTION_TAG_OPTIONS,
  STEP_DATE_REF_OPTIONS,
  STEP_WORK_TYPE_GROUPS,
  type StepWorkType,
} from "./constants";
import { useActionTypeOptions } from "./useActionTypeOptions";
import { parseBracketTags, toBracketTags } from "./utils";

const normalizeWorkType = (value?: string): StepWorkType | null => {
  const wt = (value || "").toUpperCase();
  if (wt === "DOCTOR" || wt === "NURSE" || wt === "PATIENT") return wt;
  return null;
};

interface StepFormValues {
  date_ref?: string;
  date_start?: number | null;
  date_end?: number | null;
  step_name?: string;
  step_tag?: string;
  step_note?: string;
  sort_no?: string;
}

interface ActionFormValues {
  action_type?: string;
  action_name?: string;
  action_stmt?: string;
  action_tags?: string[];
  action_note?: string;
  sort_no?: string;
}

export interface DiseaseStepModalProps {
  open: boolean;
  diseaseId: number;
  diseaseName?: string;
  workType?: string;
  onCancel: () => void;
}

const sortBySortNo = <T extends { sort_no?: string }>(rows: T[]) =>
  [...rows].sort((a, b) =>
    String(a.sort_no ?? "").localeCompare(String(b.sort_no ?? ""), "zh", {
      numeric: true,
    }),
  );

const formatDateRefLabel = (value?: string) =>
  STEP_DATE_REF_OPTIONS.find((item) => item.value === value)?.label ??
  value ??
  "-";

const formatStepSubtitle = (step: DiseaseStepRow) => {
  const refLabel = formatDateRefLabel(step.date_ref);
  const start = step.date_start ?? 0;
  const end = step.date_end ?? 0;
  const range =
    start === end ? `第 ${start} 天` : `第 ${start} ~ ${end} 天`;
  return `${refLabel} · ${range}`;
};

const canEditActionColumn = (
  columnWorkType: StepWorkType,
  workType?: string,
) => {
  if (columnWorkType === "PATIENT") return true;
  return workType === columnWorkType;
};

const ACTION_COLUMN_META: Record<
  StepWorkType,
  { label: string; tagColor: string }
> = {
  DOCTOR: { label: "医疗", tagColor: "blue" },
  NURSE: { label: "护理", tagColor: "green" },
  PATIENT: { label: "患者", tagColor: "orange" },
};

const ACTION_CARD_CLASS =
  "flex h-full min-h-0 flex-col overflow-hidden [&_.ant-card-body]:flex [&_.ant-card-body]:min-h-0 [&_.ant-card-body]:flex-1 [&_.ant-card-body]:flex-col [&_.ant-card-body]:overflow-hidden [&_.ant-card-body]:p-0! [&_.ant-card-head]:px-2! [&_.ant-card-head]:py-2!";

const DiseaseStepModal = ({
  open,
  diseaseId,
  diseaseName,
  workType,
  onCancel,
}: DiseaseStepModalProps) => {
  const { message, modal } = App.useApp();
  const [stepForm] = Form.useForm<StepFormValues>();
  const [actionForm] = Form.useForm<ActionFormValues>();
  const { actionTypeOptions } = useActionTypeOptions(open);

  const [steps, setSteps] = useState<DiseaseStepRow[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);

  const [actions, setActions] = useState<DiseaseStepActionRow[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [selectedActionKey, setSelectedActionKey] = useState<string | null>(
    null,
  );

  const [stepFormOpen, setStepFormOpen] = useState(false);
  const [stepFormMode, setStepFormMode] = useState<"create" | "edit">("create");
  const [stepSaving, setStepSaving] = useState(false);

  const [actionFormOpen, setActionFormOpen] = useState(false);
  const [actionFormMode, setActionFormMode] = useState<"create" | "edit">(
    "create",
  );
  const [actionFormWorkType, setActionFormWorkType] =
    useState<StepWorkType>("DOCTOR");
  const [actionSaving, setActionSaving] = useState(false);
  const [actionPropertyLoading, setActionPropertyLoading] = useState(false);
  const [editingAction, setEditingAction] =
    useState<DiseaseStepActionRow | null>(null);

  const selectedStep = useMemo(
    () => steps.find((item) => item.step_id === selectedStepId) ?? null,
    [selectedStepId, steps],
  );

  const actionsByWorkType = useMemo(() => {
    const map: Record<StepWorkType, DiseaseStepActionRow[]> = {
      DOCTOR: [],
      NURSE: [],
      PATIENT: [],
    };
    for (const row of sortBySortNo(actions)) {
      const wt = normalizeWorkType(row.work_type);
      if (wt) map[wt].push(row);
    }
    return map;
  }, [actions]);

  const selectedAction = useMemo(() => {
    if (!selectedActionKey) return null;
    const [wt, idText] = selectedActionKey.split(":");
    const actionId = Number(idText);
    if (!wt || Number.isNaN(actionId)) return null;
    return (
      actionsByWorkType[wt as StepWorkType]?.find(
        (item) => item.action_id === actionId,
      ) ?? null
    );
  }, [actionsByWorkType, selectedActionKey]);

  const loadSteps = useCallback(async () => {
    setStepsLoading(true);
    try {
      const res = await getDiseaseStepListAPI({
        disease_id: diseaseId,
        disease_version: 0,
      });
      const next = sortBySortNo(res.row_list ?? []);
      setSteps(next);
      setSelectedStepId((prev) => {
        if (prev != null && next.some((item) => item.step_id === prev)) {
          return prev;
        }
        return next[0]?.step_id ?? null;
      });
    } catch {
      setSteps([]);
      setSelectedStepId(null);
    } finally {
      setStepsLoading(false);
    }
  }, [diseaseId]);

  const loadActions = useCallback(async () => {
    if (selectedStepId == null) {
      setActions([]);
      setSelectedActionKey(null);
      return;
    }
    setActionsLoading(true);
    try {
      const res = await getDiseaseStepActionListAPI({
        disease_id: diseaseId,
        disease_version: 0,
        step_id: selectedStepId,
      });
      setActions(res.row_list ?? []);
      setSelectedActionKey(null);
    } catch {
      setActions([]);
      setSelectedActionKey(null);
    } finally {
      setActionsLoading(false);
    }
  }, [diseaseId, selectedStepId]);

  useEffect(() => {
    if (!open) {
      setSteps([]);
      setActions([]);
      setSelectedStepId(null);
      setSelectedActionKey(null);
      return;
    }
    void loadSteps();
  }, [loadSteps, open]);

  useEffect(() => {
    if (!open) return;
    void loadActions();
  }, [loadActions, open]);

  const openCreateStep = () => {
    setStepFormMode("create");
    stepForm.resetFields();
    stepForm.setFieldsValue({
      date_ref: "ENTER",
      date_start: 0,
      date_end: 0,
      step_name: "",
      sort_no: "",
    });
    setStepFormOpen(true);
  };

  const openEditStep = async () => {
    if (selectedStepId == null) {
      message.warning("请先选择步骤");
      return;
    }
    setStepFormMode("edit");
    setStepFormOpen(true);
    try {
      const res = await getDiseaseStepPropertyAPI({
        step_id: selectedStepId,
        disease_version: 0,
      });
      const property = res.step_property ?? selectedStep ?? {};
      stepForm.setFieldsValue({
        date_ref: property.date_ref,
        date_start: property.date_start,
        date_end: property.date_end,
        step_name: property.step_name,
        step_tag: property.step_tag,
        step_note: property.step_note,
        sort_no: property.sort_no,
      });
    } catch {
      if (selectedStep) {
        stepForm.setFieldsValue({
          date_ref: selectedStep.date_ref,
          date_start: selectedStep.date_start,
          date_end: selectedStep.date_end,
          step_name: selectedStep.step_name,
          step_tag: selectedStep.step_tag,
          step_note: selectedStep.step_note,
          sort_no: selectedStep.sort_no,
        });
      }
    }
  };

  const handleDeleteStep = () => {
    if (selectedStepId == null) {
      message.warning("请先选择步骤");
      return;
    }
    modal.confirm({
      title: "确认删除",
      content: `确定删除步骤「${selectedStep?.step_name || selectedStepId}」吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteDiseaseStepAPI({ step_id: selectedStepId });
        message.success("删除成功");
        await loadSteps();
        setSelectedActionKey(null);
      },
    });
  };

  const submitStepForm = async () => {
    const values = await stepForm.validateFields();
    setStepSaving(true);
    try {
      if (stepFormMode === "create") {
        const res = await newDiseaseStepAPI({
          disease_id: diseaseId,
          disease_version: 0,
          date_ref: values.date_ref ?? "ENTER",
          date_start: values.date_start ?? 0,
          date_end: values.date_end ?? 0,
          step_name: values.step_name,
          step_tag: values.step_tag,
          step_note: values.step_note,
          sort_no: values.sort_no,
        });
        message.success("新增成功");
        setStepFormOpen(false);
        await loadSteps();
        if (res.step_id != null) setSelectedStepId(res.step_id);
        return;
      }
      if (selectedStepId == null) return;
      await saveDiseaseStepPropertyAPI({
        step_id: selectedStepId,
        step_property: {
          ...selectedStep,
          date_ref: values.date_ref,
          date_start: values.date_start ?? undefined,
          date_end: values.date_end ?? undefined,
          step_name: values.step_name,
          step_tag: values.step_tag,
          step_note: values.step_note,
          sort_no: values.sort_no,
        },
      });
      message.success("保存成功");
      setStepFormOpen(false);
      await loadSteps();
    } finally {
      setStepSaving(false);
    }
  };

  const openCreateAction = (columnWorkType: StepWorkType) => {
    if (selectedStepId == null) {
      message.warning("请先选择步骤");
      return;
    }
    const typeOptions = actionTypeOptions[columnWorkType];
    setActionFormMode("create");
    setActionFormWorkType(columnWorkType);
    setEditingAction(null);
    actionForm.resetFields();
    actionForm.setFieldsValue({
      sort_no: "",
      action_tags: [],
      action_type: typeOptions[0]?.value,
    });
    setActionFormOpen(true);
  };

  const fillActionForm = (property: DiseaseStepActionRow) => {
    actionForm.setFieldsValue({
      action_type: property.action_type,
      action_name: property.action_name,
      action_stmt: property.action_stmt,
      action_tags: parseBracketTags(property.action_tag),
      action_note: property.action_note,
      sort_no: property.sort_no,
    });
  };

  const openEditAction = async (columnWorkType: StepWorkType) => {
    if (
      !selectedAction ||
      normalizeWorkType(selectedAction.work_type) !== columnWorkType
    ) {
      message.warning("请先选择要编辑的动作");
      return;
    }
    if (selectedAction.action_id == null) return;

    setActionFormMode("edit");
    setActionFormWorkType(columnWorkType);
    setActionFormOpen(true);
    setActionPropertyLoading(true);
    actionForm.resetFields();

    try {
      const res = await getDiseaseStepActionPropertyAPI({
        action_id: selectedAction.action_id,
        disease_version: 0,
      });
      const property = res.action_property ?? selectedAction;
      setEditingAction(property);
      fillActionForm(property);
    } catch {
      setEditingAction(selectedAction);
      fillActionForm(selectedAction);
    } finally {
      setActionPropertyLoading(false);
    }
  };

  const handleDeleteAction = (columnWorkType: StepWorkType) => {
    if (
      !selectedAction ||
      normalizeWorkType(selectedAction.work_type) !== columnWorkType
    ) {
      message.warning("请先选择要删除的动作");
      return;
    }
    if (selectedAction.action_id == null) return;
    modal.confirm({
      title: "确认删除",
      content: `确定删除动作「${selectedAction.action_name || selectedAction.action_id}」吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteDiseaseStepActionAPI({
          action_id: selectedAction.action_id as number,
        });
        message.success("删除成功");
        setSelectedActionKey(null);
        await loadActions();
      },
    });
  };

  const submitActionForm = async () => {
    if (selectedStepId == null) return;
    const values = await actionForm.validateFields();
    const actionTag = toBracketTags(values.action_tags);
    setActionSaving(true);
    try {
      if (actionFormMode === "create") {
        await newDiseaseStepActionAPI({
          disease_id: diseaseId,
          disease_version: 0,
          step_id: selectedStepId,
          work_type: actionFormWorkType,
          action_type: values.action_type,
          action_name: values.action_name,
          action_stmt: values.action_stmt,
          action_tag: actionTag,
          action_note: values.action_note,
          sort_no: values.sort_no,
        });
        message.success("新增成功");
      } else if (editingAction?.action_id != null) {
        await saveDiseaseStepActionPropertyAPI({
          action_id: editingAction.action_id,
          action_property: {
            ...editingAction,
            work_type: actionFormWorkType,
            action_type: values.action_type,
            action_name: values.action_name,
            action_stmt: values.action_stmt,
            action_tag: actionTag,
            action_note: values.action_note,
            sort_no: values.sort_no,
          },
        });
        message.success("保存成功");
      }
      setActionFormOpen(false);
      setEditingAction(null);
      await loadActions();
    } finally {
      setActionSaving(false);
    }
  };

  const renderActionColumn = (columnWorkType: StepWorkType) => {
    const meta = ACTION_COLUMN_META[columnWorkType];
    const editable = canEditActionColumn(columnWorkType, workType);
    const rows = actionsByWorkType[columnWorkType];
    const columnSelected =
      normalizeWorkType(selectedAction?.work_type) === columnWorkType
        ? selectedAction
        : null;

    return (
      <Card
        key={columnWorkType}
        size="small"
        className={`${ACTION_CARD_CLASS} min-w-0 flex-1`}
        title={
          <Tag color={meta.tagColor} className="m-0!">
            {meta.label}
          </Tag>
        }
        extra={
          editable ? (
            <Space size={2}>
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                aria-label="新增动作"
                title="新增"
                onClick={() => openCreateAction(columnWorkType)}
              />
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                aria-label="编辑动作"
                title="编辑"
                disabled={!columnSelected}
                onClick={() => void openEditAction(columnWorkType)}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label="删除动作"
                title="删除"
                disabled={!columnSelected}
                onClick={() => handleDeleteAction(columnWorkType)}
              />
            </Space>
          ) : null
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <Empty
              className="py-2"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无动作"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((row) => {
                const active =
                  row.action_id != null &&
                  selectedActionKey === `${columnWorkType}:${row.action_id}`;
                const title = row.action_name || `动作 ${row.action_id}`;
                const subTitle =
                  row.action_type?.trim() ||
                  row.action_stmt?.trim() ||
                  row.action_note ||
                  "—";

                return (
                  <div
                    key={row.action_id}
                    onClick={() =>
                      setSelectedActionKey(
                        `${columnWorkType}:${row.action_id}`,
                      )
                    }
                    className={[
                      "cursor-pointer rounded px-2 py-2",
                      active
                        ? "bg-(--app-theme-primary-bg)!"
                        : "hover:bg-(--app-theme-bg-fill-alter)!",
                    ].join(" ")}
                  >
                    <div className="min-w-0 flex flex-col gap-2">
                      <div
                        className="truncate text-(--app-theme-text)"
                        title={title}
                      >
                        {title}
                      </div>
                      <div
                        className="truncate text-(--app-theme-text-secondary)"
                        title={subTitle}
                      >
                        {subTitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderStepItem = (row: DiseaseStepRow) => {
    const active = row.step_id === selectedStepId;
    const title = row.step_name || `步骤 ${row.step_id}`;
    const subTitle = formatStepSubtitle(row);

    return (
      <div
        onClick={() => {
          setSelectedStepId(row.step_id ?? null);
          setSelectedActionKey(null);
        }}
        className={[
          "cursor-pointer px-2 py-2",
          active
            ? "bg-(--app-theme-primary-bg)!"
            : "hover:bg-(--app-theme-bg-fill-alter)!",
        ].join(" ")}
      >
        <div className="min-w-0 flex flex-col gap-2">
          <div
            className="truncate text-(--app-theme-text)"
            title={title}
          >
            {title}
          </div>
          <div
            className="truncate text-(--app-theme-text-secondary)"
            title={subTitle}
          >
            {subTitle}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        title={diseaseName ? `路径 — ${diseaseName}` : "路径"}
        open={open}
        onCancel={onCancel}
        footer={null}
        width="95%"
        destroyOnHidden
        styles={{ body: { padding: 8 } }}
      >
        <div className="flex h-[70vh] min-h-0 gap-2">
          <section className="flex w-72 shrink-0 flex-col overflow-hidden rounded border border-(--app-theme-border) bg-(--app-theme-bg-container)">
            <div className="flex shrink-0 items-center gap-2 border-b border-(--app-theme-border) p-2">
              <span className="min-w-0 flex-1 truncate font-medium">
                步骤
              </span>
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                aria-label="新增步骤"
                title="新增"
                onClick={openCreateStep}
              />
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                aria-label="编辑步骤"
                title="编辑"
                disabled={selectedStepId == null}
                onClick={() => void openEditStep()}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label="删除步骤"
                title="删除"
                disabled={selectedStepId == null}
                onClick={handleDeleteStep}
              />
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                aria-label="刷新步骤"
                title="刷新"
                loading={stepsLoading}
                onClick={() => void loadSteps()}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <Spin spinning={stepsLoading}>
                {steps.length === 0 && !stepsLoading ? (
                  <Empty className="py-2" description="暂无步骤" />
                ) : (
                  <Listy<DiseaseStepRow>
                    items={steps}
                    rowKey={(row) => String(row.step_id ?? "")}
                    className="overflow-visible"
                    styles={{ item: { padding: 0 } }}
                    itemRender={renderStepItem}
                  />
                )}
              </Spin>
            </div>
          </section>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {selectedStepId == null ? (
              <div className="flex h-full items-center justify-center rounded border border-dashed border-(--app-theme-border) bg-(--app-theme-bg-container)">
                <Empty description="请选择左侧步骤" />
              </div>
            ) : (
              <Spin
                spinning={actionsLoading}
                classNames={
                  { root: "h-full [&>.ant-spin-container]:h-full" }
                }
              >
                <div className="grid h-full min-h-0 grid-cols-3 gap-2">
                  {STEP_WORK_TYPE_GROUPS.map(({ value }) =>
                    renderActionColumn(value),
                  )}
                </div>
              </Spin>
            )}
          </section>
        </div>
      </Modal>

      <Modal
        title={stepFormMode === "create" ? "新增步骤" : "编辑步骤"}
        open={stepFormOpen}
        onCancel={() => setStepFormOpen(false)}
        onOk={() => void submitStepForm()}
        confirmLoading={stepSaving}
        destroyOnHidden
      >
        <Form form={stepForm} layout="vertical" preserve={false}>
          <Form.Item
            label="时间基准"
            name="date_ref"
            rules={[{ required: true, message: "请选择时间基准" }]}
          >
            <Select options={STEP_DATE_REF_OPTIONS} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-2">
            <Form.Item label="起始" name="date_start">
              <InputNumber className="w-full" placeholder="起始" />
            </Form.Item>
            <Form.Item label="结束" name="date_end">
              <InputNumber className="w-full" placeholder="结束" />
            </Form.Item>
          </div>
          <Form.Item
            label="名称"
            name="step_name"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="名称" />
          </Form.Item>
          <Form.Item label="标识" name="step_tag">
            <Input placeholder="标识" />
          </Form.Item>
          <Form.Item label="备注" name="step_note">
            <Input.TextArea rows={2} placeholder="备注" />
          </Form.Item>
          <Form.Item label="排序号" name="sort_no">
            <Input placeholder="排序号" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${actionFormMode === "create" ? "新增" : "编辑"}${STEP_WORK_TYPE_GROUPS.find((item) => item.value === actionFormWorkType)?.label ?? ""}执行动作`}
        open={actionFormOpen}
        onCancel={() => {
          setActionFormOpen(false);
          setEditingAction(null);
        }}
        onOk={() => void submitActionForm()}
        confirmLoading={actionSaving}
        destroyOnHidden
      >
        <Spin spinning={actionPropertyLoading}>
          <Form form={actionForm} layout="vertical" preserve={false}>
            <Form.Item
              label="名称"
              name="action_name"
              rules={[{ required: true, message: "请输入名称" }]}
            >
              <Input placeholder="名称" />
            </Form.Item>
            <Form.Item
              label="分类"
              name="action_type"
              rules={[{ required: true, message: "请选择分类" }]}
            >
              <Select options={actionTypeOptions[actionFormWorkType]} />
            </Form.Item>
            <Form.Item label="语句" name="action_stmt">
              <Input.TextArea rows={3} placeholder="语句" />
            </Form.Item>
            <Form.Item label="标识" name="action_tags">
              <Checkbox.Group options={ACTION_TAG_OPTIONS} />
            </Form.Item>
            <Form.Item label="备注" name="action_note">
              <Input.TextArea rows={2} placeholder="备注" />
            </Form.Item>
            <Form.Item label="排序号" name="sort_no">
              <Input placeholder="排序号" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
};

export default DiseaseStepModal;
