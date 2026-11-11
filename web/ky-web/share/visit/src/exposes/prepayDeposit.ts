import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/PrepayDeposit/index");

export default mod.default;
export const PrepayPayDialog = mod.PrepayPayDialog;
export const PrepayRechargePanel = mod.PrepayRechargePanel;
export const PrepayTypeBalanceBar = mod.PrepayTypeBalanceBar;
export const PrepayRefundModal = mod.PrepayRefundModal;
export const usePrepayAccount = mod.usePrepayAccount;
export const usePrepayDealers = mod.usePrepayDealers;
export const usePrepayRecharge = mod.usePrepayRecharge;
export const usePrepayTypeState = mod.usePrepayTypeState;
export const useSessionInfo = mod.useSessionInfo;
export const formatAmount = mod.formatAmount;
export const PREPAY_TYPE_OPTIONS = mod.PREPAY_TYPE_OPTIONS;
export type * from "../pages/PrepayDeposit/index";
