import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/CarePlanProblem/index");
export default mod.default;
export type * from "../pages/CarePlanProblem/index";
