import { CopyOutlined, DeleteOutlined } from "@ant-design/icons";
import { Checkbox, Input, Popover, Tooltip } from "antd";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import type { CellValue, CopyInfo, NursingOption, NursingRow } from "../types";

interface MatrixCellProps {
  row: NursingRow;
  time: string;
  value?: CellValue;
  copyInfoRef: React.MutableRefObject<CopyInfo | undefined>;
  onChange: (
    row: NursingRow,
    time: string,
    value: CellValue,
    isBlur?: boolean,
  ) => void;
  onDelete?: (row: NursingRow, time: string) => void;
  onPaste: (info: CopyInfo, pasteTime: string) => void;
}

const contentOf = (value?: CellValue) =>
  value && Array.isArray(value) ? value[1] : "";

function MatrixCell({
  row,
  time,
  value,
  copyInfoRef,
  onChange,
  onDelete,
  onPaste,
}: MatrixCellProps) {
  const [editing, setEditing] = useState(false);
  const selectedRef = useRef<NursingOption[]>([]);
  const dirtyRef = useRef(false);
  const content = contentOf(value);
  const isCheckbox = (row.type ?? "").toUpperCase().includes("CHECKBOX");
  const recordId = value?.[0] ?? 0;

  const displayText = useMemo(() => {
    if (Array.isArray(content)) {
      return content
        .map((option) => option.option_text)
        .filter(Boolean)
        .join("、");
    }
    return String(content ?? "");
  }, [content]);

  const handleClick = useCallback(() => {
    const empty = Array.isArray(content) ? content.length === 0 : !content;
    const copied = copyInfoRef.current;
    if (empty && copied && copied.row.label === row.label) {
      onPaste(copied, time);
      return;
    }
    if (!row.type?.includes("SUM")) {
      setEditing(true);
    }
  }, [content, copyInfoRef, onPaste, row.label, row.type, time]);

  const handleAction = (event: React.MouseEvent, action: "DELETE" | "COPY") => {
    event.stopPropagation();
    if (!displayText) return;
    if (action === "COPY") {
      copyInfoRef.current = { row, time };
      return;
    }
    onDelete?.(row, time);
  };

  if (!editing) {
    return (
      <div
        className="group relative min-h-6 cursor-pointer px-1 text-center"
        onClick={handleClick}
      >
        {displayText}
        {displayText ? (
          <>
            <span
              className="absolute top-0 left-0 opacity-0 group-hover:opacity-100"
              onClick={(event) => handleAction(event, "DELETE")}
            >
              <Tooltip title="删除">
                <DeleteOutlined />
              </Tooltip>
            </span>
            <span
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100"
              onClick={(event) => handleAction(event, "COPY")}
            >
              <Tooltip title="复制">
                <CopyOutlined />
              </Tooltip>
            </span>
          </>
        ) : null}
      </div>
    );
  }

  if (isCheckbox) {
    const checked = Array.isArray(content)
      ? content
          .map((option) => option.option_text)
          .filter((text): text is string => !!text)
      : [];
    return (
      <Popover
        open
        trigger="click"
        onOpenChange={(visible) => {
          if (visible) return;
          setEditing(false);
          const options = dirtyRef.current
            ? selectedRef.current
            : Array.isArray(content)
              ? content
              : [];
          dirtyRef.current = false;
          onChange(row, time, [recordId, options], true);
        }}
        content={
          <Checkbox.Group
            className="flex flex-col"
            options={(row.elemOptions ?? [])
              .filter((option) => !!option.option_text)
              .map((option) => ({
                label: option.option_text as string,
                value: option.option_text as string,
              }))}
            value={
              dirtyRef.current
                ? selectedRef.current.map((item) => item.option_text!)
                : checked
            }
            onChange={(values) => {
              selectedRef.current =
                row.elemOptions?.filter(
                  (option) =>
                    option.option_text &&
                    (values as string[]).includes(option.option_text),
                ) ?? [];
              dirtyRef.current = true;
              onChange(row, time, [recordId, selectedRef.current]);
            }}
          />
        }
      >
        <div className="min-h-6 cursor-pointer px-1 text-center">
          {displayText}
        </div>
      </Popover>
    );
  }

  return (
    <Input
      className="text-center"
      autoFocus
      defaultValue={typeof content === "string" ? content : ""}
      onChange={(event) => {
        onChange(row, time, [recordId, event.target.value]);
      }}
      onBlur={(event) => {
        onChange(row, time, [recordId, event.target.value], true);
        setEditing(false);
      }}
    />
  );
}

export default memo(MatrixCell, (prev, next) => {
  return (
    prev.time === next.time &&
    prev.value === next.value &&
    prev.onPaste === next.onPaste &&
    prev.onChange === next.onChange &&
    prev.onDelete === next.onDelete
  );
});
