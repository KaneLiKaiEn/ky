import React, { useEffect, useState } from "react";
import { App, Form, Input, Modal, Space } from "antd";
import { newDict2Item, saveDict2ItemProperty } from "@/api/sys";
import type { Dict2ItemRow } from "@/types/sys";
import { FORM_LAYOUT } from "../../constants";
import { useSourceSearch } from "../../hooks/useSourceSearch";
import type { SourceItemOption } from "../../types";
import SourceFillBar from "./SourceFillBar";

interface DictItemFormModalProps {
  open: boolean;
  dictId?: number;
  orgId?: number;
  editingRecord?: Dict2ItemRow | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const DictItemFormModal: React.FC<DictItemFormModalProps> = ({
  open,
  dictId,
  orgId,
  editingRecord,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<Dict2ItemRow>();
  const [submitting, setSubmitting] = useState(false);
  const sourceSearch = useSourceSearch(orgId);
  const { reset: resetSourceSearch } = sourceSearch;
  const isEdit = editingRecord?.row_id != null;

  useEffect(() => {
    if (!open) return;
    resetSourceSearch();
    if (editingRecord) {
      form.setFieldsValue(editingRecord);
    } else {
      form.resetFields();
    }
  }, [open, editingRecord, form, resetSourceSearch]);

  const handleSelectSourceItem = (
    value?: string,
    option?: SourceItemOption | SourceItemOption[],
  ) => {
    sourceSearch.setValue(value);
    if (value == null) return;
    const opt = Array.isArray(option) ? option[0] : option;
    if (opt?.fill) {
      form.resetFields();
      form.setFieldsValue(opt.fill);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit && editingRecord?.row_id != null) {
        await saveDict2ItemProperty({
          row_id: editingRecord.row_id,
          item_property: { ...editingRecord, ...values },
        });
        message.success("保存成功");
      } else {
        if (dictId == null) {
          message.error("缺少字典信息");
          return;
        }
        await newDict2Item({ version_no: 1, dict_id: dictId, ...values });
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
      title={isEdit ? "编辑字典项" : "新增字典项"}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      destroyOnHidden
      width={640}
      footer={(_, { OkBtn, CancelBtn }) => (
        <div className="flex w-full items-center justify-between gap-2">
          <SourceFillBar
            source={sourceSearch.source}
            value={sourceSearch.value}
            options={sourceSearch.options}
            searching={sourceSearch.searching}
            onSourceChange={sourceSearch.changeSource}
            onSearch={sourceSearch.search}
            onSelect={handleSelectSourceItem}
          />
          <Space>
            <CancelBtn />
            <OkBtn />
          </Space>
        </div>
      )}
    >
      <Form form={form} {...FORM_LAYOUT}>
        <Form.Item name="item_id" hidden>
          <Input />
        </Form.Item>
        <Form.Item
          name="item_name"
          label="名称"
          rules={[{ required: true, message: "请输入名称" }]}
        >
          <Input placeholder="请输入名称" />
        </Form.Item>
        <Form.Item name="item_code" label="编码">
          <Input placeholder="请输入编码" />
        </Form.Item>
        <Form.Item name="item_no" label="编号">
          <Input placeholder="请输入编号" />
        </Form.Item>
        <Form.Item name="item_value" label="值">
          <Input.TextArea rows={3} placeholder="请输入值" />
        </Form.Item>
        <Form.Item name="item_unit" label="单位">
          <Input placeholder="请输入单位" />
        </Form.Item>
        <Form.Item name="item_tag" label="标签">
          <Input placeholder="请输入标签" />
        </Form.Item>
        <Form.Item name="sort_no" label="排序">
          <Input placeholder="请输入排序" />
        </Form.Item>
        <Form.Item name="item_note" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DictItemFormModal;
