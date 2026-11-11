import { useCallback, useEffect, useState } from "react";
import { App, Button, Input, Modal, Segmented } from "antd";
import { getSessionId, onSessionIdChange } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import {
  getToVerifyOrderListAPI,
  verifyOrder2API,
  verifyOrderAPI,
} from "@/api/ordent";
import OrderHandleTable from "../OrderHandleTable";

const VERIFY_FILTERS = [
  { label: "全部", value: "全部" },
  { label: "长期医嘱", value: "长期医嘱" },
  { label: "临时医嘱", value: "临时医嘱" },
  { label: "出院带药", value: "出院带药" },
  { label: "紧急", value: "紧急" },
] as const;

type VerifyFilter = (typeof VERIFY_FILTERS)[number]["value"];

/** 待校对医嘱列表 widget */
export default function ToVerifyOrderList() {
  const { message } = App.useApp();
  const [wardId, setWardId] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [batchLoading, setBatchLoading] = useState(false);
  const [filterType, setFilterType] = useState<VerifyFilter>("全部");

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

  const rowFilter = useCallback(
    (row: any) => {
      if (filterType === "全部") return true;
      if (filterType === "紧急") {
        return String(row?.order_tag ?? "").includes("[紧急]");
      }
      return String(row?.order_type ?? "").includes(filterType);
    },
    [filterType],
  );

  const handleVerify = async (
    record: any,
    ctx: {
      setActingId: (id: string | number | null) => void;
      reload: () => Promise<void>;
    },
  ) => {
    ctx.setActingId(record.order_id);
    try {
      const res = await verifyOrderAPI({ order_id: record.order_id });
      if (res.code !== 0) {
        message.error((res.message || "") + (res.hint || ""));
        return;
      }
      message.success("校对医嘱成功");
      await ctx.reload();
    } catch {
      /* ignore */
    } finally {
      ctx.setActingId(null);
    }
  };

  const handleReject = (
    record: any,
    ctx: {
      setActingId: (id: string | number | null) => void;
      reload: () => Promise<void>;
    },
  ) => {
    let returnNote = "";
    Modal.confirm({
      title: "退回原因",
      icon: null,
      content: (
        <Input.TextArea
          rows={4}
          placeholder="请输入退回原因"
          onChange={(e) => {
            returnNote = e.target.value;
          }}
        />
      ),
      okText: "确定",
      cancelText: "取消",
      okType: "danger",
      onOk: async () => {
        ctx.setActingId(record.order_id);
        try {
          const res = await verifyOrderAPI({
            order_id: record.order_id,
            return_note: returnNote,
            return_order: true,
          });
          if (res.code !== 0) {
            message.error((res.message || "") + (res.hint || ""));
            return;
          }
          message.success("退回医嘱成功");
          await ctx.reload();
        } catch {
          /* ignore */
        } finally {
          ctx.setActingId(null);
        }
      },
    });
  };

  return (
    <OrderHandleTable
      wardId={wardId}
      refreshKey={refreshKey}
      fetchList={getToVerifyOrderListAPI}
      showSelection
      rowFilter={rowFilter}
      hideOrderType={
        filterType === "长期医嘱" ||
        filterType === "临时医嘱" ||
        filterType === "出院带药"
      }
      extra={({ selectedRowKeys, reload, clearSelection }) => (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            <span className="shrink-0 text-[12px] text-(--app-theme-primary)">
              筛选：
            </span>
            <Segmented
              size="small"
              value={filterType}
              options={[...VERIFY_FILTERS]}
              onChange={(value) => {
                setFilterType(String(value) as VerifyFilter);
                clearSelection();
              }}
              className="text-[12px]! [&_.ant-segmented-item-label]:px-2! [&_.ant-segmented-item-selected]:text-(--app-theme-primary)!"
            />
          </div>
          <Button
            type="primary"
            size="small"
            loading={batchLoading}
            onClick={async () => {
              if (!selectedRowKeys.length) {
                message.warning("请先选择医嘱");
                return;
              }
              setBatchLoading(true);
              try {
                const res = await verifyOrder2API({
                  order_id_list: selectedRowKeys.map(Number),
                });
                if (res.code !== 0) {
                  message.error((res.message || "") + (res.hint || ""));
                  return;
                }
                message.success("批量通过医嘱成功");
                clearSelection();
                await reload();
              } finally {
                setBatchLoading(false);
              }
            }}
          >
            批量通过
          </Button>
        </div>
      )}
      extraColumns={(ctx) => [
        {
          title: "操作",
          key: "action",
          fixed: "right",
          width: 128,
          render: (_: unknown, record: any) => (
            <div className="flex items-center gap-1">
              <Button
                variant="outlined"
                color="primary"
                size="small"
                loading={ctx.actingId === record.order_id}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleVerify(record, ctx);
                }}
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                loading={ctx.actingId === record.order_id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(record, ctx);
                }}
              >
                退回
              </Button>
            </div>
          ),
        },
      ]}
    />
  );
}
