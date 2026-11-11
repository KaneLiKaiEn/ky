import { useCallback, useState } from "react";
import { App, Input } from "antd";
import {
  cancelOrderAPI,
  commitOrderAPI,
  endOrderAPI,
  execOrderAPI,
  getOrderCheckAlertListAPI,
  getOrderCheckConfirmListAPI,
  stopOrderAPI,
  terminateOrderAPI,
  undoCommitOrderAPI,
  undoStopOrderAPI,
  undoVerifyOrderAPI,
  verifyOrderAPI,
} from "@/api/ordent";
import type {
  OrderCheckAlertRow,
  OrderCheckConfirmRow,
  OrderRow,
} from "@/types/ordent";
import type { OrderCheckModalResult } from "./OrderCheckModal";
import type { OrderRowAction } from "./types";

const SUCCESS_TEXT: Partial<Record<OrderRowAction, string>> = {
  commit: "提交成功",
  undoCommit: "已取消提交",
  stop: "停止医嘱成功",
  undoStop: "已撤销停止",
  verify: "校对医嘱成功",
  return: "退回医嘱成功",
  exec: "执行医嘱成功",
  end: "停止医嘱成功",
  terminate: "作废医嘱成功",
  undoVerify: "取消通过成功",
};

interface UseOrderRowActionsOptions {
  loadOrders: (fromNewOrder?: boolean, override?: { page?: number; size?: number }) => Promise<OrderRow[]>;
  selectedOrderId?: number | null;
  onRowClick?: (row: OrderRow) => void;
  onRowAction?: (action: OrderRowAction, row: OrderRow) => void;
}

interface QcBundle {
  row: OrderRow;
  alertList: OrderCheckAlertRow[];
  confirmList: OrderCheckConfirmRow[];
}

interface UseOrderRowActionsResult {
  rowActionLoading: boolean;
  handleRowAction: (action: OrderRowAction, row: OrderRow) => void;
  qcOpen: boolean;
  qcLoading: boolean;
  qcBundle: QcBundle | null;
  confirmQc: (result: OrderCheckModalResult) => Promise<void>;
  cancelQc: () => void;
  refreshQc: () => Promise<void>;
  stopOpen: boolean;
  confirmStop: (stopTime: string) => Promise<void>;
  cancelStop: () => void;
}

