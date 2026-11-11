import { useSyncExternalStore } from "react";

const query = "(prefers-color-scheme: dark)";
const read = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query).matches
    : false;
const serverSnapshot = () => false;
const noopSubscribe = () => () => {};
const subscribe = (onChange: () => void) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return () => {};
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/** Only the system-mode owner (or a legacy consumer without a provider) subscribes. */
export function useSystemDarkMode(enabled: boolean): boolean {
  return useSyncExternalStore(
    enabled ? subscribe : noopSubscribe,
    enabled ? read : serverSnapshot,
    serverSnapshot,
  );
}

/** Compatibility API: the operating system preference, independent of local scopes. */
export const usePrefersDarkMode = (): boolean => useSystemDarkMode(true);
