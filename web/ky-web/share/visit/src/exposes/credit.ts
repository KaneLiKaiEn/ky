import { preloadRemotes } from "../preloadRemotes";
await preloadRemotes();
const mod = await import("../pages/Credit/index");
export default mod.default;
export const Credit = mod.Credit;