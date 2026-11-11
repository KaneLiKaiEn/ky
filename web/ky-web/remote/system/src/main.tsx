import { preloadRemotes } from "./preloadRemotes";

async function start() {
  try {
    await preloadRemotes();
  } catch (err) {
    console.error("[preload remotes] failed:", err);
  }
  await import("@/bootstrap");
}

start();
