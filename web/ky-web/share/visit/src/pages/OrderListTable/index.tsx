import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import OrderAttachModal from "./OrderAttachModal";
import OrderCheckModal from "./OrderCheckModal";
import OrderListHeader from "./OrderListHeader";
import OrderListTableView from "./OrderListTableView";
import StopOrderModal from "./StopOrderModal";
import type { OrderRow } from "@/types/ordent";
import {
  ORDER_CATALOG_ALL,
  ORDER_CATALOG_FILTERS,
} from "./orderCatalogFilters";
import { ORDER_STATUS_ALL, ORDER_STATUS_FILTERS } from "./orderStatusFilters";
import type {
  OrderListTableHandle,
  OrderListTableProps,
  OrderListTableViewHandle,
  OrderRowAction,
  OrderWorkType,
} from "./types";
import { useOrderRowActions } from "./useOrderRowActions";
import { useOrderListSortOptions } from "./useOrderListSortOptions";
import { useVisitOrderList } from "./useVisitOrderList";

export type {
  OrderListTableHandle,
  OrderListTableProps,
  OrderListTableViewHandle,
  OrderRowAction,
  OrderWorkType,
};
export { scrollTableToBottom } from "./OrderListTableView";
export {
  ORDER_CATALOG_ALL,
  ORDER_CATALOG_FILTERS,
  ORDER_TYPE_BY_KIND,
  buildTemporaryCatalogFilters,
  toOrderCatalogParam,
  type OrderWorkspaceKind,
} from "./orderCatalogFilters";
export {
  canCancelOrder,
  canCommitOrder,
  canDeleteOrder,
  canEditOrder,
  canNurseEndOrder,
  canNurseExecOrder,
  canNurseTerminateOrder,
  canNurseUndoVerifyOrder,
  canNurseVerifyOrder,
  canStopOrder,
  canUndoCommitOrder,
  canUndoStopOrder,
  isCommittedStatus,
  isDraftStatus,
  isOrderedStatus,
  isTerminalStatus,
  normalizeOrderStatus,
  orderStatusLabel,
  orderStatusTagColor,
} from "./orderStatus";

