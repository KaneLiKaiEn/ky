import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/LinkBill/index");
export default mod.default;
export type * from "../pages/LinkBill/index";
