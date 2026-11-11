import { Progress, Table } from "antd";
import { useId, useMemo } from "react";
import type { ColumnsType } from "antd/es/table";
import type {
  BoardComponentColRow,
  BoardComponentColThresholdRow,
} from "../../../types/board.d.ts";
import type { ArgValueRow } from "../../../types/references.d.ts";
import {
  colorScale,
  displayValue,
  hasTag,
  mergeArguments,
  positiveId,
  thresholdClass,
  type DataRow,
} from "../model";
import type { BoardActions } from "./ChartFrame";
export default function DataTable({
  rows,
  columns,
  thresholds,
  actions,
  componentId,
  args,
  style,
}: {
  rows: DataRow[];
  columns: BoardComponentColRow[];
  thresholds: Record<string, BoardComponentColThresholdRow[]>;
  actions: BoardActions;
  componentId: number;
  args: ArgValueRow[];
  style?: string;
}) {
  const scope = useId();
  const tableRows = useMemo(
    () => rows.map((row, index) => ({ ...row, __previewKey: String(index) })),
    [rows],
  );
  const click = (col: BoardComponentColRow, value: unknown) => {
    if (!col.col_code) return;
    if (col.link_name === "BOARD" && positiveId(col.link_value))
      actions.openBoard(
        Number(col.link_value),
        mergeArguments(args, [
          { arg_code: col.col_code, arg_value: displayValue(value) },
        ]),
      );
    if (col.link_name === "CASCADE")
      actions.cascade(
        col.col_code,
        displayValue(value),
        componentId,
        positiveId(col.link_value),
      );
  };
  const tableColumns: ColumnsType<DataRow> = columns
    .filter((col) => col.col_code)
    .map((col) => {
      const code = col.col_code!;
      return {
        key: code,
        dataIndex: code,
        title: col.col_name || code,
        width: Number(col.col_width) > 0 ? Number(col.col_width) : undefined,
        align: ["left", "right", "center"].includes(col.col_align ?? "")
          ? (col.col_align as "left" | "right" | "center")
          : undefined,
        sorter: (a, b) =>
          typeof a[code] === "number" && typeof b[code] === "number"
            ? Number(a[code]) - Number(b[code])
            : displayValue(a[code]).localeCompare(
                displayValue(b[code]),
                "zh-CN",
                { numeric: true },
              ),
        onCell: (row) => ({
          className: thresholdClass(thresholds[code] ?? [], row[code]),
          style: {
            background: hasTag(col.col_tag, "底色板")
              ? colorScale(col, row[code])?.background
              : undefined,
            color: hasTag(col.col_tag, "底色板")
              ? colorScale(col, row[code])?.color
              : undefined,
            cursor: ["BOARD", "CASCADE"].includes(col.link_name ?? "")
              ? "pointer"
              : undefined,
          },
          onClick: () => click(col, row[code]),
        }),
        render: (value) => {
          const scale = colorScale(col, value);
          return hasTag(col.col_tag, "进度条") && scale ? (
            <Progress
              percent={scale.percent}
              strokeColor={scale.background}
              format={() => displayValue(value)}
              size="small"
            />
          ) : (
            displayValue(value)
          );
        },
      };
    });
  return (
    <div className="bp-table-surface" data-preview-table={scope}>
      {style && (
        <style>{`@scope ([data-preview-table="${scope}"]) { ${style} }`}</style>
      )}
      <Table
        rowKey="__previewKey"
        columns={tableColumns}
        dataSource={tableRows}
        size="small"
        bordered
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "暂无数据" }}
      />
    </div>
  );
}
