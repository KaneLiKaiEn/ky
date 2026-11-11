import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/DiagTcm/index");
export default mod.default;
export type * from "../pages/DiagTcm/index";
