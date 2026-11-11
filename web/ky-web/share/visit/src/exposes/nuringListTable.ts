import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/NuringListTable/index");
export default mod.default;
export type * from "../pages/NuringListTable/index";