export function useOrderRowActions({
  loadOrders,
  selectedOrderId,
  onRowClick,
  onRowAction,
}: UseOrderRowActionsOptions): UseOrderRowActionsResult {
  const { message, modal } = App.useApp();
  const [rowActionLoading, setRowActionLoading] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [qcLoading, setQcLoading] = useState(false);
  const [qcBundle, setQcBundle] = useState<QcBundle | null>(null);
  const [stopOpen, setStopOpen] = useState(false);
  const [stopRow, setStopRow] = useState<OrderRow | null>(null);

  const runAction = useCallback(
    async (
      action: OrderRowAction,
      row: OrderRow,
      request: () => Promise<{ code?: number }>,
    ) => {
      const orderId = row.order_id;
      if (orderId == null) return false;

      setRowActionLoading(true);
      try {
        const res = await request();
        if (res?.code !== 0) return false;

        const text = SUCCESS_TEXT[action];
        if (text) message.success(text);

        // 对某一行医嘱的操作，肯定不是 新建 
        const nextRows = await loadOrders(false);
        const next = nextRows.find((item) => item.order_id === orderId);
        if (next && selectedOrderId === orderId) {
          onRowClick?.(next);
        }
        onRowAction?.(action, next ?? row);
        return true;
      } finally {
        setRowActionLoading(false);
      }
    },
    [loadOrders, message, onRowAction, onRowClick, selectedOrderId],
  );

  const fetchQcBundle = useCallback(async (row: OrderRow) => {
    const orderId = row.order_id;
    if (orderId == null) return null;
    const [alertRes, confirmRes] = await Promise.all([
      getOrderCheckAlertListAPI({ order_id: orderId }),
      getOrderCheckConfirmListAPI({ order_id: orderId }),
    ]);
    if (alertRes.code !== 0 || confirmRes.code !== 0) return null;
    return {
      row,
      alertList: alertRes.row_list ?? [],
      confirmList: confirmRes.row_list ?? [],
    };
  }, []);

  const requestCommit = useCallback(
    async (row: OrderRow) => {
      setRowActionLoading(true);
      try {
        const bundle = await fetchQcBundle(row);
        if (!bundle) return;
        if (bundle.alertList.length === 0 && bundle.confirmList.length === 0) {
          await runAction("commit", row, () =>
            commitOrderAPI({ order_id: row.order_id }),
          );
          return;
        }
        setQcBundle(bundle);
        setQcOpen(true);
      } finally {
        setRowActionLoading(false);
      }
    },
    [fetchQcBundle, runAction],
  );

  const confirmQc = useCallback(
    async (result: OrderCheckModalResult) => {
      if (!qcBundle) return;
      const orderId = qcBundle.row.order_id;
      if (orderId == null) return;
      setQcLoading(true);
      try {
        const ok = await runAction("commit", qcBundle.row, () =>
          commitOrderAPI({
            order_id: orderId,
            alert_list: result.alert_list.length ? result.alert_list : undefined,
            confirm_list: result.confirm_list.length
              ? result.confirm_list
              : undefined,
          }),
        );
        if (ok) {
          setQcOpen(false);
          setQcBundle(null);
        }
      } finally {
        setQcLoading(false);
      }
    },
    [qcBundle, runAction],
  );

  const cancelQc = useCallback(() => {
    setQcOpen(false);
    setQcBundle(null);
  }, []);

  const refreshQc = useCallback(async () => {
    if (!qcBundle) return;
    const bundle = await fetchQcBundle(qcBundle.row);
    if (bundle) setQcBundle(bundle);
  }, [fetchQcBundle, qcBundle]);

  const cancelStop = useCallback(() => {
    setStopOpen(false);
    setStopRow(null);
  }, []);

  const confirmStop = useCallback(
    async (stopTime: string) => {
      if (!stopRow?.order_id) return;
      const ok = await runAction("stop", stopRow, () =>
        stopOrderAPI({
          order_id: stopRow.order_id,
          stop_time: stopTime,
        }),
      );
      if (ok) {
        setStopOpen(false);
        setStopRow(null);
      }
    },
    [runAction, stopRow],
  );

  const handleRowAction = useCallback(
    (action: OrderRowAction, row: OrderRow) => {
      const orderId = row.order_id;
      if (orderId == null) return;

      if (action === "commit") {
        void requestCommit(row);
        return;
      }

      if (action === "stop") {
        setStopRow(row);
        setStopOpen(true);
        return;
      }

      if (action === "return") {
        let returnNote = "";
        modal.confirm({
          title: "退回原因",
          icon: null,
          content: (
            <Input.TextArea
              rows={4}
              placeholder="请输入退回原因（可选）"
              onChange={(e) => {
                returnNote = e.target.value;
              }}
            />
          ),
          okText: "确定",
          cancelText: "取消",
          okType: "danger",
          onOk: async () => {
            const note = returnNote.trim();
            /* if (!note) {
              message.warning("请输入退回原因");
              return Promise.reject();
            } */
            await runAction("return", row, () =>
              verifyOrderAPI({
                order_id: orderId,
                return_order: true,
                return_note: note,
              }),
            );
          },
        });
        return;
      }

      // 临时医嘱/出院带药：医生需要可以作废医嘱，只要提交完，就可以作废
      if (action === "cancel") {
         runAction("cancel", row, () =>
          cancelOrderAPI({ order_id: orderId }),
        );
        return;
      }

      const requestByAction: Partial<
        Record<OrderRowAction, () => Promise<{ code?: number }>>
      > = {
        undoCommit: () => undoCommitOrderAPI({ order_id: orderId }),
        undoStop: () => undoStopOrderAPI({ order_id: orderId }),
        verify: () => verifyOrderAPI({ order_id: orderId }),
        exec: () => execOrderAPI({ order_id: orderId }),
        end: () => endOrderAPI({ order_id: orderId }),
        terminate: () => terminateOrderAPI({ order_id: orderId }),
        undoVerify: () => undoVerifyOrderAPI({ order_id: orderId }),
      };

      const request = requestByAction[action];
      if (!request) return;
      void runAction(action, row, request);
    },
    [message, modal, requestCommit, runAction],
  );

  return {
    rowActionLoading,
    handleRowAction,
    qcOpen,
    qcLoading,
    qcBundle,
    confirmQc,
    cancelQc,
    refreshQc,
    stopOpen,
    confirmStop,
    cancelStop,
  };
}
