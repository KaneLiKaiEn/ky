import type { ColumnGroupType, ColumnType, ColumnsType } from "antd/es/table";
import type { ResizableHeaderCellProps } from "./ResizableHeaderCell";

const isColumnGroup = <T extends object>(
  col: ColumnGroupType<T> | ColumnType<T>,
): col is ColumnGroupType<T> =>
  "children" in col && Array.isArray(col.children) && col.children.length > 0;

const DEFAULT_COLUMN_WIDTH = 120;

// 这里配置的是默认列宽，也可以通过在 Table 的columns 中配置 width 属性来设置默认列宽
const DEFAULT_WIDTH_BY_KEY: Record<string, number> = {
  index: 64,
  order_time: 140,
  stop_time: 140,
  verify_time: 140,
  exec_time: 140,
  order_content_fmt: 240,
  order_usage_fmt: 200,
  exec_dept_name: 120,
  order_user_name: 96,
  verify_user: 96,
  stop_user: 96,
  end_user: 96,
  exec_user: 96,
  order_status: 88,
  dispense_status: 80,
};

const resolveColumnKey = (col: ColumnType<unknown>): string | undefined => {
  const key = col.key ?? col.dataIndex;
  if (key == null || key === "") return undefined;
  return String(key);
};

const resolveBaseWidth = (col: ColumnType<unknown>, colKey: string): number => {
  if (typeof col.width === "number") return col.width;
  return DEFAULT_WIDTH_BY_KEY[colKey] ?? DEFAULT_COLUMN_WIDTH;
};

export const withResizableColumns = <T extends object>(
  columns: ColumnsType<T>,
  columnWidths: Record<string, number>,
  onWidthChange: (colKey: string, width: number) => void,
): ColumnsType<T> =>
  columns.map((col) => {
    if (isColumnGroup(col)) {
      return {
        ...col,
        children: withResizableColumns(
          col.children,
          columnWidths,
          onWidthChange,
        ),
      };
    }

    if (col.fixed === "right") {
      return col;
    }

    const colKey = resolveColumnKey(col as ColumnType<unknown>);
    if (!colKey) {
      return col;
    }

    const width =
      columnWidths[colKey] ??
      resolveBaseWidth(col as ColumnType<unknown>, colKey);
    const prevOnHeaderCell = col.onHeaderCell;

    return {
      ...col,
      width,
      onHeaderCell: (column) => {
        const prev =
          typeof prevOnHeaderCell === "function"
            ? prevOnHeaderCell(column)
            : (prevOnHeaderCell ?? {});
        return {
          ...prev,
          width,
          onColumnResize: (nextWidth: number) =>
            onWidthChange(colKey, nextWidth),
        } as ResizableHeaderCellProps;
      },
    };
  });
