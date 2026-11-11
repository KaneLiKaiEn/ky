import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/ReadCardHeader/index");
export default mod.default;
export type * from "../pages/ReadCardHeader/index";
