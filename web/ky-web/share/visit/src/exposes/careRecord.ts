import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/CareRecord/index");
export default mod.default;
export type * from "../pages/CareRecord/index";
