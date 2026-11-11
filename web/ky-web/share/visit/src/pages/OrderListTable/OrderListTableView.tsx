import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import {
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  EditOutlined,
  PaperClipOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RollbackOutlined,
  SendOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Pagination, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TableRowSelection } from "antd/es/table/interface";
import type { OrderRow } from "@/types/ordent";
import dayjs from "dayjs";
import type { OrderWorkspaceKind } from "./orderCatalogFilters";
import {
  canCancelOrder,
  canCommitOrder,
  canDoctorStopOrder,
  canEditOrder,
  canNurseEndOrder,
  canNurseExecOrder,
  canNurseTerminateOrder,
  canNurseUndoVerifyOrder,
  canNurseVerifyOrder,
  canUndoCommitOrder,
  canUndoStopOrder,
  ORDER_STATUS_ROW_CLASS,
  orderStatusLabel,
  orderStatusRowClassName,
  orderStatusTagColor,
} from "./orderStatus";
import {
  canShowOrderAttachIcon,
  hasOrderAttachItems,
} from "./orderAttachUtils";
import type {
  OrderListTableViewHandle,
  OrderRowAction,
  OrderWorkType,
} from "./types";
import OrderFeeDetailTable from "./OrderFeeDetailTable";
import ResizableHeaderCell from "./ResizableHeaderCell";
import { withResizableColumns } from "./withResizableColumns";

interface OrderListTableViewProps {
  kind: OrderWorkspaceKind;
  /** 出院带药是否展示摆药列，默认不展示 */
  showDispenseStatus?: boolean;
  loading?: boolean;
  dataSource: OrderRow[];
  selectedOrderId?: number | null;
  checkedOrderIds?: number[];
  onCheckedOrderIdsChange?: (ids: number[]) => void;
  selectionType?: TableRowSelection<OrderRow>["type"];
  readOnly?: boolean;
  pageNo: number;
  pageSize: number;
  pageCount: number;
  onRowClick?: (row: OrderRow) => void;
  onRowDoubleClick?: (row: OrderRow) => void;
  onPaginationChange?: (page: number, pageSize: number) => void;
  onRowAction?: (action: OrderRowAction, row: OrderRow) => void;
  actionLoading?: boolean;
  workType?: OrderWorkType;
  onOpenAttachModal?: (row: OrderRow) => void;
  /** 临时医嘱：执行单已计费的 order_id，用于行 warning 底色 */
  chargedOrderIds?: ReadonlySet<number>;
  /** 临时医嘱：执行单已执行的 order_id，用于行 info 底色 */
  temporaryExecutedOrderIds?: ReadonlySet<number>;
  /** 出院带药：已摆（apply_status 为 DELIVERY）的 order_id */
  dispensedOrderIds?: ReadonlySet<number>;
  ref?: Ref<OrderListTableViewHandle>;
}

// 因为 医嘱内容 是展示的后端返回的 html ， 所以要多加下面这几个类名 。 用法不需要加是因为 用法的内容一般不会很长，不会溢出， 而医嘱内容可能很长，会溢出，所以需要加
const orderContentCellProps = () => ({
  className: "min-w-0! max-w-0 overflow-hidden",
});

// 统一使用这个方法来处理医嘱内容和用法
const renderFmtContent = (value?: string) => {
  if (!value) return "-";
  return (
    <Tooltip title={<div dangerouslySetInnerHTML={{ __html: value }} />}>
      <div
        className="min-w-0 max-w-full truncate [&_*]:inline"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </Tooltip>
  );
};

const stopRowPointer = (e: { stopPropagation: () => void }) => {
  e.stopPropagation();
};

/** 与行底色 class 一一对应，只列出当前工作台实际会涂上的颜色 */
const ORDER_ROW_COLOR_LEGENDS: Record<
  OrderWorkspaceKind,
  { label: string; className: string }[]
