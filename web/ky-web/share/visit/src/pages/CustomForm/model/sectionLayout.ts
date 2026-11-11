import type { ColProps } from "antd";

const COL_BREAKPOINTS = ["xs", "sm", "md", "lg", "xl", "xxl"] as const;
type ColBreakpoint = (typeof COL_BREAKPOINTS)[number];
const COL_BREAKPOINT_SET = new Set<string>(COL_BREAKPOINTS);

export const parseElemWidth = (elem_width?: string): ColProps => {
  if (!elem_width) return { span: 24 };
  const colProps: ColProps = {};
  const regex = /ex-col(?:-([a-z]+))?-(\d+)/g;
  for (const match of elem_width.matchAll(regex)) {
    const [, breakpoint, sizeStr] = match;
    const size = Number(sizeStr);
    if (Number.isNaN(size)) continue;
    if (!breakpoint) {
      colProps.span = size;
    } else if (COL_BREAKPOINT_SET.has(breakpoint)) {
      colProps[breakpoint as ColBreakpoint] = size;
    }
  }
  if (colProps.span == null && colProps.xs == null) colProps.span = 24;
  return colProps;
};

export const parseColumnWidth = (column_width?: string): number[] => {
  if (!column_width?.trim()) return [];
  return column_width.trim().split(/\s+/).map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
};

export const getColProps = (
  index: number,
  columnSpans: number[],
  elem_width?: string,
): ColProps => columnSpans.length > 0
  ? { span: Math.min(24, Math.max(1, columnSpans[index % columnSpans.length] * 2)) }
  : parseElemWidth(elem_width);
