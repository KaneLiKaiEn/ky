import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/Diagnosis/index");
export default mod.default;
export type * from "../pages/Diagnosis/index";