> = {
  longTerm: [
    { label: "已校对", className: ORDER_STATUS_ROW_CLASS.verified },
    { label: "执行中", className: ORDER_STATUS_ROW_CLASS.executing },
    { label: "已停止", className: ORDER_STATUS_ROW_CLASS.stopped },
  ],
  temporary: [
    { label: "已校对", className: ORDER_STATUS_ROW_CLASS.verified },
    { label: "已执行", className: ORDER_STATUS_ROW_CLASS.executed },
    { label: "已计费", className: ORDER_STATUS_ROW_CLASS.charged },
    { label: "已作废", className: ORDER_STATUS_ROW_CLASS.voided },
  ],
  discharge: [
    { label: "已校对", className: ORDER_STATUS_ROW_CLASS.verified },
    { label: "已执行", className: ORDER_STATUS_ROW_CLASS.executed },
    { label: "已作废", className: ORDER_STATUS_ROW_CLASS.voided },
  ],
};

const OrderRowColorLegend = ({ kind }: { kind: OrderWorkspaceKind }) => (
  <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-(--app-theme-text-secondary)">
    {ORDER_ROW_COLOR_LEGENDS[kind].map((item) => (
      <span
        key={item.label}
        className="inline-flex items-center gap-1 whitespace-nowrap"
      >
        {item.label}：
        <span
          className={`inline-block h-4 w-8 shrink-0 rounded-sm border border-(--app-theme-border) ${item.className}`}
        />
      </span>
    ))}
  </div>
);

const getTableScroller = (root: HTMLElement) =>
  (root.querySelector(".ant-table-content") as HTMLElement | null) ??
  (root.querySelector(".ant-table-body") as HTMLElement | null);

// 滚动到最底部
export const scrollTableToBottom = (
  root: HTMLElement,
  behavior: ScrollBehavior = "smooth",
) => {
  const scroller = getTableScroller(root);
  scroller?.scrollTo({ top: scroller.scrollHeight, behavior });
};

const renderActionButton = (
  key: string,
  title: string,
  icon: ReactNode,
  disabled: boolean | undefined,
  onClick: (row: OrderRow) => void,
  row: OrderRow,
) => (
  <Tooltip key={key} title={title}>
    <Button
      type="link"
      size="small"
      icon={icon}
      className="px-0.5!"
      disabled={disabled}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick(row);
      }}
      onDoubleClick={stopRowPointer}
    />
  </Tooltip>
);

const renderDoctorActions = (
  row: OrderRow,
  onRowAction?: (action: OrderRowAction, row: OrderRow) => void,
  actionLoading?: boolean,
  onRowDoubleClick?: (row: OrderRow) => void,
  kind?: OrderWorkspaceKind,
): ReactNode[] => {
  const buttons: ReactNode[] = [];
  if (canEditOrder(row)) {
    buttons.push(
      renderActionButton(
        "edit",
        "编辑",
        <EditOutlined />,
        actionLoading,
        (target) => onRowDoubleClick?.(target),
        row,
      ),
    );
  }
  if (canCommitOrder(row)) {
    buttons.push(
      renderActionButton(
        "commit",
        "提交",
        <SendOutlined />,
        actionLoading,
        (target) => onRowAction?.("commit", target),
        row,
      ),
    );
  }
  if (canUndoCommitOrder(row)) {
    buttons.push(
      renderActionButton(
        "undo",
        "取消提交",
        <RollbackOutlined />,
        actionLoading,
        (target) => onRowAction?.("undoCommit", target),
        row,
      ),
    );
  }
  if (kind === "longTerm" && canDoctorStopOrder(row)) {
    buttons.push(
      renderActionButton(
        "stop",
        "停止",
        <PauseCircleOutlined />,
        actionLoading,
        (target) => onRowAction?.("stop", target),
        row,
      ),
    );
  }
  if (canUndoStopOrder(row)) {
    buttons.push(
      renderActionButton(
        "undoStop",
        "撤销停止",
        <UndoOutlined />,
        actionLoading,
        (target) => onRowAction?.("undoStop", target),
        row,
      ),
    );
  }
  // 临时医嘱/出院带药：医生需要可以作废医嘱，只要提交完，就可以作废，医生调用 cancel ， 护士调用 terminate
  if (kind !== "longTerm" && canCancelOrder(row)) {
    buttons.push(
      renderActionButton(
        "cancel",
        "作废",
        <CloseCircleOutlined />,
        actionLoading,
        (target) => onRowAction?.("cancel", target),
        row,
      ),
    );
  }
  return buttons;
};

