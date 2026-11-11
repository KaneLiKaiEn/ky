import { DatePicker, Input, InputNumber, TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { ControlKind } from "../../../model/controlKind";
import type { FieldControlProps } from "./types";

export const DATE_FORMAT = "YYYY-MM-DD";
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";
export const TIME_FORMAT = "HH:mm";

const parseTime = (text: string): Dayjs | null => {
  if (!text) return null;
  const [hour, minute] = text.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return dayjs().hour(hour).minute(minute).second(0).millisecond(0);
};

const parseNumberValue = (text: string): number | null => {
  if (!text.trim()) return null;
  const number = Number(text.trim());
  return Number.isNaN(number) ? null : number;
};

export const BasicControl = ({
  kind,
  elemProp,
  value,
  behavior,
  onPatch,
}: FieldControlProps & { kind: ControlKind }) => {
  const text = value.value_text;
  const isReadOnly = behavior.isReadOnly;
  if (kind === "note") {
    return (
      <div
        className="flex-1 px-2 min-h-8"
        dangerouslySetInnerHTML={{ __html: elemProp.elem_note?.trim() ?? "" }}
      />
    );
  }
  if (kind === "date" || kind === "datetime") {
    const format = kind === "date" ? DATE_FORMAT : DATETIME_FORMAT;
    return (
      <DatePicker
        style={{ flex: 1 }}
        disabled={isReadOnly}
        showTime={kind === "datetime" ? { format: TIME_FORMAT } : undefined}
        value={text ? dayjs(text) : null}
        format={format}
        onChange={(date) => onPatch({ value_text: date ? date.format(format) : "" })}
      />
    );
  }
  if (kind === "time") {
    return (
      <TimePicker
        style={{ flex: 1 }}
        disabled={isReadOnly}
        value={parseTime(text)}
        format={TIME_FORMAT}
        onChange={(time) => onPatch({ value_text: time ? time.format(TIME_FORMAT) : "" })}
      />
    );
  }
  if (kind === "integer" || kind === "number") {
    const decimalPlaces = elemProp.value_length;
    return (
      <InputNumber
        style={{ flex: 1 }}
        disabled={isReadOnly}
        value={parseNumberValue(text)}
        precision={kind === "integer" ? 0 : decimalPlaces != null && decimalPlaces > 0 ? decimalPlaces : undefined}
        step={kind === "integer" ? 1 : decimalPlaces != null && decimalPlaces > 0 ? Math.pow(10, -decimalPlaces) : 0.01}
        onChange={(number) => onPatch({
          value_text: number != null
            ? String(kind === "integer" ? Math.trunc(number) : number)
            : "",
        })}
      />
    );
  }
  if (kind === "textarea") {
    return (
      <Input.TextArea
        style={{ flex: 1 }}
        value={text}
        readOnly={isReadOnly}
        required={behavior.isRequired}
        onChange={(event) => onPatch({ value_text: event.target.value })}
        autoSize={{ minRows: 2 }}
      />
    );
  }
  return (
    <Input
      value={text}
      readOnly={isReadOnly}
      required={behavior.isRequired}
      onChange={(event) => onPatch({ value_text: event.target.value })}
    />
  );
};
