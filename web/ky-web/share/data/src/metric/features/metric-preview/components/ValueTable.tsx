import { useState } from "react";
import { Button, Checkbox, Select, Space, Table } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { display, flatten, numberValue } from "../model";
import type { Filters, ValueRow } from "../types";

export function FilterFields({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (value: Filters) => void;
}) {
  return (
    <div className="mp-filters">
      <Checkbox
        checked={value.showNull}
        onChange={(event) =>
          onChange({ ...value, showNull: event.target.checked })
        }
      >
        空值
      </Checkbox>
      <Space.Compact>
        <Select
          aria-label="明细排序"
          style={{ width: 100 }}
          value={value.sort}
          onChange={(sort) => onChange({ ...value, sort })}
          options={[
            ["缺省排序", ""],
            ["指标升序", "value"],
            ["指标降序", "value_desc"],
            ["同比升序", "yoy"],
            ["同比降序", "yoy_desc"],
          ].map(([label, value]) => ({ label, value }))}
        />
        <Select
          aria-label="排名范围"
          style={{ width: 85 }}
          value={value.top}
          onChange={(top) => onChange({ ...value, top })}
          options={[0, 3, -3, 5, -5, 10, -10].map((number) => ({
            value: number,
            label: number
              ? `${number > 0 ? "前" : "后"}${Math.abs(number)}名`
              : "全部",
          }))}
        />
        <Select
          aria-label="达标筛选"
          style={{ width: 90 }}
          value={value.finish}
          onChange={(finish) => onChange({ ...value, finish })}
          options={[
            { label: "不限", value: "" },
            { label: "达标", value: "1" },
            { label: "未达标", value: "-1" },
          ]}
        />
        <Select
          aria-label="同比筛选"
          style={{ width: 100 }}
          value={value.yoy}
          onChange={(yoy) => onChange({ ...value, yoy })}
          options={[
            { label: "不限", value: "" },
            { label: "同比增长", value: "1" },
            { label: "同比下降", value: "-1" },
          ]}
        />
      </Space.Compact>
    </div>
  );
}
export default function ValueTable({
  rows,
  loading = false,
  onValue,
  expandable,
}: {
  rows: ValueRow[];
  loading?: boolean;
  onValue?: (row: ValueRow) => void;
  expandable?: TableProps<ValueRow>["expandable"];
}) {
  const [raw, setRaw] = useState(false),
    [yoyRaw, setYoyRaw] = useState(false);
  const all = flatten(rows),
    maxAbs = (field: keyof ValueRow) =>
      Math.max(0, ...all.map((row) => Math.abs(numberValue(row[field]) ?? 0)));
  const bar = (
    row: ValueRow,
    field: "metric_value" | "yoy_value" | "yoy_rate" | "pop_rate",
    text: string,
    click?: () => void,
  ) => {
    const value = numberValue(row[field]) ?? 0,
      depth = all.find((item) => item.key === row.key)?.depth ?? 0;
    const max =
      field === "metric_value"
        ? Math.max(
            0,
            ...all
              .filter((item) => item.depth === depth)
              .map((item) => numberValue(item[field]) ?? 0),
          )
        : maxAbs(field);
    const percent = max
      ? Math.min(
          100,
          Math.max(
            0,
            ((field === "metric_value" ? value : Math.abs(value)) / max) * 100,
          ),
        )
      : 0;
    const gradient =
      field === "metric_value"
        ? depth % 2
          ? "linear-gradient(to right,#8B5CF6,rgb(184,157,247))"
          : "linear-gradient(to right,#4D77FF,#00DDFF)"
        : value > 0
          ? "linear-gradient(to right,#c23531,#FFBF00)"
          : value < 0
            ? "linear-gradient(to right,#11c7ae,#80FFA5)"
            : "transparent";
    return (
      <div
        className={`mp-value-bar ${click ? "mp-clickable" : ""}`}
        title={String(row[field] ?? "")}
        onClick={click}
      >
        <span
          className="mp-value-bar-fill"
          style={{
            width: ["+999%", "-999%"].includes(text) ? 0 : `${percent}%`,
            background: gradient,
          }}
        />
        <span>{text}</span>
      </div>
    );
  };
  const columns: ColumnsType<ValueRow> = [
    { title: "名称", dataIndex: "object_name", width: 150, ellipsis: true },
    {
      title: (
        <span>
          <Button
            type="link"
            size="small"
            onClick={() => setRaw((value) => !value)}
          >
            {raw ? "格式" : "原值"}
          </Button>
          值
        </span>
      ),
      align: "right",
      render: (_, row) =>
        bar(
          row,
          "metric_value",
          raw
            ? display(row.metric_value)
            : `${display(row.metric_value_fmt)}${row.metric_value_abbr || ""}${row.metric_value_unit || ""}`,
          onValue && row.kind === "unit" ? () => onValue(row) : undefined,
        ),
    },
    {
      title: (
        <span>
          <Button
            type="link"
            size="small"
            onClick={() => setYoyRaw((value) => !value)}
          >
            {yoyRaw ? "格式" : "原值"}
          </Button>
          同比原值
        </span>
      ),
      align: "right",
      render: (_, row) =>
        bar(
          row,
          "yoy_value",
          display(yoyRaw ? row.yoy_value : row.yoy_value_fmt),
        ),
    },
    {
      title: "同比",
      align: "right",
      render: (_, row) => bar(row, "yoy_rate", display(row.yoy_rate_fmt)),
    },
    {
      title: "环比",
      align: "right",
      render: (_, row) => bar(row, "pop_rate", display(row.pop_rate_fmt)),
    },
    { title: "目标", dataIndex: "goal_desc", render: display },
  ];
  return (
    <Table<ValueRow>
      className="mp-value-table"
      size="small"
      rowKey="key"
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      expandable={expandable}
      scroll={{ x: "max-content" }}
    />
  );
}
