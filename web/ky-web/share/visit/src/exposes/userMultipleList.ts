import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/UserMultipleList/index");
export default mod.default;
export type * from "../pages/UserMultipleList/index";
