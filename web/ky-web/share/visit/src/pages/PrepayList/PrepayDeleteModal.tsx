import { Form, Input, Modal } from "antd";
import { useEffect } from "react";

export interface PrepayDeleteModalProps {
  open: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (deleteNote: string) => void | Promise<void>;
}

/** 删除预交金：原因可空 */
const PrepayDeleteModal = ({
  open,
  submitting,
  onCancel,
  onSubmit,
}: PrepayDeleteModalProps) => {
  const [form] = Form.useForm<{ delete_note?: string }>();

  useEffect(() => {
    if (open) form.resetFields();
  }, [form, open]);

  return (
    <Modal
      title="删除预交金"
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
            rows={4}
            placeholder="请输入删除原因（可选）"
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PrepayDeleteModal;
