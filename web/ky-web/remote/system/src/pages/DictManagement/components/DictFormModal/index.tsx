import React, { useEffect, useState } from "react";
import { App, Form, Input, Modal } from "antd";
import { newDict2, saveDict2Property } from "@/api/sys";
import type { Dict2Row } from "@/types/sys";
import { FORM_LAYOUT } from "../../constants";

interface DictFormModalProps {
  open: boolean;
  orgId?: number;
  editingRecord?: Dict2Row | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const DictFormModal: React.FC<DictFormModalProps> = ({
  open,
  orgId,
  editingRecord,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<Dict2Row>();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = editingRecord?.dict_id != null;

  useEffect(() => {
    if (!open) return;
    if (editingRecord) {
      form.setFieldsValue(editingRecord);
    } else {
      form.resetFields();
    }
  }, [open, editingRecord, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit && editingRecord?.dict_id != null) {
        await saveDict2Property({
          dict_id: editingRecord.dict_id,
          dict_property: { ...editingRecord, ...values },
        });
        message.success("保存成功");
      } else {
        if (orgId == null) {
          message.error("请先选择机构");
          return;
        }
        await newDict2({
          version_no: 1,
          org_id: orgId,
          catalog_id: 0,
          ...values,
        });
        message.success("新增成功");
      }

      onSuccess();
    } catch {
      // 校验失败或接口错误由拦截器处理
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "编辑字典" : "新增字典"}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      destroyOnHidden
      width={520}
    >
      <Form form={form} {...FORM_LAYOUT}>
        <Form.Item
          name="dict_name"
          label="名称"
          rules={[{ required: true, message: "请输入名称" }]}
        >
          <Input placeholder="请输入名称" />
        </Form.Item>
        <Form.Item name="dict_code" label="编码">
          <Input placeholder="请输入编码" />
        </Form.Item>
        <Form.Item name="dict_no" label="编号">
          <Input placeholder="请输入编号" />
        </Form.Item>
        <Form.Item name="dict_tag" label="标签">
          <Input placeholder="请输入标签" />
        </Form.Item>
        <Form.Item name="sort_no" label="排序">
          <Input placeholder="请输入排序" />
        </Form.Item>
        <Form.Item name="dict_note" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DictFormModal;
