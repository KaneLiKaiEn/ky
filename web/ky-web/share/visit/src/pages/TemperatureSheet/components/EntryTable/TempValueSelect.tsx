import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { Dropdown, Input } from "antd";
import { CloseCircleFilled, DownOutlined } from "@ant-design/icons";

/** 体温特殊状态（红字） */
export const TEMP_SPECIAL_VALUES = [
  "不升",
  "不在",
  "请假",
  "返院",
  "拒测",
  "未测",
] as const;

/** 按步进生成数值网格选项；step=0.1 保留一位小数，step=1 为整数 */
export function buildTempRangeValues(
  min: number,
  max: number,
  step = 0.1,
): string[] {
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min > max ||
    !(step > 0)
  ) {
    return [];
  }
  const decimals =
    step < 1 ? Math.max(0, (String(step).split(".")[1] || "").length) : 0;
  const scale = 10 ** decimals;
  const start = Math.round(min * scale);
  const end = Math.round(max * scale);
  const stepScaled = Math.round(step * scale) || 1;
  const values: string[] = [];
  for (let i = start; i <= end; i += stepScaled) {
    values.push(decimals > 0 ? (i / scale).toFixed(decimals) : String(i));
  }
  return values;
}

export interface TempValueSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  valueMin?: number;
  valueMax?: number;
  /** 数值步进，默认 0.1（体温）；脉搏/呼吸传 1 */
  step?: number;
  /** 是否展示底部特殊状态行，默认 true */
  showSpecial?: boolean;
  /** 是否允许清空，清空时 onChange 传空字符串 */
  allowClear?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** 自定义数值下拉：网格排列 + 可选底部红字特殊项 */
export default function TempValueSelect({
  value,
  onChange,
  valueMin = 35,
  valueMax = 42,
  step = 0.1,
  showSpecial = true,
  allowClear = true,
  placeholder = "请选择",
  disabled,
  className,
  style,
}: TempValueSelectProps) {
  const [open, setOpen] = useState(false);
  const hasValue = value != null && value !== "";

  const numValues = useMemo(
    () => buildTempRangeValues(valueMin, valueMax, step),
    [valueMin, valueMax, step],
  );

  const pick = (next: string) => {
    onChange?.(next);
    setOpen(false);
  };

  const clear = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.("");
    setOpen(false);
  };

  const panel = (
    <div
      className="rounded    bg-(--app-theme-bg-container) p-1 shadow-md"
      style={{ minWidth: 420 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
      >
        {numValues.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              className={[
                "cursor-pointer border-0 bg-transparent px-1 py-0.5 text-center text-xs leading-5 outline-none",
                selected
                  ? "bg-(--app-theme-primary-bg) text-(--app-theme-primary) font-semibold"
                  : " hover:bg-(--app-theme-primary-bg)",
              ].join(" ")}
              onClick={() => pick(n)}
            >
              {n}
            </button>
          );
        })}
      </div>
      {showSpecial ? (
        <div
          className="mt-0.5 grid gap-0 border-t border-(--app-theme-border) pt-0.5"
          style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
        >
          {TEMP_SPECIAL_VALUES.map((s) => {
            const selected = value === s;
            return (
              <button
                key={s}
                type="button"
                className={[
                  "cursor-pointer border-0 bg-transparent px-1 py-0.5 text-center text-xs leading-5 outline-none",
                  selected
                    ? "bg-red-50 font-semibold text-(--app-theme-error)"
                    : "text-(--app-theme-error) hover:bg-red-50",
                ].join(" ")}
                onClick={() => pick(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={(next) => {
        if (!disabled) setOpen(next);
      }}
      trigger={["click"]}
      popupRender={() => panel}
      disabled={disabled}
    >
      <Input
        readOnly
        size="small"
        value={hasValue ? value : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        style={style}
        suffix={
          allowClear && hasValue && !disabled ? (
            <CloseCircleFilled
              className="cursor-pointer text-[10px] text-(--app-theme-text-secondary) opacity-60 hover:opacity-100"
              onClick={clear}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          ) : (
            <DownOutlined className="text-[10px] text-(--app-theme-text-secondary) opacity-60" />
          )
        }
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
      />
    </Dropdown>
  );
}
