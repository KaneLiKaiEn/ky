import { Form, Input, Modal, Typography } from "antd";

export interface ActionNoteModalProps {
  open: boolean;
  title: string;
  content: string;
  /** 原因输入框标签，默认「原因」 */
  noteLabel?: string;
  /** 原因是否必填，默认 false（选填） */
  noteRequired?: boolean;
  okText?: string;
  okDanger?: boolean;
  confirmLoading?: boolean;
  onCancel: () => void;
  onOk: (note?: string) => void;
}

/** 通用操作确认弹窗：可录入原因（申请退回等场景复用）。 */
const ActionNoteModal = ({
  open,
  title,
  content,
  noteLabel = "原因",
  noteRequired = false,
  okText = "确定",
  okDanger,
  confirmLoading,
  onCancel,
  onOk,
}: ActionNoteModalProps) => {
  const [form] = Form.useForm<{ note?: string }>();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const note = values.note?.trim() || undefined;
      onOk(note);
    } catch {
      // 校验未通过
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      okText={okText}
      cancelText="取消"
      okButtonProps={{ danger: okDanger, loading: confirmLoading }}
      mask={{ closable: !confirmLoading }}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      destroyOnHidden
      afterClose={() => form.resetFields()}
    >
      <Typography.Paragraph type="secondary" className="mb-3!">
        {content}
      </Typography.Paragraph>
      <Form form={form} layout="vertical">
        <Form.Item
          label={noteLabel}
          name="note"
          className="mb-0!"
          rules={
            noteRequired
              ? [
                  {
                    required: true,
                    whitespace: true,
                    message: `请输入${noteLabel}`,
                  },
                ]
              : undefined
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={noteRequired ? "请输入" : "选填"}
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ActionNoteModal;
