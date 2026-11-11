import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/BatchEvaluate/index");
export default mod.default;
export const FormView = mod.FormView;
export type * from "../pages/BatchEvaluate/index";
