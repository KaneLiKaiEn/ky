import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/PrintList/index");

export default mod.default;
export const print = mod.print;
export const printPreview = mod.printPreview;
export type * from "../pages/PrintList/index";
