import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/EmrPreview/index");
export default mod.default;
export type * from "../pages/EmrPreview/index";
