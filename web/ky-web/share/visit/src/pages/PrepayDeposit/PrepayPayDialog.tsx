import { useEffect, useRef, useState } from "react";
import { Button, Modal, Radio, Space, Spin } from "antd";
import type { DealerRow } from "@/types/pay";
import {
  DEAL_TYPE_ACTIVE,
  DEAL_TYPE_PASSIVE,
  type QrDealMode,
} from "./utils/dealerTag";

export interface PrepayPayDialogProps {
  open: boolean;
  amount: string;
  dealer: DealerRow | null;
  dealerTag?: string;
  qrMode: QrDealMode | null;
  qrImage?: string;
  submitting?: boolean;
  onCancel: () => void;
  onSwitchMode: (mode: QrDealMode) => void;
  onSubmitActiveCode: (dealCode: string) => void;
}

/**
 * 第三方支付弹窗：
 * - QR_ACTIVE：等待扫码枪录入付款码后发起 StartPrepayPay
 * - QR_PASSIVE：展示收款二维码并轮询支付结果
 */
const PrepayPayDialog = ({
  open,
  amount,
  dealerTag = "",
  qrMode,
  qrImage,
  submitting,
  onCancel,
  onSwitchMode,
  onSubmitActiveCode,
}: PrepayPayDialogProps) => {
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasActive = dealerTag.indexOf(DEAL_TYPE_ACTIVE) >= 0;
  const hasPassive = dealerTag.indexOf(DEAL_TYPE_PASSIVE) >= 0;
  const showModeSwitch = hasActive && hasPassive;

  useEffect(() => {
    if (!open) {
      setCode("");
      return;
    }
    if (qrMode === DEAL_TYPE_ACTIVE) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [open, qrMode]);

  return (
    <Modal
      title="第三方支付"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      width={420}
      maskClosable={false}
    >
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="text-[15px] text-(--app-theme-text)">
          应付金额{" "}
          <span className="text-[20px] font-semibold text-(--app-theme-error)">
            ¥{amount}
          </span>
        </div>

        {showModeSwitch && (
          <Radio.Group
            value={qrMode ?? undefined}
            onChange={(e) => onSwitchMode(e.target.value as QrDealMode)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value={DEAL_TYPE_ACTIVE}>出示付款码</Radio.Button>
            <Radio.Button value={DEAL_TYPE_PASSIVE}>扫码付款</Radio.Button>
          </Radio.Group>
        )}

        {qrMode === DEAL_TYPE_ACTIVE && (
          <div className="w-full space-y-2 text-center">
            <p className="text-[14px] text-(--app-theme-text-secondary)">
              请使用扫码枪扫描患者付款码
            </p>
            <input
              ref={inputRef}
              className="w-full rounded border border-(--app-theme-border) bg-(--app-theme-bg-container) px-2 py-2 text-center text-(--app-theme-text) outline-none focus:border-(--app-theme-primary)"
              placeholder="等待扫码..."
              value={code}
              disabled={submitting}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmitActiveCode(code);
                }
              }}
            />
            <Space>
              <Button
                type="primary"
                loading={submitting}
                onClick={() => onSubmitActiveCode(code)}
              >
                确认支付
              </Button>
              <Button onClick={onCancel}>取消</Button>
            </Space>
          </div>
        )}

        {qrMode === DEAL_TYPE_PASSIVE && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-[14px] text-(--app-theme-text-secondary)">
              请患者使用手机扫描下方二维码付款
            </p>
            {submitting && !qrImage ? (
              <Spin tip="正在生成二维码..." />
            ) : qrImage ? (
              <img
                src={qrImage}
                alt="支付二维码"
                className="h-[220px] w-[220px] rounded border border-(--app-theme-border) object-contain"
              />
            ) : (
              <div className="flex h-[220px] w-[220px] items-center justify-center text-(--app-theme-text-secondary)">
                暂无二维码
              </div>
            )}
            <p className="text-[13px] text-(--app-theme-text-secondary)">
              支付完成后将自动关闭
            </p>
            <Button onClick={onCancel}>取消</Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PrepayPayDialog;
