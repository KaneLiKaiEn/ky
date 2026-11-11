import { useMemo, useState } from "react";
import { Select } from "antd";
import type { SelectProps } from "antd";
import { useDict } from "../stores/useDictStore";

export interface DictSelectProps extends Omit<
  SelectProps,
  "options" | "loading" | "showSearch" | "filterOption" | "optionFilterProp"
> {
  /** 字典编码；保留公开属性名，查询时传给 dict2 的 dict_code。 */
  dictName: string;
  /** 选中后回传 name（item_name） */
  onNameChange?: (name?: string) => void;
  /** 预置选项（如默认国籍等） */
  extraOptions?: { label: string; value: string }[];
  /** 字典未加载时用来显示已选名称，避免裸显 code */
  valueLabel?: string;
}

type DictOption = { label: string; value: string; name?: string };

/**
 * 字典下拉：展开时再拉取，同编码全量缓存复用，本地过滤，保持 item_name 作为选项值。
 */
const DictSelect: React.FC<DictSelectProps> = ({
  dictName,
  onNameChange,
  extraOptions,
  valueLabel,
  value,
  onChange,
  onOpenChange,
  placeholder,
  ...rest
}) => {
  const { rows, loaded, ensure } = useDict(dictName, { eager: false });
  const [fetching, setFetching] = useState(false);

  const mergedOptions = useMemo(() => {
    const dictOpts: DictOption[] = rows
      .filter((item) => item.item_code != null && item.item_code !== "")
      .map((item) => ({
        label: item.item_name || item.item_code || "",
        value: item.item_name as string,
        name: item.item_name,
      }));
    const extras = (extraOptions ?? []).map((item) => ({
      ...item,
      name: item.label,
    }));
    const map = new Map<string, DictOption>();
    [...extras, ...dictOpts].forEach((item) => map.set(item.value, item));

    // 字典未展开或全量仍未命中时，用已保存名称兜底，避免裸显 code
    if (value != null && value !== "" && !map.has(String(value))) {
      map.set(String(value), {
        label: valueLabel || String(value),
        value: String(value),
        name: valueLabel,
      });
    }

    return Array.from(map.values());
  }, [rows, extraOptions, value, valueLabel]);

  return (
    <Select
      placeholder={placeholder}
      allowClear
      loading={fetching}
      options={mergedOptions}
      value={value}
      showSearch
      optionFilterProp="label"
      onOpenChange={(open) => {
        onOpenChange?.(open);
        if (!open || loaded) return;
        setFetching(true);
        void ensure().finally(() => setFetching(false));
      }}
      onChange={(next, option) => {
        onChange?.(next, option);
        const opt = Array.isArray(option) ? option[0] : option;
        onNameChange?.(
          (opt as { name?: string; label?: string } | undefined)?.name ??
            (opt as { label?: string } | undefined)?.label,
        );
      }}
      {...rest}
    />
  );
};

export default DictSelect;