const renderNurseActions = (
  row: OrderRow,
  onRowAction?: (action: OrderRowAction, row: OrderRow) => void,
  actionLoading?: boolean,
  onOpenAttachModal?: (row: OrderRow) => void,
): ReactNode[] => {
  const buttons: ReactNode[] = [];
  if (canNurseVerifyOrder(row)) {
    buttons.push(
      renderActionButton(
        "verify",
        "校对通过",
        <CheckOutlined />,
        actionLoading,
        (target) => onRowAction?.("verify", target),
        row,
      ),
      renderActionButton(
        "return",
        "退回",
        <CloseOutlined />,
        actionLoading,
        (target) => onRowAction?.("return", target),
        row,
      ),
    );
  }
  if (canNurseUndoVerifyOrder(row)) {
    buttons.push(
      renderActionButton(
        "undoVerify",
        "取消通过",
        <RollbackOutlined />,
        actionLoading,
        (target) => onRowAction?.("undoVerify", target),
        row,
      ),
    );
  }
  if (canNurseExecOrder(row)) {
    buttons.push(
      renderActionButton(
        "exec",
        "执行",
        <PlayCircleOutlined />,
        actionLoading,
        (target) => onRowAction?.("exec", target),
        row,
      ),
    );
  }
  if (canNurseEndOrder(row)) {
    buttons.push(
      renderActionButton(
        "end",
        "停止",
        <PauseCircleOutlined />,
        actionLoading,
        (target) => onRowAction?.("end", target),
        row,
      ),
    );
  }
  if (canNurseTerminateOrder(row)) {
    buttons.push(
      renderActionButton(
        "terminate",
        "作废",
        <CloseCircleOutlined />,
        actionLoading,
        (target) => onRowAction?.("terminate", target),
        row,
      ),
    );
  }
  if (canShowOrderAttachIcon(row)) {
    buttons.push(
      <Tooltip key="attach" title="附加材料和计费">
        <Button
          type="link"
          size="small"
          icon={<PaperClipOutlined />}
          className={
            hasOrderAttachItems(row)
              ? "px-0.5! text-(--ant-color-success)!"
              : "px-0.5!"
          }
          aria-label="附加材料和计费"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAttachModal?.(row);
          }}
          onDoubleClick={stopRowPointer}
        />
      </Tooltip>,
    );
  }
  return buttons;
};

