import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { App } from "antd";
import debounce from "lodash/debounce";
import { getImplementList2API } from "@/api/orderexe";
import type { Implement2Row } from "@/types/orderexe";
import { getVisitOrderListAPI } from "@/api/ordent";
import type { OrderRow } from "@/types/ordent";
import {
  ORDER_TYPE_BY_KIND,
  toOrderCatalogParam,
  type OrderWorkspaceKind,
} from "./orderCatalogFilters";
import { loadDispensedOrderIds } from "./dischargeDispenseStatus";
import { isImplementExecuted } from "./orderStatus";
import {
  buildVisitOrderListSortExtras,
  matchOrderListStatusFilter,
} from "./orderListSortFilter";
import { toOrderStatusParam } from "./orderStatusFilters";
import type { OrderListTableViewHandle } from "./types";
import type { Dict2ItemRow } from "@/types/sys";

const DEFAULT_PAGE_SIZE = import.meta.env.PROD ? 100 : 100;
const SEARCH_DEBOUNCE_MS = 300;

/** 执行单关联医嘱：优先 order_id_list（如 lab 的 [1][2]），否则 order_id */
function orderIdsFromImplementRow(row: Implement2Row): number[] {
  const listStr = row.order_id_list?.trim();
  if (listStr) {
    const ids: number[] = [];
    for (const match of listStr.matchAll(/\[(\d+)\]/g)) {
      const id = Number(match[1]);
      if (Number.isFinite(id)) ids.push(id);
    }
    if (ids.length > 0) return ids;
  }
  const orderId = row.order_id;
  return orderId != null ? [orderId] : [];
}

export interface UseVisitOrderListOptions {
  visitId?: number;
  babyId?: number;
  rxId?: number;
  kind: OrderWorkspaceKind;
  catalog: string;
  status: string;
  searchKeyword: string;
  defaultPageSize?: number;
  onCheckedOrderIdsChange?: (ids: number[]) => void;
  tableViewRef?: RefObject<OrderListTableViewHandle | null>;
  link_name?: string;
  link_value?: number;
  excludeCatalogs?: readonly string[];
  listSortItem?: Dict2ItemRow | null;
  /** 出院带药是否查询摆药状态，默认不请求 */
  showDispenseStatus?: boolean;
}

