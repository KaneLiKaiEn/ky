import { RefObject, useLayoutEffect, useRef, useState } from "react";
import { getElOffset } from "./offset";

export interface AutoHeightProps {
  toBottom: number;
  defaultHeight?: number;
}

type RefEle = { nativeElement: HTMLDivElement };

type ContainerRefType = RefObject<HTMLElement | null | undefined | RefEle>;

const resolveEle = (
  container: HTMLElement | RefEle | null | undefined,
): HTMLElement | null => {
  if (!container) return null;
  if ((container as RefEle).nativeElement) {
    return (container as RefEle).nativeElement;
  }
  return container as HTMLElement;
};

/**
 * 计算容器顶边到窗口底部的可用高度，供 Table scroll.y 使用
 */
export const useAutoHeight = (
  containerRef: ContainerRefType,
  { toBottom, defaultHeight }: AutoHeightProps = {
    toBottom: 60,
  },
) => {
  const [clientHeight, setClientHeight] = useState<number | undefined>(
    defaultHeight,
  );
  const timerRef = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const calcHeight = () => {
      const containerEle = resolveEle(containerRef.current);
      if (!containerEle) {
        setClientHeight(undefined);
        return;
      }

      const offset = getElOffset(containerEle);
      if (offset.top === 0) return;

      const next = Math.max(0, offset.bottomToVisibleWindow - toBottom);
      setClientHeight(next);
    };

    const runCalcHeight = () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(calcHeight, 200);
    };

    const containerEle = resolveEle(containerRef.current);
    if (!containerEle) return;

    const resizeObserver = new ResizeObserver(runCalcHeight);
    resizeObserver.observe(containerEle);

    const parent = containerEle.parentElement;
    if (parent) resizeObserver.observe(parent);
    const splitter = containerEle.closest(".ant-splitter");
    if (splitter) resizeObserver.observe(splitter);

    window.addEventListener("resize", runCalcHeight);
    runCalcHeight();

    return () => {
      window.clearTimeout(timerRef.current);
      window.removeEventListener("resize", runCalcHeight);
      resizeObserver.disconnect();
    };
  }, [containerRef, toBottom]);

  return { clientHeight };
};
