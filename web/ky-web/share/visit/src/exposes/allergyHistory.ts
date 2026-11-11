import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/AllergyHistory/index");

export default mod.default;
export const AllergyHistory = mod.AllergyHistory;
export type * from "../pages/AllergyHistory/index";
