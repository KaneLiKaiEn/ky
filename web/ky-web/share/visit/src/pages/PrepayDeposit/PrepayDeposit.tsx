import { useCallback, useState } from "react";
import { App } from "antd";
import { refundPrepay2API } from "@/api/account";
import { getSessionId } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import type { PrepayType } from "@/types/account";
import type { DealerRow } from "@/types/pay";
import { usePrepayAccount } from "./hooks/usePrepayAccount";
import { usePrepayDealers } from "./hooks/usePrepayDealers";
import {
  usePrepayRecharge,
  type PrepayPayResult,
} from "./hooks/usePrepayRecharge";
import { usePrepayTypeState } from "./hooks/usePrepayTypeState";
import PrepayPayDialog from "./PrepayPayDialog";
import PrepayRechargePanel from "./PrepayRechargePanel";
import PrepayRefundModal from "./PrepayRefundModal";
import PrepayTypeBalanceBar from "./PrepayTypeBalanceBar";
import { formatAmount, parseAmount } from "./utils/amount";
import {
  buildPrintItemsWithAmount,
  confirmPrintPrepay,
} from "./utils/print";

export interface PrepayDepositProps {
  patient_id?: number;
  /**
   * 有值：锁定预交金类型，不展示 Radio；
   * 无值：默认门诊(O)，可切换。
   */
  prepay_type?: PrepayType;
  /** 建议预交金金额：有值时作为充值金额默认值 */
  prepay_amount?: string;
  /** 外部递增以静默刷新余额（用于对侧操作后联动） */
  refreshKey?: number;
  /** 充值/退款成功后通知外部（用于联动刷新列表） */
  onChange?: () => void;
  className?: string;
}

/**
 * 预交金充值公共组件：类型/余额/退款 + 充值面板。
 * 宽高默认占满，由外侧父容器控制尺寸。
 */
const PrepayDeposit = ({
  patient_id,
  prepay_type,
  prepay_amount,
  refreshKey = 0,
  onChange,
  className,
}: PrepayDepositProps) => {
  const { message, modal } = App.useApp();
  const { prepayType, setPrepayType, showTypeSelector } =
    usePrepayTypeState(prepay_type);
  const [resetToken, setResetToken] = useState(0);
  const [topRefundOpen, setTopRefundOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    balance,
    loading: balanceLoading,
    refresh: refreshBalance,
  } = usePrepayAccount(patient_id, prepayType, refreshKey);

  const { dealers } = usePrepayDealers();

  const handlePaySuccess = useCallback(
    async (result: PrepayPayResult) => {
      setResetToken((n) => n + 1);
      // 退款/支付后账户余额可能有延迟；本侧自刷 + 通知对侧
      setTimeout(() => {
        void refreshBalance();
        onChange?.();
        confirmPrintPrepay(
          modal,
          [{ prepayId: result.prepayId, amount: result.amount }],
          "recharge",
        );
      }, 500);
    },
    [modal, onChange, refreshBalance],
  );

  const {
    paying,
    dialog,
    payResult,
    closeDialog,
    startRecharge,
    submitActiveCode,
    switchQrMode,
  } = usePrepayRecharge(handlePaySuccess);

  const handlePay = useCallback(
    async (amount: string, dealer: DealerRow) => {
      if (!patient_id) {
        message.warning("缺少患者信息");
        return;
      }
      const ok = await startRecharge({
        patientId: patient_id,
        prepayType,
        amount,
        dealer,
      });
      if (ok) {
        setResetToken((n) => n + 1);
      }
    },
    [message, patient_id, prepayType, startRecharge],
  );

  const handleTopRefund = useCallback(
    async (refundAmount: string) => {
      if (!patient_id) return;
      if (parseAmount(refundAmount) <= 0) {
        message.warning("请输入退款金额");
        return;
      }
      setActionLoading(true);
      try {
        const res = await refundPrepay2API({
          patient_id,
          prepay_type: prepayType,
          refund_amount: formatAmount(refundAmount),
          auto_pay: true,
        });
        message.success("退款成功");
        setTopRefundOpen(false);
        const refundIds = res.refund_prepay_id ?? [];
        const amount = formatAmount(refundAmount);
        setTimeout(() => {
          void refreshBalance();
          onChange?.();
          confirmPrintPrepay(
            modal,
            buildPrintItemsWithAmount(refundIds, amount),
            "refund",
          );
        }, 500);
      } catch {
        message.error("退款失败");
      } finally {
        setActionLoading(false);
      }
    },
    [message, modal, onChange, patient_id, prepayType, refreshBalance],
  );

  return (
    <div
      className={[
        "flex h-full w-full min-h-0 flex-col overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <PrepayTypeBalanceBar
        prepayType={prepayType}
        showTypeSelector={showTypeSelector}
        onTypeChange={setPrepayType}
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <PrepayRechargePanel
          dealers={dealers}
          paying={paying}
          onPay={handlePay}
          resetToken={resetToken}
          defaultAmount={prepay_amount}
          balance={balance}
          balanceLoading={balanceLoading}
          onRefundClick={() => setTopRefundOpen(true)}
          payResult={payResult}
        />
      </div>

      <PrepayPayDialog
        open={dialog.open}
        amount={dialog.amount}
        dealer={dialog.dealer}
        dealerTag={dialog.dealerTag}
        qrMode={dialog.qrMode}
        qrImage={dialog.qrImage}
        submitting={dialog.submitting}
        onCancel={closeDialog}
        onSwitchMode={(mode) => void switchQrMode(mode)}
        onSubmitActiveCode={(code) => void submitActiveCode(code)}
      />

      <PrepayRefundModal
        open={topRefundOpen}
        prepayType={prepayType}
        balance={balance}
        submitting={actionLoading}
        onCancel={() => setTopRefundOpen(false)}
        onSubmit={handleTopRefund}
      />
    </div>
  );
};

export default PrepayDeposit;
