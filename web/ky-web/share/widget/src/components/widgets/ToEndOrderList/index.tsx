import { useCallback, useEffect, useState } from "react";
import { App, Button } from "antd";
import { getSessionId, onSessionIdChange } from "comm/session";
import { getSessionInfo } from "@/api/auth";

import OrderHandleTable from "../OrderHandleTable";
import { endOrder2API, endOrderAPI, getToEndOrderListAPI } from "@/api/ordent";

/** 待停止医嘱列表 widget */
export default function ToEndOrderList() {
  const { message } = App.useApp();
  const [wardId, setWardId] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [batchLoading, setBatchLoading] = useState(false);

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
      fetchList={getToEndOrderListAPI}
      showSelection
      extra={({ selectedRowKeys, reload, clearSelection }) => (
        <div className="flex min-w-0 flex-1 justify-end">
          <Button
            type="primary"
            danger
            size="small"
            loading={batchLoading}
            onClick={async () => {
              if (!selectedRowKeys.length) {
                message.warning("请先选择医嘱");
                return;
              }
              setBatchLoading(true);
              try {
                const res = await endOrder2API({
                  order_id_list: selectedRowKeys.map(Number),
                });
                if (res.code !== 0) {
                  message.error((res.message || "") + (res.hint || ""));
                  return;
                }
                message.success("批量停止医嘱成功");
                clearSelection();
                await reload();
              } finally {
                setBatchLoading(false);
              }
            }}
          >
            批量停止
          </Button>
        </div>
      )}
      extraColumns={(ctx) => [
        {
          title: "操作",
          key: "action",
          fixed: "right",
          width: 96,
          render: (_: unknown, record: any) => (
            <Button
              variant="outlined"
              danger
              size="small"
              loading={ctx.actingId === record.order_id}
              onClick={async (e) => {
                e.stopPropagation();
                ctx.setActingId(record.order_id);
                try {
                  const res = await endOrderAPI({ order_id: record.order_id });
                  if (res.code !== 0) {
                    message.error((res.message || "") + (res.hint || ""));
                    return;
                  }
                  message.success("停止医嘱成功");
                  await ctx.reload();
                } catch {
                  /* ignore */
                } finally {
                  ctx.setActingId(null);
                }
              }}
            >
              停止
            </Button>
          ),
        },
      ]}
    />
  );
}
