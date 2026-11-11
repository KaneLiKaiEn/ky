import { DeleteOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import type { CellValue, NursingRow } from "../types";

interface EmrMatrixCellProps {
  row: NursingRow;
  time: string;
  value?: CellValue;
  onOpen: (row: NursingRow, time: string, value?: CellValue) => void;
  onDelete?: (row: NursingRow, time: string) => void;
}

export default function EmrMatrixCell({
  row,
  time,
  value,
  onOpen,
  onDelete,
}: EmrMatrixCellProps) {
  const score = value && !Array.isArray(value[1]) ? String(value[1] ?? "") : "";
  const result = value && value.length > 2 ? String(value[2] ?? "") : "";
  const displayText = value?.[0] ? score || result || "已填" : "";

  return (
    <div
      className="group relative min-h-6 cursor-pointer px-1 text-center"
      onDoubleClick={() => onOpen(row, time, value)}
    >
      {displayText}
      {displayText ? (
        <span
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.(row, time);
          }}
        >
          <Tooltip title="删除">
            <DeleteOutlined />
          </Tooltip>
        </span>
      ) : null}
    </div>
  );
}
