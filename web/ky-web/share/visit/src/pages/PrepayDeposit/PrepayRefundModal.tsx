import { App, Button, Input, Modal, Space } from "antd";
import { useEffect, useState } from "react";
import { floorToYuan, formatAmount, parseAmount } from "./utils/amount";
import { PREPAY_TYPE_LABEL } from "./utils/constants";

export interface PrepayRefundModalProps {
  open: boolean;
  prepayType: string;
  /** 当前类型账户余额 */
  balance: string;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (refundAmount: string) => void | Promise<void>;
}

/** 顶部余额旁退款：RefundPrepay2 */
const PrepayRefundModal = ({
  open,
  prepayType,
  balance,
  submitting,
  onCancel,
  onSubmit,
}: PrepayRefundModalProps) => {
  const { message } = App.useApp();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) setAmount("");
  }, [open]);

  const typeLabel = PREPAY_TYPE_LABEL[prepayType] ?? prepayType;

  return (
    <Modal
      title={`${typeLabel}预交金退款`}
      open={open}
      onCancel={onCancel}
      confirmLoading={submitting}
      okText="确定退款"
      okButtonProps={{ danger: true }}
      onOk={() => {
        const n = parseAmount(amount);
        if (!amount.trim() || n <= 0) {
          message.warning("请输入退款金额");
          return Promise.reject();
        }
        if (n > parseAmount(balance) + 1e-6) {
          message.warning("退款金额不能超过余额");
          return Promise.reject();
        }
        return onSubmit(formatAmount(n));
      }}
      destroyOnHidden
    >
      <div className="space-y-2 pt-2">
        <div className="text-(--app-theme-text-secondary)">
          当前{typeLabel}余额：
          <span className="ml-1 font-medium text-(--app-theme-error)">
            ¥{formatAmount(balance)}
          </span>
        </div>
        <div>
          <div className="mb-1 text-[13px]">退款金额</div>
          <Space.Compact className="w-full">
            <Input
              prefix="¥"
              placeholder="请输入退款金额"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              onClick={() => setAmount(formatAmount(balance))}
              disabled={parseAmount(balance) <= 0}
            >
              全退
            </Button>
            <Button
              onClick={() => setAmount(floorToYuan(balance))}
              disabled={parseAmount(balance) < 1}
            >
              退整
            </Button>
          </Space.Compact>
        </div>
      </div>
    </Modal>
  );
};

export default PrepayRefundModal;
