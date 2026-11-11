import { useEffect } from "react";
import { Form, Input, Modal } from "antd";

export interface AllergyDeleteModalProps {
  open: boolean;
  submitting?: boolean;
  rowIndex?: number;
  onCancel: () => void;
  onSubmit: (deleteNote: string) => void | Promise<void>;
}

const AllergyDeleteModal = ({
  open,
  submitting,
  rowIndex,
  onCancel,
  onSubmit,
}: AllergyDeleteModalProps) => {
  const [form] = Form.useForm<{ delete_note?: string }>();

  useEffect(() => {
    if (open) form.resetFields();
  }, [form, open]);

  return (
    <Modal
      title={
        rowIndex != null
          ? `是否删除第${rowIndex + 1}条记录`
          : "是否删除该过敏史"
      }
      open={open}
      okText="确认删除"
      okButtonProps={{ danger: true }}
      cancelText="取消"
      confirmLoading={submitting}
      destroyOnHidden
      onCancel={onCancel}
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(values.delete_note?.trim() ?? "");
      }}
    >
      <Form form={form} layout="vertical" className="pt-2">
        <Form.Item label="删除原因" name="delete_note">
          <Input.TextArea
            rows={3}
            placeholder="请输入删除原因（可选）"
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AllergyDeleteModal;
