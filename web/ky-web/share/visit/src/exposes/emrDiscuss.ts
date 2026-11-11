import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/EmrDiscuss/index");
export default mod.default;
export type * from "../pages/EmrDiscuss/index";
