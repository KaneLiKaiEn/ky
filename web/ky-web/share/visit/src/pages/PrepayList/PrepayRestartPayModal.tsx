import { Button, Modal, Space } from "antd";
import type { DealerRow } from "@/types/pay";

export interface PrepayRestartPayModalProps {
  open: boolean;
  dealers: DealerRow[];
  submitting?: boolean;
  onCancel: () => void;
  /** 点击某个支付方式即重新发起 */
  onPay: (dealer: DealerRow) => void | Promise<void>;
}

/** 重新发起交易：点击支付方式即走 StartPrepayPay */
const PrepayRestartPayModal = ({
  open,
  dealers,
  submitting,
  onCancel,
  onPay,
}: PrepayRestartPayModalProps) => {
  return (
    <Modal
      title="重新发起交易"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <div className="space-y-2 pt-2">
        <div className="text-[13px] text-(--app-theme-text-secondary)">
          请选择支付方式
        </div>
        <Space wrap>
          {dealers.map((d) => (
            <Button
              key={d.pay_type}
              loading={submitting}
              disabled={submitting}
              onClick={() => void onPay(d)}
            >
              {d.pay_name || d.pay_type}
            </Button>
          ))}
        </Space>
      </div>
    </Modal>
  );
};

export default PrepayRestartPayModal;
