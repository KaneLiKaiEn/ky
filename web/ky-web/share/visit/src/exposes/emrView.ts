import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/EmrView/index");
export default mod.default;
export type * from "../pages/EmrView/index";
