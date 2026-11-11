import { useCallback, useEffect, useState } from "react";
import { App, Button } from "antd";
import { getSessionId, onSessionIdChange } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import {
  getToTerminateOrderListAPI,
  terminateOrderAPI,
} from "@/api/ordent";
import OrderHandleTable from "../OrderHandleTable";

/** 待作废医嘱列表 widget */
export default function ToTerminateOrderList() {
  const { message } = App.useApp();
  const [wardId, setWardId] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadWardId = useCallback(async () => {
    const sessionId = getSessionId();
    if (!sessionId) {
      setWardId(0);
      return;
    }
    try {
      const sessionRes = await getSessionInfo({ session_id: sessionId });
      if (sessionRes.code !== 0) {
        message.error((sessionRes.message || "") + (sessionRes.hint || ""));
        return;
      }
      const id = Number(sessionRes.session_info?.dept_id);
      if (Number.isFinite(id) && id > 0) {
        setWardId(id);
        setRefreshKey((k) => k + 1);
      } else {
        setWardId(0);
      }
    } catch {
      /* ignore */
    }
  }, [message]);

  useEffect(() => {
    void loadWardId();
  }, [loadWardId]);

  useEffect(() => {
    return onSessionIdChange((payload) => {
      // 监听 sessionId 变化（主体切换病区）
      if (payload.action === "set" && payload.sessionId) {
        void loadWardId();
      } else {
        setWardId(0);
      }
    });
  }, [loadWardId]);

  return (
    <OrderHandleTable
      wardId={wardId}
      refreshKey={refreshKey}
      fetchList={getToTerminateOrderListAPI}
      extraColumns={(ctx) => [
        {
          title: "操作",
          key: "action",
          fixed: "right",
          width: 80,
          render: (_: unknown, record: any) => (
            <Button
              danger
              size="small"
              loading={ctx.actingId === record.order_id}
              onClick={async (e) => {
                e.stopPropagation();
                ctx.setActingId(record.order_id);
                try {
                  const res = await terminateOrderAPI({
                    order_id: record.order_id,
                  });
                  if (res.code !== 0) {
                    message.error((res.message || "") + (res.hint || ""));
                    return;
                  }
                  message.success("作废医嘱成功");
                  await ctx.reload();
                } catch {
                  /* ignore */
                } finally {
                  ctx.setActingId(null);
                }
              }}
            >
              作废
            </Button>
          ),
        },
      ]}
    />
  );
}
