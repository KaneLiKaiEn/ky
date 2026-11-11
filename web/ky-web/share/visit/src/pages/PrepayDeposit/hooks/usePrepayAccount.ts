import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import { getPrepayAccountAPI } from "@/api/account";
import { useSessionInfo } from "./useSessionInfo";

export function usePrepayAccount(
  patientId: number | undefined,
  prepayType: string,
  /** 外部递增以触发静默刷新（不置 loading，避免闪烁） */
  refreshKey = 0,
) {
  const { message } = App.useApp();
  const { orgId } = useSessionInfo();
  const [balance, setBalance] = useState("0.00");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!patientId || !orgId) {
        setBalance("0.00");
        return "0.00";
      }
      if (!options?.silent) setLoading(true);
      try {
        const res = await getPrepayAccountAPI({
          org_id: orgId,
          patient_id: patientId,
          prepay_type: prepayType,
        });
        const amount = res.prepay_amount ?? "0.00";
        setBalance(amount);
        return amount;
      } catch {
        message.error("获取预交金余额失败");
        setBalance("0.00");
        return "0.00";
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [message, orgId, patientId, prepayType],
  );

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  return { balance, loading, refresh };
}
