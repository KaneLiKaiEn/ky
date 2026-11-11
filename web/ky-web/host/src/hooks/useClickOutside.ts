import { useEffect, type RefObject } from "react";

type AnyRef = RefObject<HTMLElement | null>;

/**
 * 监听 pointerdown，当点击发生在所有给定 ref 元素之外时触发 handler。
 * enabled=false 时不绑定监听，避免无谓开销。
 */
export const useClickOutside = (
  refs: AnyRef | AnyRef[],
  handler: (event: PointerEvent) => void,
  enabled: boolean = true,
): void => {
  useEffect(() => {
    if (!enabled) return;
    const refList = Array.isArray(refs) ? refs : [refs];

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      for (const ref of refList) {
        if (ref.current && ref.current.contains(target)) {
          return;
        }
      }
      handler(event);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [enabled, handler, refs]);
};
