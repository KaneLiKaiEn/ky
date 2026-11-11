import {
  AlipayCircleOutlined,
  BankOutlined,
  CreditCardOutlined,
  MoneyCollectOutlined,
  PayCircleOutlined,
  QrcodeOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Input } from "antd";
import type { InputRef } from "antd/es/input";
import { getSessionId } from "comm/session";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import type { DealerRow } from "@/types/pay";
import type { PrepayPayResult } from "./hooks/usePrepayRecharge";
import {
  combineAmountParts,
  formatAmount,
  splitAmountParts,
} from "./utils/amount";
import { QUICK_AMOUNTS } from "./utils/constants";

export interface PrepayRechargePanelProps {
  dealers: DealerRow[];
  paying?: boolean;
  /** 点击某个支付方式即发起充值 */
  onPay: (amount: string, dealer: DealerRow) => void | Promise<void>;
  /** 外部在支付成功后递增，用于清空金额 */
  resetToken?: number;
  /** 建议预交金：有值时作为金额输入默认值 */
  defaultAmount?: string;

  balance: string;
  balanceLoading?: boolean;
  onRefundClick: () => void;
  /** 最近一次充值成功后的交易明细 */
  payResult?: PrepayPayResult | null;
}

function formatDealResult(result?: string) {
  if (!result) return "-";
  if (result === "SUCCESS") return "成功";
  if (result === "FAIL") return "失败";
  return result;
}

function getPayIcon(dealer: DealerRow) {
  const key = `${dealer.pay_name ?? ""}${dealer.pay_type ?? ""}`.toLowerCase();
  if (key.includes("现金") || key.includes("cash")) {
    return <MoneyCollectOutlined />;
  }
  if (key.includes("银联") || key.includes("union") || key.includes("bank")) {
    return <BankOutlined />;
  }
  if (key.includes("pos")) {
    return <CreditCardOutlined />;
  }
  if (key.includes("支付宝") || key.includes("alipay")) {
    return <AlipayCircleOutlined />;
  }
  if (key.includes("钱包") || key.includes("wallet")) {
    return <WalletOutlined />;
  }
  if (
    key.includes("聚合") ||
    key.includes("扫码") ||
    key.includes("qr") ||
    key.includes("微信")
  ) {
    return <QrcodeOutlined />;
  }
  return <PayCircleOutlined />;
}

const selectInputValue = (el: HTMLInputElement | null) => {
  if (!el) return;
  // 下一帧选中，避免 focus 后被浏览器默认光标覆盖
  requestAnimationFrame(() => {
    el.select();
  });
};

