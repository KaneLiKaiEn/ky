import { useEffect, useState, type FC } from "react";
import { getCreditAPI, saveCreditAPI } from "@/api/account";
import { Button, Input, message } from "antd";
import { parseAmount } from "../PrepayDeposit";
export interface CreditProps {
    visit_id?: number;
  }
  const QUICK_AMOUNTS = [10, 20, 30, 50, 100, 200, 500, 1000];
const Credit: FC<CreditProps> = ({ visit_id }) => {
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [quickAmount, setQuickAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (!visit_id) {
      return;}
    void getCreditAPI({ visit_id }).then((res) => {
      setCreditAmount(res.credit_amount?.trim() === "" ? "0.00" : res.credit_amount ?? "0.00");
    });
  }, [visit_id]);
  function handleQuickAmount(amount: number) {
    setQuickAmount(amount);
    setCustomAmount("");
  }
  function handleCustomAmount(amount: string) {
    setCustomAmount(amount);
    setQuickAmount(null);
  }
  async function handleConfirmAmount() {
    const amount = quickAmount != null ? String(quickAmount) : customAmount;
    if (!amount) return;
    const raw = quickAmount != null ? String(quickAmount) : customAmount.trim();
    const n = parseAmount(raw);
    if (!raw) {
      message.warning("请选择或输入信用额");
      return;
    }
    if (!Number.isFinite(n) || n < 0) {
      message.warning("请输入有效的信用额");
      return;
    }
    setLoading(true);
    try {
      await saveCreditAPI({ visit_id, credit_amount: amount });
      const res = await getCreditAPI({ visit_id });
      setCreditAmount(res.credit_amount ?? "0.00");
      setQuickAmount(null);
      setCustomAmount("");
      message.success("信用额修改成功");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
    <div className="flex h-full min-h-0 flex-col overflow-auto rounded-lg border border-(--app-theme-border) bg-(--app-theme-bg-container) p-2">
      <div className="flex items-center gap-2">
        <span className="text-[14px] text-(--app-theme-text) font-bold">当前就诊号信用额</span>
        <div className="min-w-[120px] rounded border border-(--app-theme-error) px-2 text-center text-[18px] font-semibold text-(--app-theme-error)">
          {creditAmount.trim() === "" ? "0.00" : creditAmount} 元
        </div>
      </div>


      <div className="mt-2 mb-2 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((v) => {
          const active = quickAmount === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => handleQuickAmount(v)}
              disabled={loading}
              className={[
                "rounded-full border px-2 py-2 text-[13px] transition-colors",
                active
                  ? "border-(--app-theme-primary) bg-(--app-theme-primary) text-(--app-theme-text-white)"
                  : "border-(--app-theme-border) bg-(--app-theme-bg-container) text-(--app-theme-text) hover:border-(--app-theme-primary) hover:text-(--app-theme-primary)",
                  loading ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                ].join(" ")}
            >
              ¥{v}
            </button>
          );
        })}
        <Input
        value={customAmount}
        onChange={(e) => handleCustomAmount(e.target.value)}
        title="自定义"
        className="!w-[120px] rounded-full"
        placeholder="自定义"
        disabled={loading}
        />
        <Button
          type="primary"
          onClick={() => handleConfirmAmount()}
          disabled={loading||(quickAmount == null && !customAmount.trim())}
          loading={loading}
        >
          确定
        </Button>
      </div>

      </div>
    </div>
  );
};
export default Credit;