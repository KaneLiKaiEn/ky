import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import { getActiveDealerListAPI } from "@/api/pay";
import type { DealerRow } from "@/types/pay";

export function usePrepayDealers() {
  const { message } = App.useApp();
  const [dealers, setDealers] = useState<DealerRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getActiveDealerListAPI({});
      const list = res.row_list ?? [];
      setDealers(list);
      return list;
    } catch {
      message.error("获取支付方式失败");
      setDealers([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    dealers,
    loading,
    refresh,
  };
}
