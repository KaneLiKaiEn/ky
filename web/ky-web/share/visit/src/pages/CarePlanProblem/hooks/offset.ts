export interface ElOffset {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  rightToVisibleWindow: number;
  bottomToVisibleWindow: number;
}

export function getElOffset(element: Element): ElOffset {
  const rect = element.getBoundingClientRect();

  const doc = document.documentElement;
  const clientWidth = doc.clientWidth;
  const clientHeight = doc.clientHeight;

  return {
    left: rect.left,
    top: rect.top,
    right: clientWidth - rect.right,
    bottom: clientHeight - rect.bottom,
    width: rect.width,
    height: rect.height,
    rightToVisibleWindow: clientWidth - rect.left,
    bottomToVisibleWindow: clientHeight - rect.top,
  };
}
