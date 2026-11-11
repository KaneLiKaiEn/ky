import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/OrderAttatch/index");
export default mod.default;
export const OrderAttatchToolbar = mod.OrderAttatchToolbar;
export const OrderAttatchContent = mod.OrderAttatchContent;
export type * from "../pages/OrderAttatch/index";
