import { preloadRemotes } from "../preloadRemotes";
await preloadRemotes();
const mod = await import("../pages/GuaranteeList/index");
export default mod.default;
export const GuaranteeList = mod.GuaranteeList;
export type * from "../pages/GuaranteeList/index";