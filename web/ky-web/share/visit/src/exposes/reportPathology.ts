import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/ReportPathology/index");
export default mod.default;
export type * from "../pages/ReportPathology/index";
