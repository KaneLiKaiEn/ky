import { useMemo } from "react";
import { Button, DatePicker, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import type { PrepayRow } from "../../types/account";
import {
  canDeleteOrRestart,
  canRefundRow,
  formatAmount,
  parseAmount,
} from "../PrepayDeposit";
import PrepayPrintDropdown from "./PrepayPrintDropdown";

const { RangePicker } = DatePicker;

export interface PrepayHistoryTableProps {
  rows: PrepayRow[];
  loading?: boolean;
  dateRange: [Dayjs, Dayjs];
  onDateRangeChange: (range: [Dayjs, Dayjs]) => void;
  onRefund: (row: PrepayRow) => void;
  onDelete: (row: PrepayRow) => void;
  onRestart: (row: PrepayRow) => void;
}

const PrepayHistoryTable = ({
  rows,
  loading,
  dateRange,
  onDateRangeChange,
  onRefund,
  onDelete,
  onRestart,
}: PrepayHistoryTableProps) => {
  const columns: ColumnsType<PrepayRow> = useMemo(
    () => [
      {
        title: "支付类型",
        dataIndex: "pay_name",
        key: "pay_name",
        width: 110,
        render: (value: string | undefined, row) => value || row.pay_type || "-",
      },
      {
        title: "预交金 ID",
        dataIndex: "prepay_id",
        key: "prepay_id",
        width: 120,
        render: (value?: number) => value ?? "-",
      },
      {
        title: "时间",
        dataIndex: "prepay_time",
        key: "prepay_time",
        width: 170,
        render: (value: string | undefined, row) =>
          value || row.pay_time || row.create_time || "-",
      },
      {
        title: "交易金额 (元)",
        dataIndex: "prepay_amount",
        key: "prepay_amount",
        width: 120,
        align: "right",
        render: (value?: string) => {
          const n = parseAmount(value);
          const colorClass =
            n < 0 ? "text-(--app-theme-success)" : "text-(--app-theme-error)";
          return <span className={colorClass}>{formatAmount(value)}</span>;
        },
      },
      {
        title: "已退 (元)",
        dataIndex: "refund_amount",
        key: "refund_amount",
        width: 100,
        align: "right",
        render: (value?: string) => (value ? formatAmount(value) : "-"),
      },
      {
        title: "操作",
        key: "action",
        width: 220,
        render: (_, row) => {
          const showRestartDelete = canDeleteOrRestart(row);
          const showRefund = canRefundRow(row);
          const prepayId = row.prepay_id;
          return (
            <Space size="small" wrap>
              {prepayId != null && (
                <PrepayPrintDropdown
                  prepayId={prepayId}
                  amount={row.prepay_amount}
                />
              )}
              {showRestartDelete && (
                <>
                  <Button
                    type="link"
                    danger
                    className="px-0"
                    onClick={() => onDelete(row)}
                  >
                    删除
                  </Button>
                  <Button
                    type="link"
                    className="px-0"
                    onClick={() => onRestart(row)}
                  >
                    重新发起交易
                  </Button>
                </>
              )}
              {showRefund && (
                <Button
                  type="link"
                  className="px-0"
                  onClick={() => onRefund(row)}
                >
                  退款
                </Button>
              )}
              {!prepayId && !showRestartDelete && !showRefund && (
                <span className="text-(--app-theme-text-secondary)">-</span>
              )}
            </Space>
          );
        },
      },
    ],
    [onDelete, onRefund, onRestart],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded bg-(--app-theme-bg-container) p-2">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-(--app-theme-text)">时间段</span>
          <RangePicker
            value={dateRange}
            allowClear={false}
            onChange={(values) => {
              if (values?.[0] && values[1]) {
                onDateRangeChange([values[0], values[1]]);
              }
            }}
          />
        </div>
        <span className="text-[13px] text-(--app-theme-text-secondary)">
          共 {rows.length} 条
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Table<PrepayRow>
          rowKey={(row) => String(row.prepay_id ?? row.create_time)}
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          size="small"
          sticky
        />
      </div>
    </div>
  );
};

export default PrepayHistoryTable;