const buildColumns = (
  pageNo: number,
  pageSize: number,
  readOnly: boolean,
  onRowAction?: (action: OrderRowAction, row: OrderRow) => void,
  actionLoading?: boolean,
  kind?: OrderWorkspaceKind,
  showDispenseStatus = false,
  onRowDoubleClick?: (row: OrderRow) => void,
  workType: OrderWorkType = "DOCTOR",
  onOpenAttachModal?: (row: OrderRow) => void,
  dispensedOrderIds?: ReadonlySet<number>,
): ColumnsType<OrderRow> => {
  const columns: ColumnsType<OrderRow> = [
    {
      title: "序号",
      key: "index",
      width: 64,
      align: "center",
      render: (_value, row, index) => {
        const seq = (pageNo - 1) * pageSize + index + 1;
        return (row.rx_id ?? 0) > 0 ? `${seq}*` : seq;
      },
    },
    ...(kind === "longTerm"
      ? [
          {
            title: "起始",
            children: [
              {
                title: "时间",
                dataIndex: "order_time",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
                render: (value?: string) =>
                  value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-",
              },
              {
                title: "医生",
                dataIndex: "order_user_name",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
              },
              {
                title: "护士",
                dataIndex: "verify_user",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
              },
            ],
          },
          {
            title: "医嘱",
            children: [
              {
                title: "项目",
                // 这里可以通过加 key 或者通过配置 width 属性来设置默认列宽
                dataIndex: "order_content_fmt",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
                // 因为医嘱内容是 html ， 所以需要加下面的类名才能让 医嘱 的列宽度缩的比内容窄
                onCell: orderContentCellProps,
                render: renderFmtContent,
              },
              {
                title: "用法",
                dataIndex: "order_usage_fmt",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
                render: renderFmtContent,
              },
            ],
          },
          {
            title: "结束",
            children: [
              {
                title: "时间",
                dataIndex: "stop_time",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
                render: (value?: string) =>
                  value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-",
              },
              {
                title: "医生",
                dataIndex: "stop_user",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
              },
              {
                title: "护士",
                dataIndex: "end_user",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
              },
            ],
          },
        ]
      : [
          {
            title: "下达",
            children: [
              {
                title: "时间",
                dataIndex: "order_time",
                align: "center" as const,
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
                render: (value?: string) =>
                  value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-",
              },
              {
                title: "医嘱",
                dataIndex: "order_content_fmt",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
                // 因为医嘱内容是 html ， 所以需要加下面的类名才能让 医嘱 的列宽度缩的比内容窄
                onCell: orderContentCellProps,
                render: renderFmtContent,
              },
              {
                title: "用法",
                dataIndex: "order_usage_fmt",
                render: renderFmtContent,
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
              },
              {
                title: "执行科室",
                align: "center" as const,
                dataIndex: "exec_dept_name",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
              },
              {
                title: "医生",
                dataIndex: "order_user_name",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
              },
            ],
          },
          {
            title: "校对",
            children: [
              {
                title: "时间",
                dataIndex: "verify_time",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
                render: (value?: string) =>
                  value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-",
              },
              {
                title: "护士",
                dataIndex: "verify_user",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
              },
            ],
          },
          {
            title: "执行",
            children: [
              {
                title: "时间",
                dataIndex: "exec_time",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
                render: (value?: string) =>
                  value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-",
              },
              {
                title: "护士",
                dataIndex: "exec_user",
                onHeaderCell: () => ({
                  style: { textAlign: "center" as const },
                }),
              },
            ],
          },
        ]),
    {
      title: "状态",
      dataIndex: "order_status",
      align: "center",
      render: (value: string, row: OrderRow) => {
        const status = orderStatusLabel(value, row);
        const tagElement = (
          <Tag color={orderStatusTagColor(value)} className="m-0!">
            {orderStatusLabel(value, row)}
          </Tag>
        );
        if (status === "已退回") {
          return <Tooltip title={row.verify_note}>{tagElement}</Tooltip>;
        } else {
          return tagElement;
        }
      },
    },
    ...(kind === "discharge" && showDispenseStatus
      ? [
          {
            title: "摆药",
            key: "dispense_status",
            align: "center" as const,
            width: 80,
            render: (_value: unknown, row: OrderRow) => {
              const dispensed =
                row.order_id != null &&
                dispensedOrderIds?.has(row.order_id) === true;
              return (
                <Tag color={dispensed ? "success" : "default"} className="m-0!">
                  {dispensed ? "已摆" : "未摆"}
                </Tag>
              );
            },
          },
        ]
      : []),
    /* {
      title: "处方",
      dataIndex: "rx_id",
      key: "rx_id",
      width: 80,
      align: "center",
      render: (value?: number) => ((value ?? 0) > 0 ? value : "-"),
    }, */
  ];

  if (!readOnly) {
    columns.push({
      title: "操作",
      key: "actions",
      width: 160,
      fixed: "right",
      align: "center",
      render: (_value, row) => {
        const buttons =
          workType === "NURSE"
            ? renderNurseActions(
                row,
                onRowAction,
                actionLoading,
                onOpenAttachModal,
              )
            : renderDoctorActions(
                row,
                onRowAction,
                actionLoading,
                onRowDoubleClick,
                kind,
              );
        return (
          <Space size={0} className="gap-2">
            {buttons}
          </Space>
        );
      },
    });
  }

  return columns;
};

