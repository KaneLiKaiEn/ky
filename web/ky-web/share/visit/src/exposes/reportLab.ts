import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/ReportLab/index");
export default mod.default;
export type * from "../pages/ReportLab/index";
