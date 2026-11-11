import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/VisitItem/index");
export default mod.default;
export type * from "../pages/VisitItem/index";
