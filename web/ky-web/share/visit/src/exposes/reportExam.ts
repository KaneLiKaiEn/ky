import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/ReportExam/index");
export default mod.default;
export type * from "../pages/ReportExam/index";
