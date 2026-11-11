import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/InsurancePanel/index");

export default mod.default;
export const InsurancePanel = mod.InsurancePanel;
export type * from "../pages/InsurancePanel/index";
