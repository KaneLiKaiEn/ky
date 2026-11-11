import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/TemperatureSheet/index");
export default mod.default;
export type * from "../pages/TemperatureSheet/index";
