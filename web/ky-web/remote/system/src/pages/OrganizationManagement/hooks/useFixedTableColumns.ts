import { Grid } from "antd";

/** Narrow screens need the full scrollable width for each editable column. */
export function useFixedTableColumns() {
  return Boolean(Grid.useBreakpoint().md);
}
