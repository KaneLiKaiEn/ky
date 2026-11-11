import React from "react";
import { Select } from "antd";
import { SOURCE_KIND_OPTIONS } from "../../constants";
import type { SourceItemOption, SourceKind } from "../../types";

interface SourceFillBarProps {
  source: SourceKind;
  value?: string;
  options: SourceItemOption[];
  searching: boolean;
  onSourceChange: (value: SourceKind) => void;
  onSearch: (input: string) => void;
  onSelect: (
    value?: string,
    option?: SourceItemOption | SourceItemOption[],
  ) => void;
}

/** 弹窗底部：选择数据来源并搜索已有数据回填表单 */
const SourceFillBar: React.FC<SourceFillBarProps> = ({
  source,
  value,
  options,
  searching,
  onSourceChange,
  onSearch,
  onSelect,
}) => (
  <div className="flex items-center gap-2 min-w-0 flex-1">
    <Select
      className="w-24 shrink-0"
      value={source}
      options={SOURCE_KIND_OPTIONS}
      onChange={onSourceChange}
    />
    <Select
      className="min-w-0 flex-1"
      showSearch
      allowClear
      filterOption={false}
      placeholder="输入关键字搜索"
      value={value}
      options={options}
      loading={searching}
      onSearch={onSearch}
      onChange={onSelect}
      optionRender={(option) => {
        const data = option.data as SourceItemOption;
        return (
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate">
              {data.item_name || data.label}
            </span>
            {data.item_code ? (
              <span className="shrink-0 text-gray-400">{data.item_code}</span>
            ) : null}
          </div>
        );
      }}
    />
  </div>
);

export default SourceFillBar;
