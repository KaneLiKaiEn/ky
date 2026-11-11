import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/VisitInfo/index");
export default mod.default;
export type * from "../pages/VisitInfo/index";
