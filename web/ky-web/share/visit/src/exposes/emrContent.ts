import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/EmrContent/index");
export default mod.default;
export type * from "../pages/EmrContent/index";
