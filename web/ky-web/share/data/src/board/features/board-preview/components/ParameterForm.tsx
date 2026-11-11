import { AdaptiveForm } from "../../../../form/AdaptiveForm";
import { useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Form, Input, Select } from "antd";
import dayjs from "dayjs";
import { getDatasetArgOption } from "../../../api/references";
import type {
  ArgValueRow,
  DatasetArgRow,
} from "../../../types/references.d.ts";
import { UnitSelect, DateFields } from "./QueryControls";
import { createUnitSource } from "../unitSource";
import { formLayout } from "../../../styles/formLayout";
import { argumentRows, dataRows, positiveId } from "../model";
import type { LoadQueue } from "../runtime";
import { checkSignal } from "../runtime";
import { useRead } from "../hooks/useRead";

function OptionInput({
  row,
  queue,
  value,
  onChange,
}: {
  row: DatasetArgRow;
  queue: LoadQueue;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const options = useRead(`option:${row.arg_id}:${search}`, (signal) =>
    queue.run(signal, async () => {
      const response = await getDatasetArgOption({
        arg_id: row.arg_id,
        retrieve_input: search,
        retrieve_limit: 100,
      });
      checkSignal(signal);
      return dataRows(response.data).map((item) => ({
        label: String(item.item_name ?? item.item_value ?? ""),
        value: String(item.item_value ?? ""),
      }));
    }),
  );
  return (
    <div>
      <Select
        aria-label={row.arg_name}
        value={value || undefined}
        onChange={(v) => onChange?.(v ?? "")}
        showSearch
        allowClear
        filterOption={false}
        onSearch={setQuery}
        loading={options.loading}
        options={options.data}
        notFoundContent={options.error ? "选项读取失败" : undefined}
      />
      {options.error && (
        <Button size="small" type="link" onClick={options.reload}>
          重试选项
        </Button>
      )}
    </div>
  );
}
function PeriodInput({
  value,
  onChange,
  label,
  disabled,
}: {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <DateFields
      aria-label={label}
      value={value}
      disabled={disabled}
      allowClear
      onChange={(next) =>
        onChange?.(/^\d{4}-\d{2}-\d{2}$/.test(next) ? `${next}~${next}` : next)
      }
    />
  );
}
function UnitInput({
  value,
  onChange,
  source,
  label,
  disabled,
}: {
  value?: string;
  onChange?: (value: string) => void;
  source: import("../../../../metric/features/query-controls/index").UnitSource;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <UnitSelect
      aria-label={label}
      value={positiveId(value)}
      source={source}
      disabled={disabled}
      allowClear
      style={{ width: 240 }}
      onChange={(next) => onChange?.(next == null ? "" : String(next))}
    />
  );
}
export default function ParameterForm({
  rows,
  disabled,
  applied,
  onApply,
  queue,
}: {
  rows: DatasetArgRow[];
  disabled?: boolean;
  applied: ArgValueRow[];
  onApply: (args: ArgValueRow[]) => void;
  queue: LoadQueue;
}) {
  const [form] = Form.useForm();
  const source = useMemo(() => createUnitSource(queue.run), [queue]);
  useEffect(() => {
    form.setFieldsValue(
      Object.fromEntries(applied.map((row) => [row.arg_code!, row.arg_value])),
    );
  }, [applied, form]);
  const unique = [
    ...new Map(
      rows.filter((row) => row.arg_code).map((row) => [row.arg_code!, row]),
    ).values(),
  ];
  return (
    <AdaptiveForm
      form={form}
      disabled={disabled}
      {...formLayout}
      className="bw-form bp-parameters"
      onFinish={(values) => onApply(argumentRows(unique, values))}
    >
      {unique.map((row) => (
        <Form.Item
          key={row.arg_code}
          name={row.arg_code!}
          label={row.arg_name || row.arg_code}
        >
          {row.source_type && row.arg_id ? (
            <OptionInput row={row} queue={queue} />
          ) : row.arg_type === "PERIOD" ? (
            <PeriodInput label={row.arg_name} disabled={disabled} />
          ) : row.arg_type === "UNIT" ? (
            <UnitInput
              source={source}
              label={row.arg_name}
              disabled={disabled}
            />
          ) : row.arg_type === "DATE" ? (
            <DateInput label={row.arg_name} />
          ) : (
            <Input aria-label={row.arg_name} allowClear />
          )}
        </Form.Item>
      ))}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          刷新数据
        </Button>
      </Form.Item>
    </AdaptiveForm>
  );
}
function DateInput({
  value,
  onChange,
  label,
}: {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}) {
  const date = value ? dayjs(value) : undefined;
  return (
    <DatePicker
      aria-label={label}
      value={date?.isValid() ? date : null}
      onChange={(_date, text) => onChange?.(String(text))}
    />
  );
}
