import { useCallback, useState } from "react";
import { App } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { deletePrepayAPI, refundPrepayAPI } from "@/api/account";
import type { PrepayRow, PrepayType } from "@/types/account";
import type { DealerRow } from "@/types/pay";
import {
  PrepayPayDialog,
  formatAmount,
  usePrepayDealers,
  usePrepayRecharge,
  usePrepayTypeState,
} from "../PrepayDeposit";
import { usePrepayList } from "./hooks/usePrepayList";
import PrepayDeleteModal from "./PrepayDeleteModal";
import PrepayHistoryTable from "./PrepayHistoryTable";
import PrepayListTypeBar from "./PrepayListTypeBar";
import PrepayRefundRowModal from "./PrepayRefundRowModal";
import PrepayRestartPayModal from "./PrepayRestartPayModal";

export interface PrepayListProps {
  patient_id?: number;
  /**
   * 有值：锁定预交金类型，不展示 Radio；
   * 无值：默认门诊(O)，可切换。
   */
  prepay_type?: PrepayType;
  /** 外部递增以静默刷新列表（用于对侧操作后联动） */
  refreshKey?: number;
  /** 退款/删除/重新发起成功后通知外部（用于联动刷新余额） */
  onChange?: () => void;
  className?: string;
}

/**
 * 预交金流水公共组件：类型切换 + 流水表 + 行内退款/删除/重新发起。
 * 宽高默认占满，由外侧父容器控制尺寸。
 * 支付相关逻辑复用 PrepayDeposit（usePrepayRecharge / PrepayPayDialog 等）。
 */
const PrepayList = ({
  patient_id,
  prepay_type,
  refreshKey = 0,
  onChange,
  className,
}: PrepayListProps) => {
  const { message } = App.useApp();
  const { prepayType, setPrepayType, showTypeSelector } =
    usePrepayTypeState(prepay_type);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(3, "day"),
    dayjs(),
  ]);

  const [rowRefundOpen, setRowRefundOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<PrepayRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    rows,
    loading: listLoading,
    refresh: refreshList,
  } = usePrepayList(patient_id, prepayType, dateRange, refreshKey);

  const { dealers } = usePrepayDealers();

  const handleAfterChange = useCallback(async () => {
    setTimeout(() => {
      void refreshList();
      onChange?.();
    }, 500);
  }, [onChange, refreshList]);

  const {
    paying,
    dialog,
    closeDialog,
    startRecharge,
    submitActiveCode,
    switchQrMode,
  } = usePrepayRecharge(handleAfterChange);

  const handleRowRefund = useCallback(
    async (refundAmount: string, refundNote?: string) => {
      if (!currentRow?.prepay_id) return;
      setActionLoading(true);
      try {
        await refundPrepayAPI({
          prepay_id: currentRow.prepay_id,
          refund_amount: formatAmount(refundAmount),
          refund_note: refundNote,
          auto_pay: true,
        });
        message.success("退款成功");
        setRowRefundOpen(false);
        setCurrentRow(null);
        await handleAfterChange();
      } catch {
        message.error("退款失败");
      } finally {
        setActionLoading(false);
      }
    },
    [currentRow?.prepay_id, handleAfterChange, message],
  );

  const handleDelete = useCallback(
    async (deleteNote: string) => {
      if (!currentRow?.prepay_id) return;
      setActionLoading(true);
      try {
        await deletePrepayAPI({
          prepay_id: currentRow.prepay_id,
          delete_note: deleteNote,
        });
        message.success("已删除");
        setDeleteOpen(false);
        setCurrentRow(null);
        await handleAfterChange();
      } catch {
        message.error("删除失败");
      } finally {
        setActionLoading(false);
      }
    },
    [currentRow?.prepay_id, handleAfterChange, message],
  );

  const handleRestartPay = useCallback(
    async (dealer: DealerRow) => {
      if (!patient_id || !currentRow?.prepay_id) {
        message.warning("缺少预交金信息");
        return;
      }
      setRestartOpen(false);
      const amount = formatAmount(currentRow.prepay_amount);
      const row = currentRow;
      setCurrentRow(null);
      await startRecharge({
        patientId: patient_id,
        prepayType,
        amount,
        dealer,
        prepayId: row.prepay_id,
      });
    },
    [currentRow, message, patient_id, prepayType, startRecharge],
  );

  return (
    <div
      className={[
        "flex h-full w-full min-h-0 flex-col gap-2 overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showTypeSelector && (
        <PrepayListTypeBar
          prepayType={prepayType}
          onTypeChange={setPrepayType}
        />
      )}

      {/* overflow-auto 不能省略 */}
      <div className="min-h-0 h-full flex-1 overflow-auto">
        <PrepayHistoryTable
          rows={rows}
          loading={listLoading}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefund={(row) => {
            setCurrentRow(row);
            setRowRefundOpen(true);
          }}
          onDelete={(row) => {
            setCurrentRow(row);
            setDeleteOpen(true);
          }}
          onRestart={(row) => {
            setCurrentRow(row);
            setRestartOpen(true);
          }}
        />
      </div>

      <PrepayPayDialog
        open={dialog.open}
        amount={dialog.amount}
        dealer={dialog.dealer}
        dealerTag={dialog.dealerTag}
        qrMode={dialog.qrMode}
        qrImage={dialog.qrImage}
        submitting={dialog.submitting}
        onCancel={closeDialog}
        onSwitchMode={(mode) => void switchQrMode(mode)}
        onSubmitActiveCode={(code) => void submitActiveCode(code)}
      />

      <PrepayRefundRowModal
        open={rowRefundOpen}
        row={currentRow}
        submitting={actionLoading}
        onCancel={() => {
          setRowRefundOpen(false);
          setCurrentRow(null);
        }}
        onSubmit={handleRowRefund}
      />

      <PrepayDeleteModal
        open={deleteOpen}
        submitting={actionLoading}
        onCancel={() => {
          setDeleteOpen(false);
          setCurrentRow(null);
        }}
        onSubmit={handleDelete}
      />

      <PrepayRestartPayModal
        open={restartOpen}
        dealers={dealers}
        submitting={paying}
        onCancel={() => {
          setRestartOpen(false);
          setCurrentRow(null);
        }}
        onPay={handleRestartPay}
      />
    </div>
  );
};

export default PrepayList;
