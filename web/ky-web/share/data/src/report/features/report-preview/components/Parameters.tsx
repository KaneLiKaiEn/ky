import { AdaptiveForm } from "../../../../form/AdaptiveForm";
import { useMemo } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Select } from "antd";
import dayjs from "dayjs";
import { pinyin } from "pinyin-pro";
import { formLayout } from "../../../styles/formLayout";
import { UnitSelect, DateFields } from "./QueryControls";
import { createUnitSource } from "../unitSource";
import type { RequestRunner } from "../runtime";
import {
  hasTag,
  isOption,
  multiple,
  type Argument,
  type Values,
} from "../model";

function matches(query: string, label: string) {
  const q = query.trim().toLowerCase();
  return (
    label.toLowerCase().includes(q) ||
    pinyin(label, { toneType: "none", nonZh: "removed" })
      .replace(/\s/g, "")
      .includes(q) ||
    pinyin(label, { pattern: "first", nonZh: "removed" })
      .toLowerCase()
      .includes(q)
  );
}
export default function Parameters({
  args,
  values,
  onChange,
  onSearch,
  disabled,
  loading,
  requestRunner,
}: {
  args: Argument[];
  values: Values;
  onChange: (values: Values) => void;
  onSearch: () => void;
  disabled: boolean;
  loading: boolean;
  requestRunner?: RequestRunner;
}) {
  const source = useMemo(
    () => createUnitSource(requestRunner),
    [requestRunner],
  );
  const set = (arg: Argument, value: unknown) =>
    onChange({ ...values, [arg.arg_code!]: value });
  return (
    <AdaptiveForm
      {...formLayout}
      className="rw-form rp-parameters"
      onFinish={onSearch}
    >
      <div className="rp-parameter-fields">
        {args
          .filter((arg) => !hasTag(arg.arg_tag, "NOPARAMS"))
          .map((arg) => {
            const value = values[arg.arg_code!],
              common = { disabled, "aria-label": arg.arg_name || arg.arg_code };
            let field;
            if (arg.arg_type === "PERIOD")
              field = (
                <DateFields
                  {...common}
                  value={String(value ?? "")}
                  onChange={(next) =>
                    set(
                      arg,
                      /^\d{4}-\d{2}-\d{2}$/.test(next)
                        ? `${next}~${next}`
                        : next,
                    )
                  }
                />
              );
            else if (arg.arg_type === "UNIT")
              field = (
                <UnitSelect
                  {...common}
                  source={source}
                  style={{ width: 280 }}
                  allowClear
                  value={value ? Number(value) : undefined}
                  onChange={(next) =>
                    set(arg, next == null ? "" : String(next))
                  }
                />
              );
            else if (["DATE", "DATETIME"].includes(arg.arg_type || ""))
              field = (
                <DatePicker
                  {...common}
                  showTime={arg.arg_type === "DATETIME"}
                  format={
                    arg.arg_type === "DATETIME"
                      ? "YYYY-MM-DD HH:mm:ss"
                      : "YYYY-MM-DD"
                  }
                  value={
                    value && dayjs(String(value)).isValid()
                      ? dayjs(String(value))
                      : null
                  }
                  onChange={(date) =>
                    set(
                      arg,
                      date?.format(
                        arg.arg_type === "DATETIME"
                          ? "YYYY-MM-DD HH:mm:ss"
                          : "YYYY-MM-DD",
                      ) ?? "",
                    )
                  }
                />
              );
            else if (isOption(arg))
              field = (
                <Select
                  {...common}
                  style={{ minWidth: 200 }}
                  allowClear
                  showSearch
                  mode={multiple(arg) ? "multiple" : undefined}
                  maxTagCount="responsive"
                  value={
                    value === "" ? undefined : (value as string | string[])
                  }
                  options={arg.options?.map((option) => ({
                    value: option.item_code,
                    label: option.item_name,
                  }))}
                  filterOption={(input, option) =>
                    matches(input, String(option?.label ?? ""))
                  }
                  onChange={(value) =>
                    set(arg, value ?? (multiple(arg) ? [] : ""))
                  }
                />
              );
            else if (["INT", "DEC"].includes(arg.arg_type || ""))
              field = (
                <InputNumber
                  {...common}
                  stringMode
                  value={value === "" || value == null ? null : String(value)}
                  onChange={(value) => set(arg, value ?? "")}
                />
              );
            else
              field = (
                <Input
                  {...common}
                  value={String(value ?? "")}
                  allowClear
                  onChange={(event) => set(arg, event.target.value)}
                />
              );
            return (
              <Form.Item
                key={arg.arg_code}
                label={arg.arg_name || arg.arg_code}
                help={arg.arg_desc}
              >
                {field}
              </Form.Item>
            );
          })}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            disabled={disabled}
            loading={loading}
          >
            检索
          </Button>
        </Form.Item>
      </div>
    </AdaptiveForm>
  );
}
