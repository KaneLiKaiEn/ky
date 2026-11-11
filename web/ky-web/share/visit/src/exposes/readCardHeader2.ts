import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/ReadCardHeader2/index");
export default mod.default;
export type * from "../pages/ReadCardHeader2/index";
