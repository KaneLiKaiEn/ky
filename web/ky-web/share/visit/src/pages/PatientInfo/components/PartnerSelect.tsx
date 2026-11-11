import { useMemo, useRef, useState } from "react";
import { Select } from "antd";
import type { SelectProps } from "antd";
import {
  retrievePartnerListAPI,
  resolveOrgId,
  type PartnerRow,
} from "../api/org";

interface PartnerSelectProps extends Omit<
  SelectProps<number>,
  "options" | "loading" | "showSearch" | "filterOption" | "onSearch"
> {
  /** 已保存的名称，选项还没拉到时用来显示 */
  partnerName?: string;
  onNameChange?: (name?: string) => void;
}

const toOptions = (rows: PartnerRow[]) =>
  rows
    .filter((item) => item.partner_id != null)
    .map((item) => ({
      label: item.partner_name || String(item.partner_id),
      value: item.partner_id as number,
    }));

/**
 * 合作单位：点开后再检索，避免进页面就打机构列表。
 */
const PartnerSelect: React.FC<PartnerSelectProps> = ({
  value,
  onChange,
  onNameChange,
  partnerName,
  ...rest
}) => {
  const [options, setOptions] = useState<{ label: string; value: number }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mergedOptions = useMemo(() => {
    if (value == null || options.some((item) => item.value === value)) {
      return options;
    }
    return [
      { label: partnerName || String(value), value },
      ...options,
    ];
  }, [options, partnerName, value]);

  const load = async (input: string) => {
    setLoading(true);
    try {
      const orgId = await resolveOrgId();
      const res = await retrievePartnerListAPI({
        org_id: orgId,
        retrieve_input: input.trim() || "*",
      });
      setOptions(toOptions(res.partner_list || res.row_list || []));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (input: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void load(input);
    }, 300);
  };

  return (
    <Select
      allowClear
      showSearch
      filterOption={false}
      placeholder="请选择"
      loading={loading}
      options={mergedOptions}
      value={value}
      onOpenChange={(open) => {
        if (open && options.length === 0) void load("*");
      }}
      onSearch={handleSearch}
      onChange={(next, option) => {
        onChange?.(next, option);
        const picked = Array.isArray(option) ? option[0] : option;
        onNameChange?.(
          next == null
            ? undefined
            : (picked as { label?: string } | undefined)?.label,
        );
      }}
      {...rest}
    />
  );
};

export default PartnerSelect;