export function useVisitOrderList({
  visitId,
  babyId,
  rxId,
  kind,
  catalog,
  status,
  searchKeyword,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  onCheckedOrderIdsChange,
  tableViewRef,
  link_name,
  link_value,
  excludeCatalogs,
  listSortItem,
  showDispenseStatus = false,
}: UseVisitOrderListOptions) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageCount, setPageCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(searchKeyword);
  /** 临时医嘱：执行单已计费（charge_time 有值）的 order_id */
  const [chargedOrderIds, setChargedOrderIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  /** 临时医嘱：执行单 implement_status 含 EXEC 的 order_id */
  const [temporaryExecutedOrderIds, setTemporaryExecutedOrderIds] = useState<
    ReadonlySet<number>
  >(() => new Set());
  /** 出院带药：摆药单 apply_status 为 DELIVERY 的 order_id */
  const [dispensedOrderIds, setDispensedOrderIds] = useState<
    ReadonlySet<number>
  >(() => new Set());

  const pageSizeRef = useRef(pageSize);
  const onCheckedChangeRef = useRef(onCheckedOrderIdsChange);
  pageSizeRef.current = pageSize;
  onCheckedChangeRef.current = onCheckedOrderIdsChange;

  const applyDebouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, SEARCH_DEBOUNCE_MS),
    [],
  );

  useEffect(
    () => () => {
      applyDebouncedSearch.cancel();
    },
    [applyDebouncedSearch],
  );

  useEffect(() => {
    const trimmed = searchKeyword.trim();
    if (!trimmed) {
      applyDebouncedSearch.cancel();
      setDebouncedSearch("");
      return;
    }
    applyDebouncedSearch(trimmed);
  }, [searchKeyword, applyDebouncedSearch]);

  const loadOrders = useCallback(
    async (
      fromNewOrder?: boolean,
      override?: { page?: number; size?: number },
    ): Promise<OrderRow[]> => {
      if (visitId == null) {
        setRows([]);
        setPageCount(0);
        setPageNo(1);
        setChargedOrderIds(new Set());
        setTemporaryExecutedOrderIds(new Set());
        setDispensedOrderIds(new Set());
        return [];
      }

      const targetSize = override?.size ?? pageSizeRef.current;

      setLoading(true);
      try {
        const orderCatalog = toOrderCatalogParam(catalog);
        const sortExtras = buildVisitOrderListSortExtras(status, listSortItem);
        const orderStatus =
          sortExtras.order_status ?? toOrderStatusParam(status);
        const orderName = debouncedSearch || undefined;

        const baseParams = {
          visit_id: visitId,
          order_type: ORDER_TYPE_BY_KIND[kind],
          page_size: targetSize,
          ...(babyId != null ? { baby_id: babyId } : {}),
          ...(rxId != null ? { rx_id: rxId } : {}),
          ...(orderCatalog ? { order_catalog: orderCatalog } : {}),
          ...(orderStatus ? { order_status: orderStatus } : {}),
          ...(orderName ? { order_name: orderName } : {}),
          ...(link_name ? { link_name } : {}),
          ...(link_value != null ? { link_value } : {}),
          ...(sortExtras.order_start
            ? { order_start: sortExtras.order_start }
            : {}),
          ...(sortExtras.order_end ? { order_end: sortExtras.order_end } : {}),
          ...(sortExtras.stop_start
            ? { stop_start: sortExtras.stop_start }
            : {}),
          ...(sortExtras.stop_end ? { stop_end: sortExtras.stop_end } : {}),
        };

        const countRes = await getVisitOrderListAPI({
          ...baseParams,
          page_no: 0,
        });
        if (countRes.code !== 0) {
          message.error(
            countRes.message || countRes.hint || "获取医嘱列表失败",
          );
          setRows([]);
          setPageCount(0);
          setChargedOrderIds(new Set());
          setTemporaryExecutedOrderIds(new Set());
          setDispensedOrderIds(new Set());
          return [];
        }

        const totalPages = countRes.page_count ?? 0;
        if (totalPages <= 0) {
          setRows([]);
          setPageCount(0);
          setPageNo(1);
          setPageSize(targetSize);
          setChargedOrderIds(new Set());
          setTemporaryExecutedOrderIds(new Set());
          setDispensedOrderIds(new Set());
          return [];
        }

        // 未指定页码时落到最后一页，便于直接看到最新医嘱；分页器点选仍走指定页
        const safePage =
          override?.page != null
            ? Math.min(Math.max(override.page, 1), totalPages)
            : totalPages;
        const res = await getVisitOrderListAPI({
          ...baseParams,
          page_no: safePage,
        });
        if (res.code !== 0) {
          message.error(res.message || res.hint || "获取医嘱列表失败");
          setRows([]);
          setPageCount(0);
          setChargedOrderIds(new Set());
          setTemporaryExecutedOrderIds(new Set());
          setDispensedOrderIds(new Set());
          return [];
        }

        const excluded = excludeCatalogs?.length
          ? new Set(excludeCatalogs)
          : null;
        const nextRows = (res.row_list ?? []).filter((row) => {
          if (!matchOrderListStatusFilter(row, status, listSortItem)) {
            return false;
          }
          if (excluded && excluded.has(row.order_catalog ?? "")) return false;
          return true;
        });

        let nextChargedOrderIds = new Set<number>();
        let nextTemporaryExecutedOrderIds = new Set<number>();
        if (kind === "temporary") {
          try {
            const implRes = await getImplementList2API({
              visit_id_list: [visitId],
              order_type: `[${ORDER_TYPE_BY_KIND.temporary}]`,
              // implement_type 必传
              implement_type: "[exam][lab][pathology][treat][medicate][other]",
            });
            if (implRes.code === 0) {
              for (const implRow of implRes.row_list ?? []) {
                const orderIds = orderIdsFromImplementRow(implRow);
                if (orderIds.length === 0) continue;
                const chargeTime = implRow.charge_time?.trim();
                const executed = isImplementExecuted(implRow.implement_status);
                for (const orderId of orderIds) {
                  if (chargeTime) {
                    nextChargedOrderIds.add(orderId);
                  }
                  if (executed) {
                    nextTemporaryExecutedOrderIds.add(orderId);
                  }
                }
              }
            }
          } catch (error) {
            console.error("获取执行单列表失败:", error);
          }
        }
        setChargedOrderIds(nextChargedOrderIds);
        setTemporaryExecutedOrderIds(nextTemporaryExecutedOrderIds);

        let nextDispensedOrderIds = new Set<number>();
        if (showDispenseStatus && kind === "discharge") {
          try {
            nextDispensedOrderIds = await loadDispensedOrderIds(
              visitId,
              nextRows,
            );
          } catch (error) {
            console.error("获取摆药状态失败:", error);
          }
        }
        setDispensedOrderIds(nextDispensedOrderIds);
        setRows(nextRows);
        setPageCount(totalPages);
        setPageNo(safePage);
        setPageSize(targetSize);
        return nextRows;
      } catch (error) {
        console.error("获取医嘱列表失败:", error);
        message.error("获取医嘱列表失败");
        setRows([]);
        setPageCount(0);
        setChargedOrderIds(new Set());
        setTemporaryExecutedOrderIds(new Set());
        setDispensedOrderIds(new Set());
        return [];
      } finally {
        setLoading(false);

        // 如果是通过 新建 医嘱调用的 loadOrders ， 则滚动到最底部
        if (fromNewOrder) {
          tableViewRef?.current?.scrollTableToBottom();
        }
      }
    },
    [
      visitId,
      babyId,
      rxId,
      kind,
      catalog,
      status,
      debouncedSearch,
      message,
      link_name,
      link_value,
      excludeCatalogs,
      listSortItem,
      showDispenseStatus,
    ],
  );

  useEffect(() => {
    onCheckedChangeRef.current?.([]);
    // 首次加载时，滚动到最底部
    void loadOrders(true);
  }, [loadOrders]);

  const handlePaginationChange = useCallback(
    (page: number, size: number) => {
      // 分页器点选时，也要滚动到 最底部 ， 但是跳到的是指定页
      void loadOrders(true, { page, size });
    },
    [loadOrders],
  );

  const patchOrderRow = useCallback(
    (orderId: number, patch: Partial<OrderRow>) => {
      setRows((prev) =>
        prev.map((row) =>
          row.order_id === orderId ? { ...row, ...patch } : row,
        ),
      );
    },
    [],
  );

  return {
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
  };
}
