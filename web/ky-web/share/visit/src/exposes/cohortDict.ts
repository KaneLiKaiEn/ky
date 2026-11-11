import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/CohortDict/index");
export default mod.default;
export type * from "../pages/CohortDict/index";
