import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/CustomForm/index");
export default mod.default;
export type * from "../pages/CustomForm/index";
