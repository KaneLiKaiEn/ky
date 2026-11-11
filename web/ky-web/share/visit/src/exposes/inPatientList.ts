import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/InPatientList/index");
export default mod.default;
export type * from "../pages/InPatientList/index";
