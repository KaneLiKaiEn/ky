import "@/index.css";
import { preloadRemotes } from "../preloadRemotes";

await preloadRemotes();
const mod = await import("../pages/userHome");

export default mod.default;
