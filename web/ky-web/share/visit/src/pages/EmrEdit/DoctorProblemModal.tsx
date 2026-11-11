import { useEffect, useState } from "react";
import { DatePicker, Form, Input, Modal, message } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { newProblem } from "@/api/clinic";

const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";

export interface DoctorProblemModalProps {
  open: boolean;
  visit_id: number;
  item_id: number;
  item_name?: string;
  onSaved: () => void;
  onCancel: () => void;
}

interface DoctorProblemFormValues {
  begin_time?: Dayjs | null;
  found_time?: Dayjs | null;
  item_name?: string;
  problem_body?: string;
  treat_name?: string;
  treat_code?: string;
  treat_code_system?: string;
}

export default function DoctorProblemModal({
  open,
  visit_id,
  item_id,
  item_name,
  onSaved,
  onCancel,
}: DoctorProblemModalProps) {
  const [form] = Form.useForm<DoctorProblemFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      begin_time: dayjs(),
      found_time: dayjs(),
      item_name: item_name ?? "",
      problem_body: "",
      treat_name: "",
      treat_code: "",
      treat_code_system: "",
    });
  }, [form, item_name, open]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await newProblem({
        visit_id,
        item_id,
        item_name: values.item_name?.trim() ?? "",
        problem_body: values.problem_body?.trim() ?? "",
        treat_name: values.treat_name?.trim() ?? "",
        treat_code: values.treat_code?.trim() ?? "",
        treat_code_system: values.treat_code_system?.trim() ?? "",
        begin_time: values.begin_time?.format(DATETIME_FORMAT) ?? "",
        found_time: values.found_time?.format(DATETIME_FORMAT) ?? "",
      });
      if (res.code !== 0) {
        message.error(res.message || "登记患者问题失败");
        return;
      }
      message.success("登记患者问题成功");
      onSaved();
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }
      message.error(
        error instanceof Error ? error.message : "登记患者问题失败",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="登记患者问题"
      open={open}
      width={640}
      destroyOnHidden
      confirmLoading={saving}
      onOk={() => void handleOk()}
      onCancel={onCancel}
    >
      <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
        <Form.Item name="begin_time" label="开始时间">
          <DatePicker
            showTime={{ format: "HH:mm" }}
            format={DATETIME_FORMAT}
            className="w-full"
          />
        </Form.Item>
        <Form.Item name="found_time" label="发现时间">
          <DatePicker
            showTime={{ format: "HH:mm" }}
            format={DATETIME_FORMAT}
            className="w-full"
          />
        </Form.Item>
        <Form.Item
          name="item_name"
          label="患者问题"
          rules={[
            { required: true, whitespace: true, message: "请输入患者问题" },
          ]}
        >
          <Input.TextArea autoFocus rows={3} placeholder="请输入患者问题" />
        </Form.Item>
        <Form.Item name="problem_body" label="部位">
          <Input placeholder="请输入部位" />
        </Form.Item>
        <Form.Item name="treat_name" label="治疗名称">
          <Input placeholder="治疗名称" />
        </Form.Item>
        <Form.Item name="treat_code" label="治疗编码">
          <Input placeholder="治疗编码" />
        </Form.Item>
        <Form.Item name="treat_code_system" label="编码体系">
          <Input placeholder="编码体系" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
