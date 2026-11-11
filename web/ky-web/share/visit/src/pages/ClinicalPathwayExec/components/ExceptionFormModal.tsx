import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, message } from "antd";
import { getSessionInfo } from "comm/session";
import {
  newCohortExceptionAPI,
  saveCohortExceptionPropertyAPI,
} from "@/api/cohort";
import { retrieveDict2Data } from "@/api/sys";
import type { CohortExceptionRow } from "@/types/cohort";

/** 作废必选执行时带入，锁定 action_id / action_type */
export interface ExceptionFromAction {
  action_id: number;
  action_type: string;
  action_name: string;
}

export interface ExceptionFormModalProps {
  open: boolean;
  cohortId: number;
  stepId: number;
  workType: "DOCTOR" | "NURSE" | "PATIENT";
  /** 编辑时传入；新增时为空 */
  editing?: CohortExceptionRow | null;
  /** 作废非可选执行时传入，仅填变异类型/名称 */
  fromAction?: ExceptionFromAction | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  exception_name: string;
  exception_type: string;
  action_type?: string;
}

interface Dict2Item {
  item_name?: string;
  item_tag?: string;
}

export default function ExceptionFormModal({
  open,
  cohortId,
  stepId,
  workType,
  editing,
  fromAction,
  onClose,
  onSuccess,
}: ExceptionFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [actionTypeOptions, setActionTypeOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [exceptionTypeOptions, setExceptionTypeOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const isEdit = Boolean(editing?.exception_id);
  const isFromAction = Boolean(fromAction?.action_id);
  const workTypeLabel =
    workType === "DOCTOR" ? "医疗" : workType === "NURSE" ? "护理" : "患者";

  useEffect(() => {
    if (!open) return;

    if (isEdit && editing) {
      form.setFieldsValue({
        exception_name: editing.exception_name ?? "",
        exception_type: editing.exception_type ?? "",
        action_type: editing.action_type ?? "",
      });
    } else if (isFromAction && fromAction) {
      form.resetFields();
      form.setFieldsValue({
        exception_name: fromAction.action_name || "",
        exception_type: undefined,
      });
    } else {
      form.resetFields();
    }

    void (async () => {
      const session = await getSessionInfo();
      const orgId = Number(session?.org_id);
      if (!Number.isFinite(orgId) || orgId <= 0) {
        setExceptionTypeOptions([]);
        setActionTypeOptions([]);
        return;
      }

      const exceptionRes = await retrieveDict2Data({
        org_id: orgId,
        dict_code: "exception_type",
        dict_name: "变异类型",
      });
      if (exceptionRes.code === 0) {
        setExceptionTypeOptions(
          ((exceptionRes.row_list ?? []) as Dict2Item[]).map((item) => ({
            label: item.item_name ?? "",
            value: item.item_name ?? "",
          })),
        );
      } else {
        setExceptionTypeOptions([]);
      }

      if (!isFromAction && !isEdit) {
        const actionRes = await retrieveDict2Data({
          org_id: orgId,
          dict_code: "action.type",
          dict_name: "执行类型",
        });
        if (actionRes.code === 0) {
          const tag = `[${workType}]`;
          setActionTypeOptions(
            ((actionRes.row_list ?? []) as Dict2Item[])
              .filter((item) => item.item_tag?.includes(tag))
              .map((item) => ({
                label: item.item_name ?? "",
                value: item.item_name ?? "",
              })),
          );
        } else {
          setActionTypeOptions([]);
        }
      }
    })();
  }, [open, form, isEdit, editing, isFromAction, fromAction, workType]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (isEdit && editing) {
        const res = await saveCohortExceptionPropertyAPI({
          exception_id: editing.exception_id,
          exception_property: {
            ...editing,
            exception_name: values.exception_name,
            exception_type: values.exception_type,
            action_type: values.action_type,
          },
        });
        if (res.code !== 0) {
          message.error(`${res.message ?? ""}${res.hint ?? ""}`);
          return;
        }
        message.success("保存成功");
      } else {
        const res = await newCohortExceptionAPI({
          cohort_id: cohortId,
          step_id: stepId,
          ...(isFromAction
            ? {
                action_id: fromAction!.action_id,
                action_type: fromAction!.action_type,
              }
            : {
                action_type: values.action_type ?? "",
              }),
          work_type: workType,
          exception_name: values.exception_name,
          exception_type: values.exception_type,
        });
        if (res.code !== 0) {
          message.error(`${res.message ?? ""}${res.hint ?? ""}`);
          return;
        }
        message.success(isFromAction ? "登记变异成功" : "新增变异成功");
      }
      onSuccess();
      onClose();
    } catch {
      // validate / network
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit
    ? `编辑变异（${workTypeLabel}）`
    : isFromAction
      ? `作废登记变异（${workTypeLabel}）`
      : `新增变异（${workTypeLabel}）`;

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={() => void handleOk()}
      confirmLoading={saving}
      destroyOnHidden
      okText="确定"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" className="mt-2">
        <Form.Item
          name="exception_name"
          label="变异名称"
          rules={[{ required: true, message: "请输入变异名称" }]}
        >
          <Input placeholder="请输入变异名称" allowClear />
        </Form.Item>
        <Form.Item
          name="exception_type"
          label="变异类型"
          rules={[{ required: true, message: "请选择变异类型" }]}
        >
          <Select
            placeholder="请选择变异类型"
            allowClear
            showSearch
            optionFilterProp="label"
            options={exceptionTypeOptions}
          />
        </Form.Item>
        {!isEdit && !isFromAction ? (
          <Form.Item
            name="action_type"
            label="执行类型"
            rules={[{ required: true, message: "请选择执行类型" }]}
          >
            <Select
              placeholder="请选择执行类型"
              allowClear
              showSearch
              optionFilterProp="label"
              options={actionTypeOptions}
            />
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  );
}