function OrderListTable({
  visitId,
  babyId,
  rxId,
  catalogFilters,
  link_name,
  link_value,
  excludeCatalogs,
  kind,
  showDispenseStatus = false,
  workType = "DOCTOR",
  showHeader = true,
  readOnly = false,
  selectionType = "radio",
  selectedOrderId,
  checkedOrderIds,
  onCheckedOrderIdsChange,
  onCheckedRowsChange,
  onRowClick,
  onRowDoubleClick,
  onRowAction,
  actionLoading,
  defaultPageSize,
  ref,
}: OrderListTableProps) {
  const resolvedCatalogFilters = catalogFilters ?? ORDER_CATALOG_FILTERS[kind];
  const resolvedStatusFilters = ORDER_STATUS_FILTERS[kind];
  const [catalog, setCatalog] = useState(ORDER_CATALOG_ALL);
  const [status, setStatus] = useState(ORDER_STATUS_ALL);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [listSortValue, setListSortValue] = useState<string>();
  const { options: listSortOptions, loading: listSortLoading } =
    useOrderListSortOptions(showHeader);
  const listSortItem = useMemo(
    () => listSortOptions.find((opt) => opt.value === listSortValue)?.item,
    [listSortOptions, listSortValue],
  );
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const tableViewRef = useRef<OrderListTableViewHandle>(null);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachModalRow, setAttachModalRow] = useState<OrderRow | null>(null);

  // 选中处方后类别选项变少：若当前过滤值已不可选，回到「全部」
  useEffect(() => {
    if (
      catalog !== ORDER_CATALOG_ALL &&
      !resolvedCatalogFilters.some((item) => item.value === catalog)
    ) {
      setCatalog(ORDER_CATALOG_ALL);
    }
  }, [catalog, resolvedCatalogFilters]);

  // 长期 / 临时 / 出院带药的状态选项不同：若当前过滤值已不可选，回到「全部」
  useEffect(() => {
    if (
      status !== ORDER_STATUS_ALL &&
      !resolvedStatusFilters.some((item) => item.value === status)
    ) {
      setStatus(ORDER_STATUS_ALL);
    }
  }, [status, resolvedStatusFilters]);

  const {
    loading,
    rows,
    pageNo,
    pageSize,
    pageCount,
    loadOrders,
    handlePaginationChange,
    patchOrderRow,
    chargedOrderIds,
    temporaryExecutedOrderIds,
    dispensedOrderIds,
  } = useVisitOrderList({
    visitId,
    babyId,
    rxId,
    kind,
    catalog,
    status,
    searchKeyword,
    defaultPageSize,
    onCheckedOrderIdsChange,
    tableViewRef,
    link_name,
    link_value,
    excludeCatalogs,
    listSortItem,
    showDispenseStatus,
  });

  // 重载当前页，不滚动到最底部也不跳到最后一页
  const reloadCurrentPage = useCallback(
    (fromNewOrder?: boolean, override?: { page?: number; size?: number }) =>
      loadOrders(fromNewOrder, { page: pageNo, ...override }),
    [loadOrders, pageNo],
  );

  const {
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
  } = useOrderRowActions({
    loadOrders: reloadCurrentPage,
    selectedOrderId,
    onRowClick,
    onRowAction,
  });

  useImperativeHandle(ref, () => ({
    // 重新请求，根据外部是否是 新建 医嘱 来决定是否滚动到最底部并且跳到最后一页
    reload: async (fromNewOrder?: boolean) => {
      (await fromNewOrder) ? loadOrders(fromNewOrder) : reloadCurrentPage();
    },
    getCatalog: () => catalogRef.current,
  }));

  useEffect(() => {
    if (!onCheckedRowsChange || checkedOrderIds == null) return;
    onCheckedRowsChange(
      rows.filter(
        (r) => r.order_id != null && checkedOrderIds.includes(r.order_id),
      ),
    );
  }, [rows, checkedOrderIds, onCheckedRowsChange]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showHeader ? (
        <OrderListHeader
          catalogFilters={resolvedCatalogFilters}
          catalog={catalog}
          onCatalogChange={setCatalog}
          statusFilters={resolvedStatusFilters}
          status={status}
          onStatusChange={setStatus}
          searchKeyword={searchKeyword}
          onSearchKeywordChange={setSearchKeyword}
          onRefresh={() => void loadOrders()}
          refreshLoading={loading}
          sortOptions={listSortOptions}
          sortValue={listSortValue}
          sortLoading={listSortLoading}
          onSortChange={setListSortValue}
        />
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2">
        <OrderListTableView
          ref={tableViewRef}
          kind={kind}
          showDispenseStatus={showDispenseStatus}
          workType={workType}
          loading={loading}
          dataSource={rows}
          selectedOrderId={selectedOrderId}
          checkedOrderIds={checkedOrderIds}
          onCheckedOrderIdsChange={onCheckedOrderIdsChange}
          selectionType={selectionType}
          readOnly={readOnly}
          pageNo={pageNo}
          pageSize={pageSize}
          pageCount={pageCount}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
          onPaginationChange={handlePaginationChange}
          onRowAction={handleRowAction}
          actionLoading={actionLoading || rowActionLoading}
          onOpenAttachModal={(row) => {
            setAttachModalRow(row);
            setAttachModalOpen(true);
          }}
          chargedOrderIds={chargedOrderIds}
          temporaryExecutedOrderIds={temporaryExecutedOrderIds}
          dispensedOrderIds={dispensedOrderIds}
        />
      </div>
      <OrderAttachModal
        open={attachModalOpen}
        orderRow={attachModalRow}
        onCancel={() => {
          setAttachModalOpen(false);
          setAttachModalRow(null);
        }}
        onRowUpdated={patchOrderRow}
      />
      <OrderCheckModal
        open={qcOpen}
        confirmList={qcBundle?.confirmList ?? []}
        alertList={qcBundle?.alertList ?? []}
        confirmLoading={qcLoading}
        onCancel={cancelQc}
        onOk={(result) => void confirmQc(result)}
        onAuthRestrictedDrug={() => void refreshQc()}
      />
      <StopOrderModal
        open={stopOpen}
        confirmLoading={rowActionLoading}
        onCancel={cancelStop}
        onOk={(stopTime) => void confirmStop(stopTime)}
      />
    </div>
  );
}

export default OrderListTable;
