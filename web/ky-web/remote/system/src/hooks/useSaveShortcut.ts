import { useEffect, useRef } from "react";

/** Only the mounted editor registers a shortcut. Confirmation dialogs suspend it. */
export function useSaveShortcut(callback: () => void, enabled: boolean) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    if (!enabled) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey && event.key === "Enter" && !event.isComposing) {
        if (document.querySelector(".ant-modal-confirm")) return;
        event.preventDefault();
        callbackRef.current();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enabled]);
}
