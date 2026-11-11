import { useEffect, useRef, useState } from "react";
import { Button, Cascader, Select, Space } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  dateBounds,
  defaultDate,
  periodOptions,
} from "../metric-preview/dates";
import type { DateFieldsProps } from "./types";
import "./style.scss";

export default function DateFields({
  value = "",
  onChange,
  disabled = false,
  allowClear = false,
  "aria-label": label,
  style,
  id,
}: DateFieldsProps) {
  let bounds = dateBounds(defaultDate()),
    invalid: string | undefined;
  try {
    if (value) bounds = dateBounds(value);
  } catch (error) {
    invalid = error instanceof Error ? error.message : String(error);
  }
  const year = Number(bounds.start.slice(0, 4));
  const initialDraft = () => ({
    year,
    start: bounds.start.slice(5).split("-"),
    end: bounds.end.slice(5).split("-"),
  });
  const [custom, setCustom] = useState(false),
    [error, setError] = useState<string>(),
    [draft, setDraft] = useState(initialDraft);
  const emitted = useRef<string | undefined>(undefined);
  const emit = (next: string) => {
    if (disabled) return;
    emitted.current = next;
    setError(undefined);
    onChange?.(next);
  };
  useEffect(() => {
    setDraft(initialDraft());
    if (emitted.current !== value) setCustom(false);
    emitted.current = undefined;
    setError(undefined);
  }, [value]);
  const options = periodOptions(year);
  // Report and board PERIOD arguments encode a single day as an equal range.
  // Recognize the same preset without rewriting their controlled value.
  const selectedValue = /^(\d{4}-\d{2}-\d{2})~\1$/.test(value)
    ? value.split("~")[0]
    : value;
  const selectedOption = options.find(
    (option) =>
      option.value === selectedValue ||
      option.children?.some((child) => child.value === selectedValue),
  );
  const isCustom = custom || (!!value && !invalid && !selectedOption);
  const years = Array.from(
    new Set([
      year,
      draft.year,
      ...Array.from({ length: 10 }, (_, index) => dayjs().year() - index),
    ]),
    (number) => ({ label: String(number), value: number }),
  );
  const days = (forEnd = false) =>
    Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0");
      const optionYear =
        draft.year + (forEnd && month < draft.start[0] ? 1 : 0);
      return {
        label: month,
        value: month,
        children: Array.from(
          { length: dayjs(`${optionYear}-${month}-01`).daysInMonth() },
          (_, i) => ({
            label: String(i + 1).padStart(2, "0"),
            value: String(i + 1).padStart(2, "0"),
          }),
        ),
      };
    });
  const apply = (next: typeof draft) => {
    if (disabled) return;
    setDraft(next);
    const endYear = next.year + (next.end[0] < next.start[0] ? 1 : 0);
    const date = `${next.year}-${next.start.join("-")}~${endYear}-${next.end.join("-")}`;
    try {
      dateBounds(date);
      emit(date);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };
  const aria = (part: string, fallback: string) =>
    label ? `${label}${part}` : fallback;
  return (
    <span
      className={`mq-date-fields${allowClear && value ? " mq-clearable" : ""}`}
      style={style}
    >
      <Space.Compact>
        <Select
          id={id}
          aria-label={aria("年份", "查询年份")}
          disabled={disabled}
          style={{ width: 96 }}
          value={isCustom ? 0 : value && !invalid ? year : undefined}
          placeholder="年份"
          options={[...years, { label: "自选(慢)", value: 0 }]}
          onChange={(next) => {
            if (disabled) return;
            if (next === 0) {
              setCustom(true);
              return;
            }
            setCustom(false);
            emit(
              /^\d{4}$/.test(value)
                ? String(next)
                : /^\d{4}-(\d{2}(~\d{2})?|[HQ]\d)$/.test(value)
                  ? value.replace(/^\d{4}/, String(next))
                  : `${next}-${dayjs().format("MM")}`,
            );
          }}
        />
        {isCustom ? (
          <>
            <Select
              aria-label={aria("自选年份", "自选年份")}
              disabled={disabled}
              style={{ width: 76 }}
              value={draft.year}
              options={years}
              onChange={(year) => apply({ ...draft, year })}
            />
            <Cascader
              aria-label={aria("开始日期", "开始日期")}
              disabled={disabled}
              style={{ width: 84 }}
              value={draft.start}
              options={days()}
              allowClear={false}
              displayRender={(labels) => labels.join("-")}
              onChange={(values) =>
                apply({ ...draft, start: values.map(String) })
              }
            />
            <Button disabled>到</Button>
            <Cascader
              aria-label={aria("结束日期", "结束日期")}
              disabled={disabled}
              style={{ width: 84 }}
              value={draft.end}
              options={days(true)}
              allowClear={false}
              displayRender={(labels) => labels.join("-")}
              onChange={(values) =>
                apply({ ...draft, end: values.map(String) })
              }
            />
          </>
        ) : (
          <Cascader
            aria-label={aria("时段", "查询时段")}
            classNames={{ popup: { root: "mq-period-popup" } }}
            disabled={disabled}
            style={{ width: 190 }}
            value={
              value && !invalid
                ? selectedOption?.value === "week"
                  ? ["week", selectedValue]
                  : [selectedValue]
                : []
            }
            options={options}
            allowClear={false}
            placeholder="选择时间段"
            displayRender={(labels) => labels[labels.length - 1]}
            onChange={(values) => {
              if (!values.length) return;
              setCustom(false);
              emit(String(values[values.length - 1]));
            }}
          />
        )}
      </Space.Compact>
      {allowClear && !!value && (
        <Button
          type="text"
          icon={<CloseCircleOutlined />}
          aria-label={aria("清除", "清除时间")}
          disabled={disabled}
          onClick={() => {
            setCustom(false);
            emit("");
          }}
        />
      )}
      {(invalid || error) && (
        <span role="alert">{invalid ? `${value}：${invalid}` : error}</span>
      )}
    </span>
  );
}