const PrepayRechargePanel = ({
  dealers,
  paying,
  onPay,
  resetToken = 0,
  defaultAmount,
  balance,
  balanceLoading,
  onRefundClick,
  payResult,
}: PrepayRechargePanelProps) => {
  const initialParts = splitAmountParts(defaultAmount ?? 0);
  const [integerPart, setIntegerPart] = useState(initialParts.integerPart);
  const [decimalPart, setDecimalPart] = useState(
    initialParts.decimalPart.replace(/0+$/, "") || "0",
  );
  const [quickAmount, setQuickAmount] = useState<number | null>(null);
  const integerRef = useRef<InputRef>(null);
  const decimalRef = useRef<InputRef>(null);

  useEffect(() => {
    if (defaultAmount == null || defaultAmount === "") return;
    const parts = splitAmountParts(defaultAmount);
    setIntegerPart(parts.integerPart);
    setDecimalPart(parts.decimalPart.replace(/0+$/, "") || "0");
    setQuickAmount(null);
  }, [defaultAmount]);

  useEffect(() => {
    if (resetToken === 0) return;
    setIntegerPart("0");
    setDecimalPart("0");
    setQuickAmount(null);
  }, [resetToken]);

  const amount = combineAmountParts(integerPart, decimalPart);
  const sessionId = getSessionId();
  const receiptUrl =
    payResult?.prepayId && sessionId
      ? `/api/doc/receipt2/${sessionId}/PREPAY/${payResult.prepayId}`
      : "";
  const dealList = payResult?.dealList ?? [];

  const applyAmount = (value: number) => {
    const parts = splitAmountParts(value);
    setIntegerPart(parts.integerPart);
    setDecimalPart(parts.decimalPart.replace(/0+$/, "") || "0");
    setQuickAmount(value);
  };

  const focusDecimal = () => {
    const input = decimalRef.current?.input ?? null;
    input?.focus();
    selectInputValue(input);
  };

  const handleIntegerChange = (raw: string) => {
    setQuickAmount(null);
    // 输入点号：跳到小数位
    if (raw.includes(".")) {
      const [intSide = "", decSide = ""] = raw.split(".");
      const nextInt = intSide.replace(/\D/g, "") || "0";
      setIntegerPart(nextInt);
      if (decSide) {
        setDecimalPart(decSide.replace(/\D/g, "").slice(0, 2) || "0");
      }
      focusDecimal();
      return;
    }
    setIntegerPart(raw.replace(/\D/g, "") || "0");
  };

  const handleIntegerKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "." || e.key === "Decimal" || e.code === "NumpadDecimal") {
      e.preventDefault();
      focusDecimal();
    }
  };

  const handleIntegerPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes(".")) return;
    e.preventDefault();
    handleIntegerChange(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto rounded-lg border border-(--app-theme-border) bg-(--app-theme-bg-container) p-2">
      <div className="flex items-center gap-2">
        <span className="text-[14px] text-(--app-theme-text)">余额</span>
        <div className="min-w-[120px] rounded border border-(--app-theme-error) px-2 text-center text-[18px] font-semibold text-(--app-theme-error)">
          {balanceLoading ? "..." : `${formatAmount(balance)} 元`}
        </div>
        <Button type="link" danger className="px-1" onClick={onRefundClick}>
          退款
        </Button>
      </div>
      <div className="mb-2 text-[15px] font-medium text-(--app-theme-text)">
        请输入金额
      </div>
      <div className="mb-2 text-[12px] text-(--app-theme-text-secondary)">
        左侧输入整数，右侧输入小数；输入「.」可跳到小数位
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((v) => {
          const active = quickAmount === v;
          return (
            <button
              key={v}
              type="button"
              disabled={paying}
              onClick={() => applyAmount(v)}
              className={[
                "rounded-full border px-2 py-2 text-[13px] transition-colors",
                active
                  ? "border-(--app-theme-primary) bg-(--app-theme-primary) text-(--app-theme-text-white)"
                  : "border-(--app-theme-border) bg-(--app-theme-bg-container) text-(--app-theme-text) hover:border-(--app-theme-primary) hover:text-(--app-theme-primary)",
                paying ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              ].join(" ")}
            >
              ¥{v}
            </button>
          );
        })}
      </div>

      <div className="mb-2 flex flex-1 items-center justify-center rounded-xl bg-(--app-theme-bg-fill-alter) px-2 py-2">
        <div className="flex items-end gap-2">
          <span className="pb-2 text-[26px] font-medium text-(--app-theme-text-secondary)">
            ¥
          </span>
          <Input
            ref={integerRef}
            value={integerPart}
            disabled={paying}
            onFocus={(e) => selectInputValue(e.target)}
            onKeyDown={handleIntegerKeyDown}
            onPaste={handleIntegerPaste}
            onChange={(e) => handleIntegerChange(e.target.value)}
            className="!w-[168px] !border-0 !border-b-2 !border-(--app-theme-primary) !bg-transparent !px-1 !text-center !text-[48px] !leading-none !font-semibold !text-(--app-theme-text) !shadow-none focus:!shadow-none"
          />
          <span className="pb-2 text-[36px] font-semibold text-(--app-theme-text)">
            .
          </span>
          <Input
            ref={decimalRef}
            value={decimalPart}
            maxLength={2}
            disabled={paying}
            onFocus={(e) => selectInputValue(e.target)}
            onChange={(e) => {
              setQuickAmount(null);
              setDecimalPart(
                e.target.value.replace(/\D/g, "").slice(0, 2) || "0",
              );
            }}
            className="!w-[88px] !border-0 !border-b-2 !border-(--app-theme-primary) !bg-transparent !px-1 !text-center !text-[32px] !leading-none !font-semibold !text-(--app-theme-text) !shadow-none focus:!shadow-none"
          />
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <div className="flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-2">
            {dealers.map((d) => (
              <Button
                key={d.pay_type}
                size="middle"
                icon={getPayIcon(d)}
                loading={paying}
                disabled={paying}
                onClick={() => void onPay(amount, d)}
              >
                {d.pay_name || d.pay_type}
              </Button>
            ))}
          </div>
          <div className="shrink-0 rounded-lg bg-(--app-theme-error-bg) px-2 py-2 text-right">
            <div className="text-[12px] text-(--app-theme-text-secondary)">
              应付金额
            </div>
            <div className="text-[20px] font-semibold tracking-wide text-(--app-theme-error)">
              ¥{formatAmount(amount)}
            </div>
          </div>
        </div>
      </div>

      {payResult ? (
        <div className="mt-2 space-y-2 border-t border-(--app-theme-border) pt-3">
          <div className="font-medium text-(--app-theme-text)">
            交易明细
          </div>
          {dealList.length === 0 ? (
            <div className="text-[12px] text-(--app-theme-text-secondary)">
              暂无交易明细
            </div>
          ) : (
            <div className="space-y-2">
              {dealList.map((deal) => (
                <div
                  key={String(deal.deal_id ?? `${deal.pay_id}-${deal.deal_time}`)}
                  className="grid grid-cols-2 gap-x-3 gap-y-1 rounded border border-(--app-theme-border) px-2 py-2 text-(--app-theme-text)"
                >
                  <div>
                    <span className="text-(--app-theme-text-secondary)">
                      交易状态：
                    </span>
                    {formatDealResult(deal.deal_result)}
                  </div>
                  <div>
                    <span className="text-(--app-theme-text-secondary)">
                      支付方式：
                    </span>
                    {deal.pay_name || deal.pay_type || "-"}
                  </div>
                  <div>
                    <span className="text-(--app-theme-text-secondary)">
                      交易ID：
                    </span>
                    {deal.deal_id ?? "-"}
                  </div>
                  <div>
                    <span className="text-(--app-theme-text-secondary)">
                      支付ID：
                    </span>
                    {deal.pay_id ?? "-"}
                  </div>
                  <div className="col-span-2">
                    <span className="text-(--app-theme-text-secondary)">
                      交易时间：
                    </span>
                    {deal.deal_time || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
          {receiptUrl ? (
            <object
              data={receiptUrl}
              type="application/pdf"
              className="h-[360px] w-full rounded border border-(--app-theme-border)"
            >
              <div className="p-2 text-[12px] text-(--app-theme-text-secondary)">
                无法预览收据，
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-(--app-theme-primary)"
                >
                  点击打开
                </a>
              </div>
            </object>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default PrepayRechargePanel;
