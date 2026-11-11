import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "antd";
import type { Dayjs } from "dayjs";
import { getPrepayListAPI } from "@/api/account";
import type { PrepayRow } from "@/types/account";
import { useSessionInfo } from "../../PrepayDeposit";
import dayjs from "dayjs";

export type PrepayDateRange = [Dayjs, Dayjs];

export function usePrepayList(
  patientId: number | undefined,
  prepayType: string,
  dateRange: PrepayDateRange,
  /** 外部递增以触发静默刷新（不置 loading，避免闪烁） */
  refreshKey = 0,
) {
  const { message } = App.useApp();
  const { orgId } = useSessionInfo();
  const [rows, setRows] = useState<PrepayRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!patientId || !orgId) {
      setRows([]);
      return [];
    }
    setLoading(true);
    try {
      const res = await getPrepayListAPI({
        org_id: orgId,
        patient_id: patientId,
        prepay_type: prepayType,
        prepay_start: dateRange[0].format("YYYY-MM-DD"),
        prepay_end: dateRange[1].format("YYYY-MM-DD"),
        column_list: "*",
      });
      const list = res.row_list ?? [];
      // 根据时间倒序排序
      setRows(list.sort((a, b) => dayjs(b.prepay_time).diff(dayjs(a.prepay_time))));
      return list;
    } catch {
      message.error("获取预交金流水失败");
      setRows([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [dateRange, message, orgId, patientId, prepayType]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  return { rows, loading, refresh };
}
