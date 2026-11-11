import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import type { PrepayRow } from "@/types/account";
import { formatAmount, parseAmount } from "../PrepayDeposit";

export interface PrepayRefundRowModalProps {
  open: boolean;
  row: PrepayRow | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (refundAmount: string, refundNote?: string) => void | Promise<void>;
}

/** 流水行退款：RefundPrepay */
const PrepayRefundRowModal = ({
  open,
  row,
  submitting,
  onCancel,
  onSubmit,
}: PrepayRefundRowModalProps) => {
  const [form] = Form.useForm<{ refund_amount: string; refund_note?: string }>();
  const maxRefund =
    parseAmount(row?.prepay_amount) - parseAmount(row?.refund_amount);

  useEffect(() => {
    if (open && row) {
      form.setFieldsValue({
        refund_amount: formatAmount(Math.max(maxRefund, 0)),
        refund_note: undefined,
      });
    }
  }, [form, maxRefund, open, row]);

  return (
    <Modal
      title="预交金退款"
      open={open}
      okText="确定退款"
      okButtonProps={{ danger: true }}
      confirmLoading={submitting}
      destroyOnHidden
      onCancel={onCancel}
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(
          formatAmount(values.refund_amount),
          values.refund_note?.trim(),
        );
      }}
    >
      <Form form={form} layout="vertical" className="pt-2">
        <Form.Item
          label="退款金额"
          name="refund_amount"
          rules={[
            { required: true, message: "请输入退款金额" },
            {
              validator: async (_, value) => {
                const n = parseAmount(value);
                if (n <= 0) throw new Error("退款金额须大于 0");
                if (n > maxRefund + 1e-6) {
                  throw new Error(`最多可退 ¥${formatAmount(maxRefund)}`);
                }
              },
            },
          ]}
        >
          <Input prefix="¥" />
        </Form.Item>
        <Form.Item label="备注" name="refund_note">
          <Input.TextArea rows={3} placeholder="可选" maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PrepayRefundRowModal;
