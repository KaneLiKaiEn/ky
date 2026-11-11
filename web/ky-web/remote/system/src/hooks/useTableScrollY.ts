import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * 根据容器高度计算 antd Table 的 scroll.y。
 * 将返回的 ref 挂在表格外层容器上；offset 为表头、分页等占用高度。
 */
export function useTableScrollY<T extends HTMLElement = HTMLDivElement>(
  offset = 40,
) {
  const [height, setHeight] = useState<number>();
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node) return;
      const update = () => setHeight(Math.max(node.clientHeight - offset, 120));
      update();
      observerRef.current = new ResizeObserver(update);
      observerRef.current.observe(node);
    },
    [offset],
  );

  useLayoutEffect(
    () => () => {
      observerRef.current?.disconnect();
    },
    [],
  );

  return { ref, scrollY: height };
}
