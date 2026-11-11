import type { Ref } from "react";
import type { TableRowSelection } from "antd/es/table/interface";
import type { OrderRow } from "@/types/ordent";
import type { OrderWorkspaceKind } from "./orderCatalogFilters";

export type OrderWorkType = "DOCTOR" | "NURSE";

export type OrderRowAction =
  | "commit"
  | "undoCommit"
  | "delete"
  | "cancel"
  | "stop"
  | "undoStop"
  | "verify"
  | "return"
  | "undoVerify"
  | "exec"
  | "end"
  | "terminate";

export interface OrderListTableHandle {
  reload: (fromNewOrder?: boolean) => Promise<void>;
  /** 当前类别过滤值，供外部 catalog 回退 */
  getCatalog: () => string;
}

export interface OrderListTableViewHandle {
  scrollTableToBottom: () => void;
}

export interface OrderListTableProps {
  visitId?: number;
  /** 传给 GetVisitOrderList；undefined 时不带该字段 */
  babyId?: number;
  /** 传给 GetVisitOrderList；undefined 时不带该字段 */
  rxId?: number;
  /**
   * 覆盖默认类别 Segmented 选项。
   * 临时医嘱选中处方时传入过滤后的列表，未传则仍用 ORDER_CATALOG_FILTERS[kind]。
   */
  catalogFilters?: { label: string; value: string }[];
  /** 传给 GetVisitOrderList；未传则不带 */
  link_name?: string;
  link_value?: number;
  /**
   * 列表返回后按 order_catalog 排除。
   * 手术用药「全部」时会查出手术申请嘱托，需前端去掉。
   */
  excludeCatalogs?: readonly string[];
  kind: OrderWorkspaceKind;
  /**
   * 出院带药是否展示摆药列，并请求摆药明细 / 摆药单属性。
   * 默认关闭。
   */
  showDispenseStatus?: boolean;
  /** 操作列角色；默认 DOCTOR（提交 / 取消提交 / 撤销停止） */
  workType?: OrderWorkType;
  /** 是否展示头部过滤（类别 / 状态 / 搜索），默认 true */
  showHeader?: boolean;
  /** true 时不展示操作列 */
  readOnly?: boolean;
  /**
   * 行选择类型，对应 antd Table rowSelection.type。
   * 默认 radio（单选）；医生站工作台传 checkbox（多选）。
   */
  selectionType?: TableRowSelection<OrderRow>["type"];
  /** 无勾选列时用于行高亮；有勾选时高亮跟 checkedOrderIds 走 */
  selectedOrderId?: number | null;
  checkedOrderIds?: number[];
  onCheckedOrderIdsChange?: (ids: number[]) => void;
  /** 勾选变化时回传完整行，供 Card.extra 批量按钮使用 */
  onCheckedRowsChange?: (rows: OrderRow[]) => void;
  /** 单击行；组件内会同步勾选（radio 切到该行，checkbox 加入勾选） */
  onRowClick?: (row: OrderRow) => void;
  /** 双击行（医生站：进入编辑） */
  onRowDoubleClick?: (row: OrderRow) => void;
  /** 行操作成功后的回调；提交 / 校对等接口由表格内部调用 */
  onRowAction?: (action: OrderRowAction, row: OrderRow) => void;
  actionLoading?: boolean;
  defaultPageSize?: number;
  ref?: Ref<OrderListTableHandle>;
}

export type { OrderWorkspaceKind };
