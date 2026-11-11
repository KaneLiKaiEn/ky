import React, { useState } from "react";
import { Select, Spin } from "antd";

export interface RemoteSelectProps {
  /** 当前选中值（id） */
  value?: string | number;
  /** 当前选中项的展示文本（仅用于选中框回显，不会补进下拉列表） */
  label?: string;
  placeholder?: string;
  width?: number | string;
  /** 检索函数，返回原始对象列表 */
  fetchOptions: (search: string) => Promise<any[]>;
  /** 从对象中取 option value */
  optionValue: (item: any) => string | number;
  /** 从对象中取 option label */
  optionLabel: (item: any) => string;
  /** 选中时回调（携带原始对象） */
  onChange: (item: any) => void;
  zIndex?: number;
}

/** 远程搜索下拉（替代 pocko-ui SelectInput 的 dataService 检索能力） */
export default function RemoteSelect({
  value,
  label,
  placeholder,
  width = 150,
  fetchOptions,
  optionValue,
  optionLabel,
  onChange,
  zIndex,
}: RemoteSelectProps) {
  const [options, setOptions] = useState<{ value: string; label: string; _raw?: any }[]>([]);
  const [loading, setLoading] = useState(false);

  // 统一转成字符串，避免接口返回数字/字符串混用导致 value 匹配不上
  const valueStr = value == null || value === "" ? undefined : String(value);

  async function handleSearch(search: string) {
    try {
      setLoading(true);
      const list = (await fetchOptions(search || "*")) || [];
      const seen = new Set<string>();
      const next: { value: string; label: string; _raw?: any }[] = [];
      // 过滤没有optionValue的项 且去重
      for (const item of list) {
        const v = optionValue(item);
        if (v == null || v === "") continue;
        const key = String(v);
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ value: key, label: optionLabel(item), _raw: item });
      }
      setOptions(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select
      showSearch
      style={{ width }}
      placeholder={placeholder}
      value={valueStr}
      labelRender={(renderProps: any) =>
        label && valueStr && String(renderProps.value) === valueStr ? (
          <span>{label}</span>
        ) : (
          renderProps.label
        )
      }
      options={options}
      loading={loading}
      notFoundContent={loading ? <Spin size="small" /> : null}
      filterOption={false}
      onSearch={handleSearch}
      onDropdownVisibleChange={(open) => {
        if (open && options.length === 0) handleSearch("*");
      }}
      onChange={(val, option: any) => {
        if (option?._raw) {
          onChange(option._raw);
        }
      }}
      popupMatchSelectWidth={false}
      popupRender={(menu) => (zIndex ? <div style={{ zIndex }}>{menu}</div> : menu)}
    />
  );
}
