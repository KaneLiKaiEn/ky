import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/PrepayList/index");

export default mod.default;
export const PrepayList = mod.PrepayList;
export const PrepayHistoryTable = mod.PrepayHistoryTable;
export const PrepayDeleteModal = mod.PrepayDeleteModal;
export const PrepayRefundRowModal = mod.PrepayRefundRowModal;
export const PrepayRestartPayModal = mod.PrepayRestartPayModal;
export const PrepayListTypeBar = mod.PrepayListTypeBar;
export const PrepayPrintDropdown = mod.PrepayPrintDropdown;
export const usePrepayList = mod.usePrepayList;
export type * from "../pages/PrepayList/index";
