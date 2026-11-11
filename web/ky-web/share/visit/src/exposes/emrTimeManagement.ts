import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/EmrTimeManagement/index");
export default mod.default;
export type * from "../pages/EmrTimeManagement/index";
