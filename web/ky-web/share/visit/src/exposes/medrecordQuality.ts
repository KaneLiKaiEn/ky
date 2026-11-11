import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/MedrecordQuality/index");
export default mod.default;
export type * from "../pages/MedrecordQuality/index";
