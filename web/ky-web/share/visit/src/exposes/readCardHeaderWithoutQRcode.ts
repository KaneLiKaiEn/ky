import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/ReadCardHeaderWithoutQRcode/index");
export default mod.default;
export type * from "../pages/ReadCardHeaderWithoutQRcode/index";
