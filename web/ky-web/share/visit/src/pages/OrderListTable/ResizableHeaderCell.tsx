import type { HTMLAttributes } from "react";

export interface ResizableHeaderCellProps
  extends HTMLAttributes<HTMLTableCellElement> {
  width?: number;
  onColumnResize?: (width: number) => void;
}

const ResizableHeaderCell = ({
  width,
  onColumnResize,
  children,
  ...restProps
}: ResizableHeaderCellProps) => {
  const startResize = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!width || !onColumnResize) return;
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = width;
    const handlePointerMove = (moveEvent: PointerEvent) => {
      onColumnResize(Math.max(50, startWidth + moveEvent.clientX - startX));
    };
    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const { className, ...thProps } = restProps;

  return (
    <th
      {...thProps}
      className={[className, "relative"].filter(Boolean).join(" ")}
    >
      {children}
      {width && onColumnResize ? (
        <span
          className="absolute top-0 -right-[3px] z-10 h-full w-1.5 cursor-col-resize select-none touch-none hover:border-r-2 hover:border-[#1677ff]"
          onPointerDown={startResize}
          onClick={(event) => event.stopPropagation()}
        />
      ) : null}
    </th>
  );
};

export default ResizableHeaderCell;
