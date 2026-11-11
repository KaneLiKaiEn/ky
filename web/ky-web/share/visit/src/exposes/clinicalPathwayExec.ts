import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/ClinicalPathwayExec/index");
export default mod.default;
export type * from "../pages/ClinicalPathwayExec/index";
