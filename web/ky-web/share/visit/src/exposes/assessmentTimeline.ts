import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/AssessmentTimeline/index");
export default mod.default;
export type * from "../pages/AssessmentTimeline/index";