const OrderListTableView = ({
  loading,
  dataSource,
  selectedOrderId,
  checkedOrderIds = [],
  onCheckedOrderIdsChange,
  selectionType = "radio",
  readOnly = false,
  pageNo,
  pageSize,
  pageCount,
  onRowClick,
  onRowDoubleClick,
  onPaginationChange,
  onRowAction,
  actionLoading,
  kind,
  showDispenseStatus = false,
  workType = "DOCTOR",
  onOpenAttachModal,
  chargedOrderIds,
  temporaryExecutedOrderIds,
  dispensedOrderIds,
  ref,
}: OrderListTableViewProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);

  /** 当前展示费用明细的医嘱；行点击或 checkbox 选中时更新，无选中时不展示表格 */
  const [feeDetailOrderId, setFeeDetailOrderId] = useState<number | null>(null);

  // 存储表格列列宽的数据
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const handleColumnWidthChange = useCallback(
    (colKey: string, width: number) => {
      setColumnWidths((current) => ({
        ...current,
        [colKey]: width,
      }));
    },
    [],
  );

  useImperativeHandle(ref, () => ({
    scrollTableToBottom: () => {
      pendingScrollRef.current = true;
    },
  }));

  useLayoutEffect(() => {
    if (!pendingScrollRef.current || loading || !bodyRef.current) return;
    pendingScrollRef.current = false;
    const root = bodyRef.current;
    const raf = window.requestAnimationFrame(() => {
      scrollTableToBottom(root);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [loading, dataSource]);

  const columns = useMemo(() => {
    const base = buildColumns(
      pageNo,
      pageSize,
      readOnly,
      onRowAction,
      actionLoading,
      kind,
      showDispenseStatus,
      onRowDoubleClick,
      workType,
      onOpenAttachModal,
      dispensedOrderIds,
    );

    return withResizableColumns(base, columnWidths, handleColumnWidthChange);
  }, [
    pageNo,
    pageSize,
    readOnly,
    onRowAction,
    actionLoading,
    kind,
    showDispenseStatus,
    onRowDoubleClick,
    workType,
    onOpenAttachModal,
    dispensedOrderIds,
    columnWidths,
    handleColumnWidthChange,
  ]);

  const rowSelection = useMemo<TableRowSelection<OrderRow> | undefined>(() => {
    if (!onCheckedOrderIdsChange) return undefined;
    return {
      type: selectionType,
      selectedRowKeys: checkedOrderIds,
      onChange: (keys) => {
        const nextIds = keys
          .map((k) => Number(k))
          .filter((n) => Number.isFinite(n) && n > 0);
        setFeeDetailOrderId((current) => {
          const prevSet = new Set(checkedOrderIds);
          const added = nextIds.filter((id) => !prevSet.has(id));
          if (added.length > 0) {
            return added[added.length - 1] ?? null;
          }
          if (current != null && !nextIds.includes(current)) {
            return null;
          }
          return current;
        });
        onCheckedOrderIdsChange(nextIds);
      },
      getCheckboxProps: (row) => ({
        disabled: row.order_id == null,
      }),
      onCell: () => ({
        onClick: stopRowPointer,
        onDoubleClick: stopRowPointer,
      }),
    };
  }, [checkedOrderIds, onCheckedOrderIdsChange, selectionType]);

  const hasRowPointer = !!(
    onRowClick ||
    onRowDoubleClick ||
    onCheckedOrderIdsChange
  );

  const handleRowClick = (row: OrderRow) => {
    const id = row.order_id;
    if (id != null) {
      setFeeDetailOrderId(id);
    }
    if (id != null && onCheckedOrderIdsChange) {
      if (selectionType === "checkbox") {
        if (!checkedOrderIds.includes(id)) {
          onCheckedOrderIdsChange([...checkedOrderIds, id]);
        }
      } else if (checkedOrderIds.length !== 1 || checkedOrderIds[0] !== id) {
        onCheckedOrderIdsChange([id]);
      }
    }
    onRowClick?.(row);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={bodyRef} className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Table<OrderRow>
          size="small"
          rowKey={(row) => row.order_id ?? row.order_no ?? ""}
          loading={loading || actionLoading}
          columns={columns}
          bordered
          dataSource={dataSource}
          pagination={false}
          tableLayout="fixed"
          // 可拖拽列头
          components={{ header: { cell: ResizableHeaderCell } }}
          // 加上 y 滚动即可固定表头。没有固定表头的话直接 y: "100%" 即可，这里要 减去表头 78px 的高度，不然最后一条数据会被遮挡
          scroll={{ x: "max-content", y: "calc(100% - 78px)" }}
          rowSelection={rowSelection}
          rowClassName={(row) => {
            const classes: string[] = [];
            // 以 [STOPALL_ 来做判断
            if ((row.sys_tag ?? "").includes("[STOPALL_")) {
              classes.push("order-row-stopall");
            }

            if (row.order_id == null) return classes.join(" ");
            const highlighted = onCheckedOrderIdsChange
              ? checkedOrderIds.includes(row.order_id)
              : row.order_id === selectedOrderId;
            if (highlighted) classes.push("bg-(--app-theme-primary-bg)!");
            const statusRowClass = orderStatusRowClassName(row, kind);
            if (statusRowClass) classes.push(statusRowClass);

            // 如果医嘱类型为临时医嘱，且执行单已执行，则添加 executed 底色 -- 以 已执行 为主
            if (
              kind === "temporary" &&
              temporaryExecutedOrderIds?.has(row.order_id)
            ) {
              classes.push(ORDER_STATUS_ROW_CLASS.executed);

              // 如果医嘱类型为临时医嘱，且执行单已计费，则添加 charged 底色
            } else if (
              kind === "temporary" &&
              chargedOrderIds?.has(row.order_id)
            ) {
              classes.push(ORDER_STATUS_ROW_CLASS.charged);
            }
            return classes.join(" ");
          }}
          onRow={(row) => ({
            onClick: () => handleRowClick(row),
            onDoubleClick: () => onRowDoubleClick?.(row),
            className: hasRowPointer ? "cursor-pointer" : undefined,
          })}
          className="
            [&_.ant-table]:text-[12px] 
            [&_tr.order-row-stopall>td]:border-t
            [&_tr.order-row-stopall>td]:border-t-solid
            [&_tr.order-row-stopall>td]:border-t-(--app-theme-error)! 
            /* 确保表格内容区域占据整个容器高度所需的类名 */
            h-full [&_.ant-spin]:h-full 
            [&_.ant-spin-container]:h-full 
            [&_.ant-table]:h-full 
            [&_.ant-table-container]:h-full 
            [&_.ant-table-content]:h-full 
            [&_.ant-table-content]:overflow-auto! 
            [&_.ant-table-body]:h-full!
          "
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-(--app-theme-border) pt-2">
        <OrderRowColorLegend kind={kind} />
        <Pagination
          className="shrink-0"
          size="small"
          current={pageNo}
          pageSize={pageSize}
          total={pageCount * pageSize}
          showSizeChanger
          showQuickJumper
          pageSizeOptions={[50, 100, 200, 500]}
          showTotal={() => `共 ${pageCount} 页`}
          onChange={(page, nextPageSize) => {
            onPaginationChange?.(page, nextPageSize);
          }}
        />
      </div>

      {/* 费用明细表格 */}
      {feeDetailOrderId != null ? (
        <OrderFeeDetailTable orderId={feeDetailOrderId} kind={kind} />
      ) : null}
    </div>
  );
};

export default OrderListTableView;
