import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/OrderListTable/index");

export default mod.default;
export const ORDER_CATALOG_ALL = mod.ORDER_CATALOG_ALL;
export const ORDER_CATALOG_FILTERS = mod.ORDER_CATALOG_FILTERS;
export const ORDER_TYPE_BY_KIND = mod.ORDER_TYPE_BY_KIND;
export const toOrderCatalogParam = mod.toOrderCatalogParam;
export const canCancelOrder = mod.canCancelOrder;
export const canCommitOrder = mod.canCommitOrder;
export const canDeleteOrder = mod.canDeleteOrder;
export const canEditOrder = mod.canEditOrder;
export const canStopOrder = mod.canStopOrder;
export const canUndoCommitOrder = mod.canUndoCommitOrder;
export const canUndoStopOrder = mod.canUndoStopOrder;
export const isCommittedStatus = mod.isCommittedStatus;
export const isDraftStatus = mod.isDraftStatus;
export const isOrderedStatus = mod.isOrderedStatus;
export const isTerminalStatus = mod.isTerminalStatus;
export const normalizeOrderStatus = mod.normalizeOrderStatus;
export const orderStatusLabel = mod.orderStatusLabel;
export const orderStatusTagColor = mod.orderStatusTagColor;
// 注意：这里要写明暴露的方法
export const buildTemporaryCatalogFilters = mod.buildTemporaryCatalogFilters;
export type * from "../pages/OrderListTable/index";